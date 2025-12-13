import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GOOGLE_API_KEY를 GOOGLE_GENERATIVE_AI_API_KEY로 매핑
if (process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_API_KEY;
}

// SEO 응답 스키마
interface SEOResponse {
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
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

    const { full_content, title, locale } = await req.json();

    if (!title || typeof title !== 'string') {
      return Response.json(
        { error: 'title이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!full_content || typeof full_content !== 'string') {
      return Response.json(
        { error: 'full_content가 필요합니다.' },
        { status: 400 }
      );
    }

    const prompt = `
다음 블로그 포스트의 SEO 메타데이터를 생성해주세요.

제목: ${title}
내용: ${full_content.substring(0, 2000)}${full_content.length > 2000 ? '...' : ''}

다음 JSON 형식으로만 응답해주세요 (반드시 JSON 형식):
{
  "seo_title": "검색 엔진 최적화된 제목 (60자 이내)",
  "seo_description": "검색 엔진 최적화된 설명 (160자 이내)",
  "seo_keywords": ["키워드1", "키워드2", "키워드3"]
}

주의: 
- seo_keywords는 반드시 JSON 배열(string[]) 형식으로만 응답하세요.
- seo_title은 60자 이내로 작성하세요.
- seo_description은 160자 이내로 작성하세요.
- 반드시 유효한 JSON 형식으로만 응답하세요.
    `;

    try {
      const { text: responseText } = await generateText({
        model: google('models/gemini-2.0-flash'),
        prompt,
      });

      // JSON 파싱 및 검증
      let parsed: SEOResponse;
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
          seo_title: title.substring(0, 60),
          seo_description: full_content.substring(0, 160).replace(/\n/g, ' ').trim(),
          seo_keywords: [],
        });
      }

      // 기본 검증 및 길이 제한
      if (!parsed.seo_title || typeof parsed.seo_title !== 'string') {
        parsed.seo_title = title.substring(0, 60);
      } else {
        parsed.seo_title = parsed.seo_title.substring(0, 60);
      }

      if (!parsed.seo_description || typeof parsed.seo_description !== 'string') {
        parsed.seo_description = full_content.substring(0, 160).replace(/\n/g, ' ').trim();
      } else {
        parsed.seo_description = parsed.seo_description.substring(0, 160);
      }

      if (!parsed.seo_keywords || !Array.isArray(parsed.seo_keywords)) {
        parsed.seo_keywords = [];
      } else {
        // 배열 요소가 문자열인지 확인
        parsed.seo_keywords = parsed.seo_keywords
          .filter((kw): kw is string => typeof kw === 'string')
          .slice(0, 10); // 최대 10개로 제한
      }

      return Response.json(parsed);
    } catch (error: any) {
      // AI 호출 실패 시 fallback
      console.error('AI SEO error:', error);
      return Response.json({
        seo_title: title.substring(0, 60),
        seo_description: full_content.substring(0, 160).replace(/\n/g, ' ').trim(),
        seo_keywords: [],
      });
    }
  } catch (error: any) {
    console.error('Error in SEO API:', error);
    return Response.json(
      { 
        error: 'SEO 생성 중 오류가 발생했습니다.',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}






