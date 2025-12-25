import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ANALYTICS_PREFIX } from '@/lib/config/analytics';
import { createServerClient } from '@/lib/supabase/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET /api/admin/analytics-reports
 * 
 * 저장된 보고서 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const reportType = searchParams.get('reportType');
    const sitePrefix = searchParams.get('sitePrefix') || ANALYTICS_PREFIX;

    const serverSupabase = createServerClient();
    const reportsTable = `${sitePrefix}_analytics_reports`;

    let query = serverSupabase
      .from(reportsTable)
      .select('id, site_prefix, report_type, period_start, period_end, days, created_via, generated_at, created_at')
      .eq('site_prefix', sitePrefix)
      .order('generated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      // 테이블이 없거나 RLS 정책 문제일 수 있으므로 빈 배열 반환
      return NextResponse.json({
        reports: [],
        total: 0,
      });
    }

    return NextResponse.json({
      reports: reports || [],
      total: reports?.length || 0,
    });
  } catch (error: any) {
    console.error('Analytics reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error.message },
      { status: 500 }
    );
  }
}
