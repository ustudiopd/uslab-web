import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function POST(req: Request) {
  try {
    const { title } = await req.json();

    if (!title || typeof title !== 'string') {
      return Response.json(
        { error: '제목이 필요합니다.' },
        { status: 400 }
      );
    }

    // GOOGLE_API_KEY를 GOOGLE_GENERATIVE_AI_API_KEY로 매핑
    // @ai-sdk/google는 GOOGLE_GENERATIVE_AI_API_KEY 환경 변수를 찾습니다
    if (process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_API_KEY;
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return Response.json(
        { error: 'Google API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { text } = await generateText({
      model: google('models/gemini-2.0-flash'),
      prompt: `
Convert the following blog post title into a SEO-friendly URL slug in English.

Rules:
1. Translate the meaning to English (not romanization).
2. Use lowercase only.
3. Replace spaces with hyphens (-).
4. Remove special characters.
5. Keep it concise (under 50 characters).
6. Return ONLY the slug string, nothing else. No explanations, no quotes, just the slug.

Title: "${title}"

Slug:`,
    });

    // 응답에서 불필요한 공백이나 따옴표 제거
    const slug = text.trim().replace(/^["']|["']$/g, '').toLowerCase();

    return Response.json({ slug });
  } catch (error) {
    console.error('Error generating slug:', error);
    return Response.json(
      { error: 'Slug 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


