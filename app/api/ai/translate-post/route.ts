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
  type TextNodeRef,
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
  sourcePostId: z.string().uuid(),
  targetLocale: z.enum(['en']), // 현재는 KO -> EN만 지원
  mode: z.enum(['create', 'update']),
  updateStrategy: z.enum(['text_only', 'rebase_from_ko']).optional(),
  translateSeo: z.boolean().optional().default(true),
  preserveSlug: z.boolean().optional().default(true),
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

/**
 * 제목을 번역 (단일 텍스트)
 */
async function translateTitle(title: string): Promise<string> {
  if (!title || title.trim().length === 0) {
    return title;
  }

  try {
    const systemPrompt = `You are a professional translator/editor for a technical blog.
- Translate Korean to natural US English
- Maintain technical terms: SOP, LLM, agent, USLab.ai, RAG, TTS, API, SDK (do not translate)
- Keep it concise and natural
- Return ONLY the translated title, nothing else. No explanations, no quotes, just the title.`;

    const userPrompt = `Translate the following blog post title to natural US English:

Title: "${title}"

Translated title:`;

    const { text } = await generateText({
      model: google('models/gemini-2.0-flash'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
    });

    // 응답에서 불필요한 공백이나 따옴표 제거
    return text.trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Title translation error:', error);
    // 번역 실패 시 원문 반환
    return title;
  }
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

    const { sourcePostId, targetLocale, mode, updateStrategy = 'text_only', translateSeo = true, preserveSlug = true } = validated.data;

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

    // 소스 포스트 로드 (KO)
    const { data: sourcePost, error: sourceError } = await supabaseAdmin
      .from('uslab_posts')
      .select('*')
      .eq('id', sourcePostId)
      .single();

    if (sourceError || !sourcePost) {
      return Response.json(
        {
          ok: false,
          error: 'Source post not found',
          code: 'POST_NOT_FOUND',
          details: `Post with id '${sourcePostId}' does not exist`,
        },
        { status: 404 }
      );
    }

    // 소스는 KO여야 함
    if (sourcePost.locale !== 'ko') {
      return Response.json(
        {
          ok: false,
          error: 'Invalid request',
          code: 'INVALID_REQUEST',
          details: 'Source post must be Korean (locale=ko)',
        },
        { status: 400 }
      );
    }

    const sourceContent = sourcePost.content as JSONContent;
    if (!sourceContent) {
      return Response.json(
        {
          ok: false,
          error: 'Invalid request',
          code: 'INVALID_REQUEST',
          details: 'Source post has no content',
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
          targetPostId: sourcePostId,
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

    // 제목 번역
    const translatedTitle = await translateTitle(sourcePost.title);
    const translatedSeoTitle = sourcePost.seo_title 
      ? await translateTitle(sourcePost.seo_title)
      : null;
    const translatedSeoDescription = sourcePost.seo_description
      ? await translateTitle(sourcePost.seo_description) // 설명도 제목 번역 함수 사용 (간단한 텍스트)
      : null;

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

      // EN 포스트 생성/업데이트
      const canonicalId = sourcePost.canonical_id || sourcePost.id;
      
      const { data: existingEnPost } = await supabaseAdmin
        .from('uslab_posts')
        .select('id')
        .eq('canonical_id', canonicalId)
        .eq('locale', 'en')
        .single();

      const enPostData = {
        locale: 'en' as const,
        canonical_id: canonicalId,
        slug: preserveSlug ? sourcePost.slug : `${sourcePost.slug}-en`,
        title: translatedTitle,
        content: translatedDoc,
        seo_title: translateSeo ? translatedSeoTitle : sourcePost.seo_title,
        seo_description: translateSeo ? translatedSeoDescription : sourcePost.seo_description,
        seo_keywords: sourcePost.seo_keywords, // 키워드는 그대로
        thumbnail_url: sourcePost.thumbnail_url,
        is_published: false,
        published_at: null,
        author_id: user.id,
      };

      let targetPostId: string;
      if (existingEnPost) {
        // 업데이트
        const { data: updatedPost, error: updateError } = await supabaseAdmin
          .from('uslab_posts')
          .update(enPostData)
          .eq('id', existingEnPost.id)
          .select('id')
          .single();

        if (updateError || !updatedPost) {
          throw new Error(`Failed to update EN post: ${updateError?.message}`);
        }
        targetPostId = updatedPost.id;
      } else {
        // 생성
        const { data: newPost, error: insertError } = await supabaseAdmin
          .from('uslab_posts')
          .insert(enPostData)
          .select('id')
          .single();

        if (insertError || !newPost) {
          throw new Error(`Failed to create EN post: ${insertError?.message}`);
        }
        targetPostId = newPost.id;
      }

      return Response.json({
        ok: true,
        targetPostId,
        created: !existingEnPost,
        warnings,
        stats: {
          segmentsIn: koRefs.length,
          segmentsTranslated,
          segmentsSkipped,
        },
      });
    } else {
      // Update 모드
      const targetPostId = sourcePost.canonical_id || sourcePost.id;
      
      // EN 포스트 로드
      const { data: targetPost, error: targetError } = await supabaseAdmin
        .from('uslab_posts')
        .select('*')
        .eq('canonical_id', targetPostId)
        .eq('locale', 'en')
        .single();

      if (targetError || !targetPost) {
        return Response.json(
          {
            ok: false,
            error: 'Target post not found',
            code: 'POST_NOT_FOUND',
            details: 'EN version of the post does not exist. Use mode=create first.',
          },
          { status: 404 }
        );
      }

      if (updateStrategy === 'rebase_from_ko') {
        // Rebase: KO 구조로 완전히 재생성
        const baseDoc = JSON.parse(JSON.stringify(sourceContent)) as JSONContent;
        const translatedDoc = applyTranslationsByPath(baseDoc, translations, koRefs);

        // Rebase 모드에서도 제목 번역
        const rebaseTranslatedTitle = await translateTitle(sourcePost.title);
        const rebaseTranslatedSeoTitle = translateSeo && sourcePost.seo_title
          ? await translateTitle(sourcePost.seo_title)
          : targetPost.seo_title;
        const rebaseTranslatedSeoDescription = translateSeo && sourcePost.seo_description
          ? await translateTitle(sourcePost.seo_description)
          : targetPost.seo_description;

        const { error: updateError } = await supabaseAdmin
          .from('uslab_posts')
          .update({
            title: rebaseTranslatedTitle,
            content: translatedDoc,
            seo_title: rebaseTranslatedSeoTitle,
            seo_description: rebaseTranslatedSeoDescription,
          })
          .eq('id', targetPost.id);

        if (updateError) {
          throw new Error(`Failed to update EN post: ${updateError.message}`);
        }

        return Response.json({
          ok: true,
          targetPostId: targetPost.id,
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
        const targetContent = targetPost.content as JSONContent;
        if (!targetContent) {
          return Response.json(
            {
              ok: false,
              error: 'Invalid request',
              code: 'INVALID_REQUEST',
              details: 'Target post has no content',
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
          const enSegments = enRefs.map(ref => ({ id: ref.id, text: ref.text }));
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

        // text_only 업데이트에서도 제목 번역
        const textOnlyTranslatedTitle = await translateTitle(sourcePost.title);
        const textOnlyTranslatedSeoTitle = translateSeo && sourcePost.seo_title
          ? await translateTitle(sourcePost.seo_title)
          : targetPost.seo_title;
        const textOnlyTranslatedSeoDescription = translateSeo && sourcePost.seo_description
          ? await translateTitle(sourcePost.seo_description)
          : targetPost.seo_description;

        // EN 포스트 업데이트
        const { error: updateError } = await supabaseAdmin
          .from('uslab_posts')
          .update({
            title: textOnlyTranslatedTitle,
            content: translatedDoc,
            seo_title: textOnlyTranslatedSeoTitle,
            seo_description: textOnlyTranslatedSeoDescription,
          })
          .eq('id', targetPost.id);

        if (updateError) {
          throw new Error(`Failed to update EN post: ${updateError.message}`);
        }

        return Response.json({
          ok: true,
          targetPostId: targetPost.id,
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


