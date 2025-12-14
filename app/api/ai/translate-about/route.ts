import { google } from '@ai-sdk/google';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { JSONContent } from 'novel';
import {
  collectTranslatableTextNodes,
  applyTranslationsByPath,
  applyTranslationsByIndex,
  applyTranslationsByPathMatch,
  calculatePathMatchRate,
} from '@/lib/translate/tiptapSegments';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GOOGLE_API_KEY를 GOOGLE_GENERATIVE_AI_API_KEY로 매핑
if (process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_API_KEY;
}

// 번역 스키마
const translationSchema = z.object({
  translations: z.array(
    z.object({
      id: z.string(),
      text_en: z.string(),
    })
  ),
});

// 요청 스키마
const requestSchema = z.object({
  targetLocale: z.enum(['en']), // 현재는 KO -> EN만 지원
  mode: z.enum(['create', 'update']),
  updateStrategy: z.enum(['text_only', 'rebase_from_ko']).optional(),
});

/**
 * Gemini 2.0 Flash를 사용하여 텍스트 세그먼트 배열을 번역
 */
async function translateSegments(
  segments: Array<{ id: string; text: string }>,
  retryCount = 0
): Promise<Array<{ id: string; text_en: string }>> {
  const maxRetries = 1;

  try {
    const systemPrompt = `You are a professional translator/editor for a technical blog.
- Translate Korean to natural US English
- Maintain technical terms: SOP, LLM, agent, USLab.ai, RAG, TTS, API, SDK (do not translate)
- Keep code blocks, URLs, and inline code unchanged
- Return valid JSON only`;

    const userPrompt = `Translate the following text segments while maintaining their IDs:

${segments.map(s => `ID: ${s.id}\nText: ${s.text}`).join('\n\n')}

Return JSON in this format:
{
  "translations": [
    { "id": "${segments[0]?.id || 'seg_1'}", "text_en": "translated text" },
    ...
  ]
}

Important: Return the same number of translations as input segments. Keep all IDs.`;

    const result = await generateObject({
      model: google('models/gemini-2.0-flash'),
      schema: translationSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
    });

    const translations = result.object.translations;

    // 검증: ID가 모두 일치하는지 확인
    const inputIds = new Set(segments.map(s => s.id));
    const outputIds = new Set(translations.map(t => t.id));
    
    if (inputIds.size !== outputIds.size || ![...inputIds].every(id => outputIds.has(id))) {
      if (retryCount < maxRetries) {
        // 재시도 (더 엄격한 프롬프트)
        return translateSegments(segments, retryCount + 1);
      }
      
      // 누락된 ID는 원문 유지
      const missingIds = [...inputIds].filter(id => !outputIds.has(id));
      const missingTranslations = segments
        .filter(s => missingIds.includes(s.id))
        .map(s => ({ id: s.id, text_en: s.text })); // 원문 유지
      
      return [...translations, ...missingTranslations];
    }

    return translations;
  } catch (error) {
    console.error('Translation error:', error);
    if (retryCount < maxRetries) {
      // 재시도
      return translateSegments(segments, retryCount + 1);
    }
    throw error;
  }
}

/**
 * 세그먼트를 청크로 분할하여 병렬 번역
 */
async function translateSegmentsInChunks(
  segments: Array<{ id: string; text: string }>,
  chunkSize = 150
): Promise<Array<{ id: string; text_en: string }>> {
  if (segments.length <= chunkSize) {
    return translateSegments(segments);
  }

  // 청크로 분할
  const chunks: Array<Array<{ id: string; text: string }>> = [];
  for (let i = 0; i < segments.length; i += chunkSize) {
    chunks.push(segments.slice(i, i + chunkSize));
  }

  // 병렬 번역
  const chunkResults = await Promise.all(
    chunks.map(chunk => translateSegments(chunk))
  );

  // 결과 병합
  return chunkResults.flat();
}

export async function POST(req: Request) {
  try {
    // 인증 확인
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return Response.json(
        {
          ok: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
          details: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return Response.json(
        {
          ok: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
          details: authError?.message || 'User not authenticated',
        },
        { status: 401 }
      );
    }

    // 요청 본문 파싱 및 검증
    const body = await req.json();
    const validated = requestSchema.safeParse(body);
    
    if (!validated.success) {
      return Response.json(
        {
          ok: false,
          error: 'Invalid request',
          code: 'INVALID_REQUEST',
          details: validated.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      );
    }

    const { targetLocale, mode, updateStrategy = 'text_only' } = validated.data;

    // Google API 키 확인
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return Response.json(
        {
          ok: false,
          error: 'Translation failed',
          code: 'TRANSLATION_ERROR',
          details: 'Google API 키가 설정되지 않았습니다.',
        },
        { status: 500 }
      );
    }

    // Service Role 클라이언트 (RLS 우회)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // KO 소개 페이지 로드
    const { data: koAbout, error: koError } = await supabaseAdmin
      .from('uslab_about')
      .select('*')
      .eq('locale', 'ko')
      .single();

    if (koError || !koAbout) {
      return Response.json(
        {
          ok: false,
          error: 'Source about not found',
          code: 'ABOUT_NOT_FOUND',
          details: 'Korean about page does not exist. Please create it first.',
        },
        { status: 404 }
      );
    }

    const sourceContent = koAbout.content as JSONContent;
    if (!sourceContent) {
      return Response.json(
        {
          ok: false,
          error: 'Invalid request',
          code: 'INVALID_REQUEST',
          details: 'Source about has no content',
        },
        { status: 400 }
      );
    }

    // KO에서 번역 대상 세그먼트 수집
    const koRefs = collectTranslatableTextNodes(sourceContent);
    
    if (koRefs.length === 0) {
      return Response.json(
        {
          ok: true,
          created: false,
          warnings: ['No translatable text segments found'],
          stats: {
            segmentsIn: 0,
            segmentsTranslated: 0,
            segmentsSkipped: 0,
          },
        },
        { status: 200 }
      );
    }

    // Gemini로 번역
    const segmentsToTranslate = koRefs.map(ref => ({ id: ref.id, text: ref.text }));
    const translations = await translateSegmentsInChunks(segmentsToTranslate);

    // 번역 결과 검증
    const translationMap = new Map(translations.map(t => [t.id, t.text_en]));
    const warnings: string[] = [];
    let segmentsTranslated = 0;
    let segmentsSkipped = 0;

    koRefs.forEach(ref => {
      if (translationMap.has(ref.id)) {
        segmentsTranslated++;
      } else {
        segmentsSkipped++;
        warnings.push(`Segment ${ref.id} was not translated`);
      }
    });

    if (mode === 'create') {
      // Create 모드: KO 구조를 복제하고 텍스트만 번역
      const baseDoc = JSON.parse(JSON.stringify(sourceContent)) as JSONContent;
      const translatedDoc = applyTranslationsByPath(baseDoc, translations, koRefs);

      // EN 소개 페이지 생성/업데이트
      const { data: existingEnAbout } = await supabaseAdmin
        .from('uslab_about')
        .select('id')
        .eq('locale', 'en')
        .single();

      const enAboutData = {
        locale: 'en' as const,
        content: translatedDoc,
        author_id: user.id,
      };

      if (existingEnAbout) {
        // 업데이트
        const { error: updateError } = await supabaseAdmin
          .from('uslab_about')
          .update(enAboutData)
          .eq('id', existingEnAbout.id);

        if (updateError) {
          throw new Error(`Failed to update EN about: ${updateError.message}`);
        }
      } else {
        // 생성
        const { error: insertError } = await supabaseAdmin
          .from('uslab_about')
          .insert(enAboutData);

        if (insertError) {
          throw new Error(`Failed to create EN about: ${insertError.message}`);
        }
      }

      return Response.json({
        ok: true,
        created: !existingEnAbout,
        warnings,
        stats: {
          segmentsIn: koRefs.length,
          segmentsTranslated,
          segmentsSkipped,
        },
      });
    } else {
      // Update 모드
      // EN 소개 페이지 로드
      const { data: enAbout, error: enError } = await supabaseAdmin
        .from('uslab_about')
        .select('*')
        .eq('locale', 'en')
        .single();

      if (enError || !enAbout) {
        return Response.json(
          {
            ok: false,
            error: 'Target about not found',
            code: 'ABOUT_NOT_FOUND',
            details: 'EN version of the about page does not exist. Use mode=create first.',
          },
          { status: 404 }
        );
      }

      if (updateStrategy === 'rebase_from_ko') {
        // Rebase: KO 구조로 완전히 재생성
        const baseDoc = JSON.parse(JSON.stringify(sourceContent)) as JSONContent;
        const translatedDoc = applyTranslationsByPath(baseDoc, translations, koRefs);

        const { error: updateError } = await supabaseAdmin
          .from('uslab_about')
          .update({
            content: translatedDoc,
          })
          .eq('id', enAbout.id);

        if (updateError) {
          throw new Error(`Failed to update EN about: ${updateError.message}`);
        }

        return Response.json({
          ok: true,
          created: false,
          warnings: [...warnings, 'EN structure was completely replaced with KO structure'],
          stats: {
            segmentsIn: koRefs.length,
            segmentsTranslated,
            segmentsSkipped,
          },
        });
      } else {
        // text_only: EN 구조 유지, 텍스트만 업데이트
        const targetContent = enAbout.content as JSONContent;
        if (!targetContent) {
          return Response.json(
            {
              ok: false,
              error: 'Invalid request',
              code: 'INVALID_REQUEST',
              details: 'Target about has no content',
            },
            { status: 400 }
          );
        }

        // EN에서 번역 대상 세그먼트 수집
        const enRefs = collectTranslatableTextNodes(targetContent);

        // 경로 기반 매칭률 계산
        const pathMatchRate = calculatePathMatchRate(koRefs, enRefs);

        let translatedDoc: JSONContent;
        let finalWarnings = [...warnings];

        if (pathMatchRate >= 0.8) {
          // 경로 기반 매칭 사용 (80% 이상)
          translatedDoc = applyTranslationsByPathMatch(targetContent, koRefs, enRefs, translations);
        } else if (pathMatchRate >= 0.5) {
          // 순서 기반 fallback (50~80%)
          const minLength = Math.min(koRefs.length, enRefs.length);
          const matchedTranslations = translations.slice(0, minLength);
          translatedDoc = applyTranslationsByIndex(targetContent, enRefs, matchedTranslations);
          finalWarnings.push(`Path match rate is ${(pathMatchRate * 100).toFixed(1)}%. Used index-based matching as fallback.`);
        } else {
          // 구조가 너무 다름 (50% 미만)
          const mismatch = Math.abs(koRefs.length - enRefs.length);
          const mismatchPercent = (mismatch / Math.max(koRefs.length, enRefs.length)) * 100;

          if (mismatchPercent >= 20) {
            return Response.json(
              {
                ok: false,
                error: 'Structure mismatch',
                code: 'STRUCTURE_MISMATCH',
                details: `EN 텍스트 노드 수(${enRefs.length})와 KO 텍스트 노드 수(${koRefs.length})가 다릅니다. rebase_from_ko 전략을 사용하거나 EN 구조를 KO와 맞춰주세요.`,
                stats: {
                  koSegments: koRefs.length,
                  enSegments: enRefs.length,
                  mismatch,
                },
                suggestion: "Use updateStrategy='rebase_from_ko' to regenerate from KO structure",
              },
              { status: 409 }
            );
          } else {
            // 작은 차이: 경고만 추가하고 계속 진행
            const minLength = Math.min(koRefs.length, enRefs.length);
            const matchedTranslations = translations.slice(0, minLength);
            translatedDoc = applyTranslationsByIndex(targetContent, enRefs, matchedTranslations);
            finalWarnings.push(`Path match rate is ${(pathMatchRate * 100).toFixed(1)}%. Structure mismatch detected but proceeding with index-based matching.`);
          }
        }

        // EN 소개 페이지 업데이트
        const { error: updateError } = await supabaseAdmin
          .from('uslab_about')
          .update({
            content: translatedDoc,
          })
          .eq('id', enAbout.id);

        if (updateError) {
          throw new Error(`Failed to update EN about: ${updateError.message}`);
        }

        return Response.json({
          ok: true,
          created: false,
          warnings: finalWarnings,
          stats: {
            segmentsIn: koRefs.length,
            segmentsTranslated,
            segmentsSkipped,
          },
        });
      }
    }
  } catch (error) {
    console.error('Translation API error:', error);
    return Response.json(
      {
        ok: false,
        error: 'Translation failed',
        code: 'TRANSLATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

