import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ANALYTICS_PREFIX } from '@/lib/config/analytics';
import { createServerClient } from '@/lib/supabase/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET /api/admin/analytics-reports/[id]
 * 
 * 특정 보고서 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sitePrefix = searchParams.get('sitePrefix') || ANALYTICS_PREFIX;

    const serverSupabase = createServerClient();
    const reportsTable = `${sitePrefix}_analytics_reports`;

    const { data: report, error } = await serverSupabase
      .from(reportsTable)
      .select('*')
      .eq('id', id)
      .eq('site_prefix', sitePrefix)
      .single();

    if (error || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const reportData = report as any;

    return NextResponse.json({
      report: reportData.report_json,
      meta: {
        id: reportData.id,
        sitePrefix: reportData.site_prefix,
        reportType: reportData.report_type,
        periodStart: reportData.period_start,
        periodEnd: reportData.period_end,
        days: reportData.days,
        createdVia: reportData.created_via,
        generatedAt: reportData.generated_at,
        createdAt: reportData.created_at,
      },
    });
  } catch (error: any) {
    console.error('Analytics report API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report', details: error.message },
      { status: 500 }
    );
  }
}
