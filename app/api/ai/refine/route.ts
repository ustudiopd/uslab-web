import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GOOGLE_API_KEY를 GOOGLE_GENERATIVE_AI_API_KEY로 매핑
if (process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_API_KEY;
}

// 응답 스키마 (간단한 검증)
interface RefineResponse {
  original: string;
  suggested: string;
  reason: string;
  diff: string;
}

export async function POST(req: Request) {
  try {
    // 인증 확인 (관리자만 사용 가능)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return Response.json(
        { error: 'Authorization header is required' },
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
        { error: 'User not authenticated', details: authError?.message },
        { status: 401 }
      );
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return Response.json(
        { error: 'Google API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { post_id, text, tone_prompt, locale } = await req.json();

    if (!text || typeof text !== 'string') {
      return Response.json(
        { error: 'text가 필요합니다.' },
        { status: 400 }
      );
    }

    // ⚠️ 중요: AI 교정 적용 전 버전 스냅샷 저장
    if (post_id && supabaseServiceRoleKey) {
      const serviceSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { data: post } = await serviceSupabase
        .from('uslab_posts')
        .select('content')
        .eq('id', post_id)
        .single();
      
      if (post) {
        await serviceSupabase.from('uslab_post_versions').insert({
          post_id,
          content: post.content,
          change_log: 'AI 교정 전 스냅샷',
        });
      }
    }

    const prompt = `
다음 텍스트를 ${locale === 'ko' ? '한국어' : '영어'}로 교정해주세요.
${tone_prompt ? `톤앤매너: ${tone_prompt}` : ''}

원본:
${text}

교정된 텍스트와 수정 이유를 JSON 형식으로 반환해주세요:
{
  "original": "원본 텍스트",
  "suggested": "교정된 텍스트",
  "reason": "수정 이유",
  "diff": "변경 사항 요약"
}

주의: 반드시 유효한 JSON 형식으로만 응답하세요.
    `;

    try {
      const { text: responseText } = await generateText({
        model: google('models/gemini-2.0-flash'),
        prompt,
      });

      // JSON 파싱 및 검증
      let parsed: RefineResponse;
      try {
        // JSON 코드 블록 제거 (```json ... ```)
        const cleanedText = responseText
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
        
        parsed = JSON.parse(cleanedText);
      } catch (parseError) {
        // JSON 파싱 실패 시 fallback
        console.error('JSON parse error:', parseError);
        return Response.json({
          original: text,
          suggested: text,
          reason: 'AI 교정 실패: JSON 파싱 오류. 원본을 그대로 사용합니다.',
          diff: '',
        });
      }

      // 기본 검증
      if (!parsed.suggested || typeof parsed.suggested !== 'string') {
        parsed.suggested = text;
      }
      if (!parsed.original || typeof parsed.original !== 'string') {
        parsed.original = text;
      }
      if (!parsed.reason || typeof parsed.reason !== 'string') {
        parsed.reason = 'AI 교정이 적용되었습니다.';
      }
      if (!parsed.diff || typeof parsed.diff !== 'string') {
        parsed.diff = '';
      }

      return Response.json(parsed);
    } catch (error: any) {
      // AI 호출 실패 시 fallback
      console.error('AI refine error:', error);
      return Response.json({
        original: text,
        suggested: text,
        reason: 'AI 교정 실패: 원본을 그대로 사용합니다.',
        diff: '',
      });
    }
  } catch (error: any) {
    console.error('Error in refine API:', error);
    return Response.json(
      { 
        error: 'AI 교정 중 오류가 발생했습니다.',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}






