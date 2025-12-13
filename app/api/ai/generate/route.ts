import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GOOGLE_API_KEY를 GOOGLE_GENERATIVE_AI_API_KEY로 매핑
if (process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_API_KEY;
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

    const { prompt, context } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return Response.json(
        { error: 'prompt가 필요합니다.' },
        { status: 400 }
      );
    }

    // Vercel AI SDK로 Streaming 응답 생성
    const result = await streamText({
      model: google('models/gemini-2.0-flash'),
      prompt: context 
        ? `${context}\n\n계속 작성해주세요: ${prompt}`
        : `다음 내용을 이어서 작성해주세요: ${prompt}`,
    });

    // Streaming 응답 반환
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Error generating text:', error);
    return Response.json(
      { 
        error: 'AI 이어쓰기 중 오류가 발생했습니다.',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}






