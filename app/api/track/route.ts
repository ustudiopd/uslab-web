import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/client';
import {
  isBot,
  parseDeviceType,
  parseReferrerHost,
  parseUTM,
  parseLocaleFromPath,
} from '@/lib/utils/tracking';

/**
 * 트래킹 요청 스키마
 */
const trackSchema = z.object({
  session_key: z.string().max(128),
  page_path: z.string().max(2048),
  post_id: z.string().uuid().nullable().optional(),
  about_id: z.string().uuid().nullable().optional(),
  locale: z.enum(['ko', 'en']).nullable().optional(),
  referrer: z.string().max(2048).nullable().optional(),
  utm: z
    .object({
      source: z.string().max(100).nullable().optional(),
      medium: z.string().max(100).nullable().optional(),
      campaign: z.string().max(100).nullable().optional(),
      term: z.string().max(100).nullable().optional(),
      content: z.string().max(100).nullable().optional(),
    })
    .nullable()
    .optional(),
});

/**
 * POST /api/track
 * 
 * 페이지뷰 트래킹 API
 * - Bot 필터링 적용
 * - 세션 upsert (없으면 생성, 있으면 last_seen_at 업데이트)
 * - 페이지뷰 insert
 * 
 * @param request 트래킹 요청
 * @returns 204 No Content (성공/실패 모두)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. User-Agent 읽기 및 봇 필터링
    const userAgent = request.headers.get('user-agent');
    if (isBot(userAgent)) {
      // 봇이면 DB insert 하지 않고 204 반환
      return new NextResponse(null, { status: 204 });
    }

    // 2. Request body 파싱 및 검증
    const body = await request.json();
    const validated = trackSchema.parse(body);

    // 3. Referrer 및 UTM 파싱
    const referrerHost = parseReferrerHost(validated.referrer || null);
    const deviceType = parseDeviceType(userAgent);

    // locale이 없으면 page_path에서 추출 시도
    let locale = validated.locale;
    if (!locale) {
      locale = parseLocaleFromPath(validated.page_path);
    }

    // 4. Service role 클라이언트 생성 (RLS 우회)
    const supabase = createServerClient();

    // 5. 세션 upsert
    // - session_key가 있으면 last_seen_at만 업데이트
    // - 없으면 새로 생성 (landing_path, referrer, utm 저장)
    const { data: existingSession } = await (supabase as any)
      .from('uslab_sessions')
      .select('id, landing_path')
      .eq('session_key', validated.session_key)
      .single();

    let sessionId: string;

    if (existingSession) {
      // 기존 세션: last_seen_at만 업데이트
      const { data: updatedSession, error: updateError } = await (supabase as any)
        .from('uslab_sessions')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('session_key', validated.session_key)
        .select('id')
        .single();

      if (updateError || !updatedSession) {
        console.error('Error updating session:', updateError);
        return new NextResponse(null, { status: 204 }); // 에러여도 204
      }

      sessionId = updatedSession.id;
    } else {
      // 새 세션: 생성
      const { data: newSession, error: insertError } = await (supabase as any)
        .from('uslab_sessions')
        .insert({
          session_key: validated.session_key,
          landing_path: validated.page_path,
          referrer: validated.referrer || null,
          referrer_host: referrerHost,
          utm_source: validated.utm?.source || null,
          utm_medium: validated.utm?.medium || null,
          utm_campaign: validated.utm?.campaign || null,
          utm_term: validated.utm?.term || null,
          utm_content: validated.utm?.content || null,
          user_agent: userAgent,
          device_type: deviceType,
          created_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertError || !newSession) {
        console.error('Error creating session:', insertError);
        return new NextResponse(null, { status: 204 }); // 에러여도 204
      }

      sessionId = newSession.id;
    }

    // 6. 페이지뷰 insert
    const { error: pageViewError } = await (supabase as any)
      .from('uslab_page_views')
      .insert({
        session_id: sessionId,
        post_id: validated.post_id || null,
        about_id: validated.about_id || null,
        page_path: validated.page_path,
        locale: locale,
        created_at: new Date().toISOString(),
      });

    if (pageViewError) {
      console.error('Error inserting page view:', pageViewError);
      // 에러여도 204 반환 (UX 영향 없음)
    }

    // 7. 성공 응답 (204 No Content)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // 모든 에러는 로그만 남기고 204 반환 (UX 영향 없음)
    if (error instanceof z.ZodError) {
      console.error('Track request validation error:', error.issues);
    } else {
      console.error('Track request error:', error);
    }
    return new NextResponse(null, { status: 204 });
  }
}


