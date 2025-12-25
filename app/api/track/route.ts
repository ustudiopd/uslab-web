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
import {
  getAnalyticsTableName,
  ANALYTICS_ENABLED,
} from '@/lib/config/analytics';

/**
 * 트래킹 요청 스키마 (v2)
 * 하위 호환성을 위해 기존 형식도 지원
 * page_view는 선택적 (이벤트만 전송 가능)
 */
const trackSchemaV2 = z.object({
  session_key: z.string().max(128),
  page_view: z
    .object({
      id: z.string().uuid(),
      page_path: z.string().max(2048),
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
    })
    .optional(),
  post_id: z.string().uuid().nullable().optional(),
  about_id: z.string().uuid().nullable().optional(),
  events: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string().max(100),
        page_view_id: z.string().uuid().nullable().optional(),
        page_path: z.string().max(2048),
        props: z.record(z.string(), z.any()).optional().default({}),
        client_ts: z.number().int().positive().nullable().optional(),
      })
    )
    .optional()
    .default([]),
});

/**
 * 기존 스키마 (하위 호환성)
 */
const trackSchemaV1 = z.object({
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
    // Analytics 비활성화 시 즉시 반환
    if (!ANALYTICS_ENABLED) {
      return new NextResponse(null, { status: 204 });
    }

    // 1. User-Agent 읽기 및 봇 필터링
    const userAgent = request.headers.get('user-agent');
    if (isBot(userAgent)) {
      // 봇이면 DB insert 하지 않고 204 반환
      return new NextResponse(null, { status: 204 });
    }

    // 2. Request body 파싱 및 검증 (v2 우선, v1 fallback)
    const body = await request.json();
    let validated: z.infer<typeof trackSchemaV2> | z.infer<typeof trackSchemaV1>;
    let isV2 = false;

    try {
      validated = trackSchemaV2.parse(body);
      isV2 = true;
    } catch {
      // v1 형식으로 시도 (하위 호환성)
      validated = trackSchemaV1.parse(body);
      isV2 = false;
    }

    // v2 형식으로 정규화
    let pageViewId: string | null = null;
    let pagePath: string = '';
    let locale: 'ko' | 'en' | null = null;
    let referrer: string | null = null;
    let utm: any = null;
    let hasPageView = false;

    if (isV2) {
      const v2 = validated as z.infer<typeof trackSchemaV2>;
      if (v2.page_view) {
        hasPageView = true;
        pageViewId = v2.page_view.id;
        pagePath = v2.page_view.page_path;
        locale = v2.page_view.locale || null;
        referrer = v2.page_view.referrer || null;
        utm = v2.page_view.utm || null;
      }
    } else {
      const v1 = validated as z.infer<typeof trackSchemaV1>;
      // v1에서 v2로 변환: page_view_id 생성
      hasPageView = true;
      pageViewId = crypto.randomUUID();
      pagePath = v1.page_path;
      locale = v1.locale || null;
      referrer = v1.referrer || null;
      utm = v1.utm || null;
    }

    // locale이 없으면 page_path에서 추출 시도
    if (!locale && pagePath) {
      locale = parseLocaleFromPath(pagePath);
    }

    // 3. Referrer 및 UTM 파싱
    const referrerHost = parseReferrerHost(referrer);
    const deviceType = parseDeviceType(userAgent);

    // 4. Service role 클라이언트 생성 (RLS 우회)
    const supabase = createServerClient();

    const sessionsTable = getAnalyticsTableName('sessions');
    const pageViewsTable = getAnalyticsTableName('page_views');

    // page_view가 없고 events만 있는 경우, 세션만 확인
    if (!hasPageView) {
      const v2 = validated as z.infer<typeof trackSchemaV2>;
      const events = v2.events || [];
      
      if (events.length === 0) {
        // page_view도 없고 events도 없으면 204 반환
        return new NextResponse(null, { status: 204 });
      }

      // 세션만 확인 (last_seen_at 업데이트)
      const sessionKey = v2.session_key;
      const { data: existingSession } = await (supabase as any)
        .from(sessionsTable)
        .select('id, last_seen_at')
        .eq('session_key', sessionKey)
        .single();

      let sessionId: string | null = null;

      if (existingSession) {
        sessionId = existingSession.id;
        // last_seen_at 업데이트 (throttle: 3분)
        const lastSeen = existingSession.last_seen_at
          ? new Date(existingSession.last_seen_at)
          : null;
        const now = new Date();
        const shouldUpdate =
          !lastSeen || now.getTime() - lastSeen.getTime() > 3 * 60 * 1000;

        if (shouldUpdate) {
          await (supabase as any)
            .from(sessionsTable)
            .update({ last_seen_at: now.toISOString() })
            .eq('session_key', sessionKey);
        }
      } else {
        // 세션이 없으면 events만 전송 불가 (세션 필요)
        return new NextResponse(null, { status: 204 });
      }

      // Events만 전송
      const eventsTable = getAnalyticsTableName('events');
      const eventsToInsert = events.map((event) => ({
        id: event.id,
        session_id: sessionId,
        page_view_id: event.page_view_id || null,
        name: event.name,
        page_path: event.page_path || '',
        props: event.props || {},
        client_ts: event.client_ts || null,
        created_at: new Date().toISOString(),
      }));

      const { error: eventsError } = await (supabase as any)
        .from(eventsTable)
        .insert(eventsToInsert);

      if (eventsError) {
        console.error('Error inserting events:', eventsError);
      }

      return new NextResponse(null, { status: 204 });
    }

    // 5. 세션 upsert (page_view가 있는 경우)
    // - session_key가 있으면 last_seen_at만 업데이트 (throttle: 3분 이내면 생략)
    // - 없으면 새로 생성 (landing_path, referrer, utm 저장)
    const sessionKey = isV2
      ? (validated as z.infer<typeof trackSchemaV2>).session_key
      : (validated as z.infer<typeof trackSchemaV1>).session_key;

    const { data: existingSession } = await (supabase as any)
      .from(sessionsTable)
      .select('id, landing_path, last_seen_at')
      .eq('session_key', sessionKey)
      .single();

    let sessionId: string;

    if (existingSession) {
      // 기존 세션: last_seen_at 업데이트 (throttle: 3분 이내면 생략)
      const lastSeen = existingSession.last_seen_at
        ? new Date(existingSession.last_seen_at)
        : null;
      const now = new Date();
      const shouldUpdate =
        !lastSeen || now.getTime() - lastSeen.getTime() > 3 * 60 * 1000; // 3분

      if (shouldUpdate) {
        const { data: updatedSession, error: updateError } = await (supabase as any)
          .from(sessionsTable)
          .update({ last_seen_at: now.toISOString() })
          .eq('session_key', sessionKey)
          .select('id')
          .single();

        if (updateError || !updatedSession) {
          console.error('Error updating session:', updateError);
          return new NextResponse(null, { status: 204 }); // 에러여도 204
        }

        sessionId = updatedSession.id;
      } else {
        sessionId = existingSession.id;
      }
    } else {
      // 새 세션: 생성
      const { data: newSession, error: insertError } = await (supabase as any)
        .from(sessionsTable)
        .insert({
          session_key: sessionKey,
          landing_path: pagePath,
          referrer: referrer,
          referrer_host: referrerHost,
          utm_source: utm?.source || null,
          utm_medium: utm?.medium || null,
          utm_campaign: utm?.campaign || null,
          utm_term: utm?.term || null,
          utm_content: utm?.content || null,
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

    // 6. post_id/about_id 자동 매핑 (page_path 분석)
    let postId = isV2
      ? (validated as z.infer<typeof trackSchemaV2>).post_id || null
      : (validated as z.infer<typeof trackSchemaV1>).post_id || null;
    let aboutId = isV2
      ? (validated as z.infer<typeof trackSchemaV2>).about_id || null
      : (validated as z.infer<typeof trackSchemaV1>).about_id || null;

    // post_id/about_id가 없으면 page_path에서 자동 매핑
    if (!postId && !aboutId && pagePath) {
      // 블로그 포스트 매핑: /ko/blog/[slug] 또는 /en/blog/[slug]
      const blogMatch = pagePath.match(/^\/(?:ko|en)\/blog\/([^/]+)/);
      if (blogMatch) {
        const slug = blogMatch[1];
        const pathLocale = locale || parseLocaleFromPath(pagePath) || 'ko';
        
        try {
          const { data: post } = await (supabase as any)
            .from('uslab_posts')
            .select('id')
            .eq('slug', slug)
            .eq('locale', pathLocale)
            .eq('is_published', true)
            .single();
          
          if (post) {
            postId = post.id;
          }
        } catch (error) {
          // 에러는 무시 (매핑 실패해도 페이지뷰는 저장)
        }
      }

      // About 페이지 매핑: /ko/about 또는 /en/about
      if (!postId && !aboutId) {
        const aboutMatch = pagePath.match(/^\/(?:ko|en)\/about$/);
        if (aboutMatch) {
          const pathLocale = locale || parseLocaleFromPath(pagePath) || 'ko';
          
          try {
            const { data: about } = await (supabase as any)
              .from('uslab_about')
              .select('id')
              .eq('locale', pathLocale)
              .single();
            
            if (about) {
              aboutId = about.id;
            }
          } catch (error) {
            // 에러는 무시 (매핑 실패해도 페이지뷰는 저장)
          }
        }
      }
    }

    // 7. 페이지뷰 upsert (클라이언트 생성 id 사용)

    const { error: pageViewError } = await (supabase as any)
      .from(pageViewsTable)
      .insert({
        id: pageViewId, // 클라이언트 생성 id
        session_id: sessionId,
        post_id: postId,
        about_id: aboutId,
        page_path: pagePath, // 정규화된 pathname만
        locale: locale,
        created_at: new Date().toISOString(),
      });

    if (pageViewError) {
      console.error('Error inserting page view:', pageViewError);
      // 에러여도 204 반환 (UX 영향 없음)
    }

    // 7. Events bulk insert (v2만, events가 있는 경우)
    if (isV2) {
      const v2 = validated as z.infer<typeof trackSchemaV2>;
      const events = v2.events || [];

      if (events.length > 0) {
        const eventsTable = getAnalyticsTableName('events');
        const eventsToInsert = events.map((event) => ({
          id: event.id,
          session_id: sessionId,
          page_view_id: event.page_view_id || pageViewId, // page_view_id가 없으면 현재 page_view_id 사용
          name: event.name,
          page_path: event.page_path || pagePath, // page_path가 없으면 현재 page_path 사용
          props: event.props || {},
          client_ts: event.client_ts || null,
          created_at: new Date().toISOString(),
        }));

        const { error: eventsError } = await (supabase as any)
          .from(eventsTable)
          .insert(eventsToInsert);

        if (eventsError) {
          console.error('Error inserting events:', eventsError);
          // 에러여도 204 반환 (UX 영향 없음)
        }
      }
    }

    // 8. 성공 응답 (204 No Content)
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


