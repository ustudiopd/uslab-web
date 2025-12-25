'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { formatDateRangeForReport, formatDateKSTSimple } from '@/lib/utils/dateFormatter';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  todayPageviews: number;
  todayUniques: number;
  last7Days: { pageviews: number; uniques: number };
  last30Days: { pageviews: number; uniques: number };
}

interface TopPage {
  page_path: string;
  pageviews: number;
  uniques: number;
}

interface TopPost {
  post_id: string;
  title: string;
  locale: string;
  pageviews: number;
  uniques: number;
}

interface TopReferrer {
  referrer_host: string | null;
  sessions: number;
}

interface RecentActivity {
  posts: Array<{ id: string; title: string; published_at: string | null }>;
  comments: Array<{ id: string; author_name: string; created_at: string }>;
  inquiries: Array<{ id: string; name: string; status: string; created_at: string }>;
}

interface DailyStat {
  day: string;
  pageviews: number;
  uniques: number;
}

interface PostWithIssue {
  id: string;
  title: string;
  slug: string;
  locale: string;
  issues: string[];
}

interface TopExecDoc {
  id: string;
  title: string;
  updated_at: string;
  board_id: string;
}

interface SEOStatus {
  technical: {
    hasSitemap: boolean;
    hasRobots: boolean;
    hasCanonical: boolean;
    hasJsonLd: boolean;
  };
  quality: {
    totalPublished: number;
    missingSeoTitle: number;
    missingSeoDescription: number;
    seoTitleTooLong: number;
    seoDescriptionTooLong: number;
    postsWithIssues?: PostWithIssue[];
  };
}

interface HeatmapData {
  topClickedElements: Array<{
    element_id: string | null;
    page_path: string;
    clicks: number;
  }>;
  pageClickStats: Array<{
    page_path: string;
    clicks: number;
    unique_elements: number;
  }>;
}

interface WebVitalsData {
  metrics: Array<{
    name: string;
    p50: number;
    p75: number;
    p95: number;
    count: number;
    good: number;
    needsImprovement: number;
    poor: number;
  }>;
}

interface DateRange {
  startDate: string | null;
  endDate: string | null;
  days: number;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [dailyStats7, setDailyStats7] = useState<DailyStat[]>([]);
  const [dailyStats30, setDailyStats30] = useState<DailyStat[]>([]);
  const [chartRange, setChartRange] = useState<7 | 30>(7);
  const [seoStatus, setSeoStatus] = useState<SEOStatus | null>(null);
  const [topExecDoc, setTopExecDoc] = useState<TopExecDoc | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [webVitalsData, setWebVitalsData] = useState<WebVitalsData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<string>('');
  const [selectedEndDate, setSelectedEndDate] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [savedReports, setSavedReports] = useState<Array<{
    id: string;
    report_type: string;
    period_start: string;
    period_end: string;
    days: number;
    created_via: string;
    generated_at: string;
  }>>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [showAllReports, setShowAllReports] = useState(false);
  const [allReports, setAllReports] = useState<Array<{
    id: string;
    report_type: string;
    period_start: string;
    period_end: string;
    days: number;
    created_via: string;
    generated_at: string;
  }>>([]);
  const [loadingAllReports, setLoadingAllReports] = useState(false);
  const [reportDailyStats, setReportDailyStats] = useState<DailyStat[]>([]);
  const [reportTopPages, setReportTopPages] = useState<TopPage[]>([]);
  const [reportTopPosts, setReportTopPosts] = useState<TopPost[]>([]);
  const [reportComments, setReportComments] = useState<Array<{
    id: string;
    report_id: string;
    user_id: string | null;
    user_email: string | null;
    author_name: string;
    content: string;
    created_at: string;
    updated_at: string;
  }>>([]);
  const [commentContent, setCommentContent] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      // 초기 로드 시 7일로 설정
      fetchDashboardData(undefined, undefined, 7);
      fetchSavedReports();
    }
  }, [user]);

  const fetchSavedReports = async () => {
    try {
      setLoadingReports(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      const response = await fetch('/api/admin/analytics-reports?limit=5', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching saved reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchAllReports = async () => {
    try {
      setLoadingAllReports(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      const response = await fetch('/api/admin/analytics-reports?limit=100', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching all reports:', error);
    } finally {
      setLoadingAllReports(false);
    }
  };

  const handleShowAllReports = () => {
    setShowAllReports(true);
    if (allReports.length === 0) {
      fetchAllReports();
    }
  };

  const loadReport = async (reportId: string) => {
    try {
      setReportLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch(`/api/admin/analytics-reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load report');
      }

      const data = await response.json();
      setReport({ ...data.report, id: data.meta.id, reportId: data.meta.id });
      setShowReportModal(true);
      // 보고서 목록 새로고침
      fetchSavedReports();
      // 댓글 가져오기
      fetchReportComments(data.meta.id);
    } catch (error: any) {
      console.error('Error loading report:', error);
      alert(`보고서 로드 실패: ${error.message}`);
    } finally {
      setReportLoading(false);
    }
  };

  const fetchReportComments = async (reportId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/analytics-reports/${reportId}/comments`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReportComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!commentContent.trim() || !report) return;

    try {
      setCommentLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const reportId = report.id || report.reportId;
      if (!reportId) return;

      const response = await fetch(`/api/admin/analytics-reports/${reportId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: commentContent,
          authorName: user?.email?.split('@')[0] || '관리자',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReportComments([...reportComments, data.comment]);
        setCommentContent('');
      } else {
        const error = await response.json();
        alert(`댓글 작성 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingCommentContent.trim()) return;

    try {
      setCommentLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const reportId = report?.id || report?.reportId;
      if (!reportId) return;

      const response = await fetch(`/api/admin/analytics-reports/${reportId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editingCommentContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReportComments(reportComments.map(c => c.id === commentId ? data.comment : c));
        setEditingCommentId(null);
        setEditingCommentContent('');
      } else {
        const error = await response.json();
        alert(`댓글 수정 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      alert('댓글 수정 중 오류가 발생했습니다.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      setCommentLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const reportId = report?.id || report?.reportId;
      if (!reportId) return;

      const response = await fetch(`/api/admin/analytics-reports/${reportId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setReportComments(reportComments.filter(c => c.id !== commentId));
      } else {
        const error = await response.json();
        alert(`댓글 삭제 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    } finally {
      setCommentLoading(false);
    }
  };

  // 보고서 로드 시 일별 통계 및 Top 데이터 가져오기
  useEffect(() => {
    if (report?.period) {
      fetchReportChartData(report.period.startDate, report.period.endDate);
      if (report.id || report.reportId) {
        fetchReportComments(report.id || report.reportId);
      }
    }
  }, [report]);

  const fetchReportChartData = async (startDate: string, endDate: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `/api/admin/dashboard?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReportDailyStats(data.dailyStats || []);
        setReportTopPages(data.topPages || []);
        setReportTopPosts(data.topPosts || []);
      }
    } catch (error) {
      console.error('Error fetching report chart data:', error);
    }
  };

  const exportReportToMarkdown = (report: any) => {
    // KST 날짜 포맷팅
    const formatDateKST = (dateStr: string): string => {
      const date = new Date(dateStr);
      const fmt = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return fmt.format(date);
    };

    let markdown = `# AI 분석 보고서\n\n`;
    markdown += `**생성일**: ${new Date(report.generatedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n`;
    markdown += `**기간**: ${formatDateKST(report.period.startDate)} ~ ${formatDateKST(report.period.endDate)} (${report.period.days}일)\n`;
    markdown += `**유형**: ${report.reportType === 'daily' ? '일일' : report.reportType === 'weekly' ? '주간' : report.reportType === 'monthly' ? '월간' : '커스텀'}\n\n`;

    if (report.summary) {
      markdown += `## 요약\n\n${report.summary.overview}\n\n`;
      if (report.summary.keyMetrics) {
        markdown += `### 주요 지표\n\n`;
        markdown += `- 총 페이지뷰: ${report.summary.keyMetrics.totalPageviews.toLocaleString()}\n`;
        markdown += `- 총 방문자: ${report.summary.keyMetrics.totalUniques.toLocaleString()}\n`;
        markdown += `- 일평균 페이지뷰: ${Math.round(report.summary.keyMetrics.avgDailyPageviews).toLocaleString()}\n\n`;
      }
    }

    if (report.insights && report.insights.length > 0) {
      markdown += `## 주요 발견사항\n\n`;
      report.insights.forEach((insight: any, index: number) => {
        markdown += `### ${index + 1}. ${insight.title}\n\n`;
        markdown += `**유형**: ${insight.type === 'positive' ? '긍정' : insight.type === 'warning' ? '경고' : insight.type === 'negative' ? '부정' : '정보'}\n`;
        markdown += `**우선순위**: ${insight.priority === 'high' ? '높음' : insight.priority === 'medium' ? '중간' : '낮음'}\n`;
        markdown += `**신뢰도**: ${insight.confidence === 'high' ? '높음' : insight.confidence === 'medium' ? '중간' : '낮음'}\n\n`;
        markdown += `${insight.description}\n\n`;
        if (insight.evidence) {
          markdown += `**근거**: ${insight.evidence.metric}`;
          if (insight.evidence.current !== undefined) {
            markdown += ` (현재: ${insight.evidence.current})`;
          }
          if (insight.evidence.changePct !== undefined) {
            markdown += ` (변화: ${insight.evidence.changePct > 0 ? '+' : ''}${insight.evidence.changePct.toFixed(1)}%)`;
          }
          markdown += `\n\n`;
        }
      });
    }

    if (report.comparison) {
      markdown += `## 기간별 비교\n\n`;
      if (report.comparison.previousPeriod) {
        markdown += `**이전 기간**: ${formatDateKST(report.comparison.previousPeriod.startDate)} ~ ${formatDateKST(report.comparison.previousPeriod.endDate)}\n`;
        markdown += `**현재 기간**: ${formatDateKST(report.period.startDate)} ~ ${formatDateKST(report.period.endDate)}\n\n`;
      }
      markdown += `| 지표 | 이전 기간 | 현재 기간 | 변화 | 변화율 |\n`;
      markdown += `|------|----------|----------|------|--------|\n`;
      const pageviewsChange = report.comparison.changes.pageviews.change;
      const pageviewsChangePct = report.comparison.changes.pageviews.previous > 0
        ? ((pageviewsChange / report.comparison.changes.pageviews.previous) * 100).toFixed(1)
        : '-';
      markdown += `| 총 페이지뷰 | ${report.comparison.changes.pageviews.previous.toLocaleString()} | ${report.comparison.changes.pageviews.current.toLocaleString()} | ${pageviewsChange > 0 ? '+' : ''}${pageviewsChange.toLocaleString()} | ${pageviewsChangePct}% |\n`;
      
      const uniquesChange = report.comparison.changes.uniques.change;
      const uniquesChangePct = report.comparison.changes.uniques.previous > 0
        ? ((uniquesChange / report.comparison.changes.uniques.previous) * 100).toFixed(1)
        : '-';
      markdown += `| 총 방문자 | ${report.comparison.changes.uniques.previous.toLocaleString()} | ${report.comparison.changes.uniques.current.toLocaleString()} | ${uniquesChange > 0 ? '+' : ''}${uniquesChange.toLocaleString()} | ${uniquesChangePct}% |\n\n`;
    }

    if (report.trends) {
      markdown += `## 트렌드 분석\n\n`;
      markdown += `### 트래픽 트렌드\n\n`;
      markdown += `${report.trends.trafficTrendDescription}\n\n`;
      markdown += `### 인기 콘텐츠 트렌드\n\n`;
      markdown += `${report.trends.topContentTrend}\n\n`;
      markdown += `### 유입 경로 트렌드\n\n`;
      markdown += `${report.trends.referrerTrend}\n\n`;
    }

    if (report.performance) {
      markdown += `## 성능 분석\n\n`;
      
      if (report.performance.webVitals) {
        markdown += `### Web Vitals 성능 지표\n\n`;
        markdown += `${report.performance.webVitals.summary}\n\n`;
        markdown += `**전체 상태**: ${report.performance.webVitals.overall === 'good' ? '양호' : report.performance.webVitals.overall === 'needs-improvement' ? '개선 필요' : '불량'}\n\n`;
        
        if (report.performance.webVitals.metrics && report.performance.webVitals.metrics.length > 0) {
          markdown += `| 메트릭 | 값 | 상태 | 권장사항 |\n`;
          markdown += `|--------|-----|------|----------|\n`;
          report.performance.webVitals.metrics.forEach((metric: any) => {
            const valueStr = metric.name === 'CLS' ? metric.value.toFixed(3) : metric.value.toLocaleString();
            const statusStr = metric.status === 'good' ? '양호' : metric.status === 'needs-improvement' ? '개선 필요' : '불량';
            markdown += `| ${metric.name}${metric.name === 'CLS' ? ' (목표: ≤0.1)' : ''} | ${valueStr} | ${statusStr} | ${metric.recommendation || '-'} |\n`;
          });
          markdown += `\n`;
        }
      }
      
      if (report.performance.engagement) {
        markdown += `### 참여도 분석\n\n`;
        markdown += `- 평균 스크롤 깊이: ${report.performance.engagement.avgScrollDepth.toFixed(1)}%\n`;
        markdown += `- 평균 체류 시간: ${Math.round(report.performance.engagement.avgViewDuration)}초\n\n`;
        
        if (report.performance.engagement.topEngagedPages && report.performance.engagement.topEngagedPages.length > 0) {
          markdown += `**참여도 높은 페이지 (상위 5개)**:\n\n`;
          report.performance.engagement.topEngagedPages.slice(0, 5).forEach((page: any, index: number) => {
            markdown += `${index + 1}. ${page.page_path} (스크롤: ${page.avgScrollDepth.toFixed(1)}%, 체류: ${Math.round(page.avgViewDuration)}초)\n`;
          });
          markdown += `\n`;
        }
      }
    }

    if (report.seo) {
      markdown += `## SEO 분석\n\n`;
      markdown += `### 기술적 SEO 상태\n\n`;
      markdown += `**상태**: ${report.seo.technicalStatus === 'good' ? '양호' : '개선 필요'}\n\n`;
      
      if (report.seo.technicalIssues && report.seo.technicalIssues.length > 0) {
        markdown += `**이슈**:\n`;
        report.seo.technicalIssues.forEach((issue: string) => {
          markdown += `- ${issue}\n`;
        });
        markdown += `\n`;
      }
      
      markdown += `### 콘텐츠 품질\n\n`;
      markdown += `**점수**: ${report.seo.contentQuality.score}/100\n\n`;
      
      if (report.seo.contentQuality.issues && report.seo.contentQuality.issues.length > 0) {
        markdown += `**이슈**:\n`;
        report.seo.contentQuality.issues.forEach((issue: any) => {
          markdown += `- ${issue.type}: ${issue.count}개 - ${issue.description}\n`;
        });
        markdown += `\n`;
      }
      
      if (report.seo.contentQuality.recommendations && report.seo.contentQuality.recommendations.length > 0) {
        markdown += `**권장사항**:\n`;
        report.seo.contentQuality.recommendations.forEach((rec: string) => {
          markdown += `- ${rec}\n`;
        });
        markdown += `\n`;
      }
    }

    if (report.recommendations && report.recommendations.length > 0) {
      markdown += `## 권장사항\n\n`;
      report.recommendations.forEach((rec: any, index: number) => {
        markdown += `### ${index + 1}. ${rec.title}\n\n`;
        markdown += `**카테고리**: ${rec.category}\n`;
        markdown += `**우선순위**: ${rec.priority === 'high' ? '높음' : rec.priority === 'medium' ? '중간' : '낮음'}\n\n`;
        markdown += `${rec.description}\n\n`;
        if (rec.actionItems && rec.actionItems.length > 0) {
          markdown += `**액션 아이템**:\n`;
          rec.actionItems.forEach((item: string) => {
            markdown += `- ${item}\n`;
          });
          markdown += `\n`;
        }
      });
    }

    // Markdown 파일 다운로드
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-report-${report.period.startDate}-${report.period.endDate}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchDashboardData = async (startDate?: string, endDate?: string, days?: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
        return;
      }

      // 날짜 범위 파라미터 구성
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else if (days) {
        params.append('days', days.toString());
      }

      const response = await fetch(`/api/admin/dashboard?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data.stats);
      setTopPages(data.topPages || []);
      setTopPosts(data.topPosts || []);
      setTopReferrers(data.topReferrers || []);
      setRecentActivity(data.recentActivity || null);
      setDailyStats7(data.dailyStats?.last7Days || []);
      setDailyStats30(data.dailyStats?.last30Days || []);
      setSeoStatus(data.seoStatus || null);
      setTopExecDoc(data.topExecDoc || null);
      setHeatmapData(data.heatmapData || null);
      setWebVitalsData(data.webVitalsData || null);
      setDateRange(data.dateRange || null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setReportLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
        return;
      }

      const requestBody: any = {
        reportType: selectedStartDate && selectedEndDate ? 'custom' : 'daily',
        includeComparison: true, // 이전 기간 비교 활성화
      };

      if (selectedStartDate && selectedEndDate) {
        requestBody.startDate = selectedStartDate;
        requestBody.endDate = selectedEndDate;
      } else {
        requestBody.days = selectedDays;
      }

      const response = await fetch('/api/ai/analytics-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const data = await response.json();
      setReport(data.report);
      setShowReportModal(true);
      // 보고서 목록 새로고침
      fetchSavedReports();
    } catch (error: any) {
      console.error('Error generating report:', error);
      alert(`보고서 생성 실패: ${error.message}`);
    } finally {
      setReportLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <p className="text-slate-600 text-sm sm:text-base">로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
      {/* 헤더 */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-2 leading-tight sm:leading-normal">
              대시보드
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">콘텐츠 운영 현황 및 트래픽 분석</p>
          </div>

          {/* 저장된 보고서 목록 */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">AI 보고서</h3>
              <button
                onClick={handleShowAllReports}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                전체 보기
              </button>
            </div>
            {loadingReports ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-xs text-slate-600">로딩 중...</p>
              </div>
            ) : savedReports.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-slate-500 mb-2">저장된 보고서가 없습니다.</p>
                <button
                  onClick={generateReport}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  첫 보고서 생성하기 →
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {savedReports.slice(0, 3).map((savedReport) => (
                  <button
                    key={savedReport.id}
                    onClick={() => loadReport(savedReport.id)}
                    className="w-full text-left text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 p-2 rounded transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        {savedReport.report_type === 'daily' ? '일일' : savedReport.report_type === 'weekly' ? '주간' : savedReport.report_type === 'monthly' ? '월간' : '커스텀'} ({savedReport.days}일)
                      </span>
                      <span className="text-slate-400">
                        {new Date(savedReport.generated_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 날짜 범위 선택 및 보고서 생성 */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <div className="flex gap-2">
              <input
                type="date"
                value={selectedStartDate}
                onChange={(e) => setSelectedStartDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="self-center text-slate-600">~</span>
              <input
                type="date"
                value={selectedEndDate}
                onChange={(e) => setSelectedEndDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  if (selectedStartDate && selectedEndDate) {
                    fetchDashboardData(selectedStartDate, selectedEndDate);
                  }
                }}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                적용
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedDays(7);
                  setSelectedStartDate('');
                  setSelectedEndDate('');
                  fetchDashboardData(undefined, undefined, 7);
                }}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  selectedDays === 7 && !selectedStartDate
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                7일
              </button>
              <button
                onClick={() => {
                  setSelectedDays(30);
                  setSelectedStartDate('');
                  setSelectedEndDate('');
                  fetchDashboardData(undefined, undefined, 30);
                }}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  selectedDays === 30 && !selectedStartDate
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                30일
              </button>
            </div>
            <button
              onClick={generateReport}
              disabled={reportLoading}
              className="px-4 py-1.5 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reportLoading ? '생성 중...' : 'AI 보고서 생성'}
            </button>
        </div>
      </div>

      {/* 운영진 보드 최상단 하이라이트 */}
      {topExecDoc && (
        <div className="mb-6 sm:mb-8">
          <Link
            href={`/admin/exec-board?doc=${topExecDoc.id}`}
            className="block bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-lg p-4 sm:p-6 cursor-pointer hover:border-cyan-500/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-xs font-mono text-cyan-400 mb-2">최상단 하이라이트</div>
                <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-2">{topExecDoc.title}</h3>
                <div className="text-xs text-slate-500 mt-3">
                  마지막 수정: {new Date(topExecDoc.updated_at).toLocaleString('ko-KR')}
                </div>
              </div>
              <div className="text-cyan-400 flex-shrink-0">→</div>
            </div>
          </Link>
        </div>
      )}

        {/* KPI 카드 */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="text-xs sm:text-sm text-slate-600 mb-1">총 포스트</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.totalPosts}</div>
              <div className="text-xs text-slate-500 mt-1">
                발행: {stats.publishedPosts} | 초안: {stats.draftPosts}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="text-xs sm:text-sm text-slate-600 mb-1">오늘 방문자</div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.todayUniques}</div>
              <div className="text-xs text-slate-500 mt-1">
                페이지뷰: {stats.todayPageviews}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="text-xs sm:text-sm text-slate-600 mb-1">최근 7일</div>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600">
                {stats.last7Days.uniques}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                페이지뷰: {stats.last7Days.pageviews}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="text-xs sm:text-sm text-slate-600 mb-1">최근 30일</div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
                {stats.last30Days.uniques}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                페이지뷰: {stats.last30Days.pageviews}
              </div>
            </div>
          </div>
        )}

        {/* 트래픽 추이 차트 */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">트래픽 추이</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setChartRange(7)}
                className={`px-3 py-1 text-xs sm:text-sm rounded transition-colors ${
                  chartRange === 7
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                7일
              </button>
              <button
                onClick={() => setChartRange(30)}
                className={`px-3 py-1 text-xs sm:text-sm rounded transition-colors ${
                  chartRange === 30
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                30일
              </button>
            </div>
          </div>
          {chartRange === 7 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats7.length > 0 ? dailyStats7 : []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="day"
                  stroke="#cbd5e1"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ color: '#1e293b' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pageviews"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="페이지뷰"
                  dot={{ fill: '#06b6d4', r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="uniques"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="방문자"
                  dot={{ fill: '#8b5cf6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : chartRange === 30 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats30.length > 0 ? dailyStats30 : []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="day"
                  stroke="#cbd5e1"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ color: '#1e293b' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pageviews"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="페이지뷰"
                  dot={{ fill: '#06b6d4', r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="uniques"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="방문자"
                  dot={{ fill: '#8b5cf6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-600 text-sm">
              데이터가 없습니다.
            </div>
          )}
        </div>

        {/* SEO 상태 박스 */}
        {seoStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* 기술적 SEO */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">기술적 SEO</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Sitemap</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      seoStatus.technical.hasSitemap
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-red-500/20 text-red-600'
                    }`}
                  >
                    {seoStatus.technical.hasSitemap ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Robots.txt</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      seoStatus.technical.hasRobots
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-red-500/20 text-red-600'
                    }`}
                  >
                    {seoStatus.technical.hasRobots ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Canonical URL</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      seoStatus.technical.hasCanonical
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-red-500/20 text-red-600'
                    }`}
                  >
                    {seoStatus.technical.hasCanonical ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">JSON-LD</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      seoStatus.technical.hasJsonLd
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-red-500/20 text-red-600'
                    }`}
                  >
                    {seoStatus.technical.hasJsonLd ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>

            {/* 포스트 SEO 품질 */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">포스트 SEO 품질</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">발행 포스트</span>
                  <span className="text-sm text-slate-900 font-medium">
                    {seoStatus.quality.totalPublished}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">SEO 제목 누락</span>
                  <span
                    className={`text-sm font-medium ${
                      seoStatus.quality.missingSeoTitle > 0
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}
                  >
                    {seoStatus.quality.missingSeoTitle}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">SEO 설명 누락</span>
                  <span
                    className={`text-sm font-medium ${
                      seoStatus.quality.missingSeoDescription > 0
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}
                  >
                    {seoStatus.quality.missingSeoDescription}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">제목 길이 초과 (60자)</span>
                  <span
                    className={`text-sm font-medium ${
                      seoStatus.quality.seoTitleTooLong > 0 ? 'text-yellow-600' : 'text-green-600'
                    }`}
                  >
                    {seoStatus.quality.seoTitleTooLong}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">설명 길이 초과 (160자)</span>
                  <span
                    className={`text-sm font-medium ${
                      seoStatus.quality.seoDescriptionTooLong > 0
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}
                  >
                    {seoStatus.quality.seoDescriptionTooLong}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEO 문제 포스트 목록 */}
        {seoStatus && seoStatus.quality.postsWithIssues && seoStatus.quality.postsWithIssues.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">
              SEO 문제 포스트 ({seoStatus.quality.postsWithIssues.length}개)
            </h2>
            <div className="space-y-2">
              {seoStatus.quality.postsWithIssues.map((post) => {
                const issueLabels: Record<string, string> = {
                  missing_title: '제목 누락',
                  missing_description: '설명 누락',
                  title_too_long: '제목 초과',
                  description_too_long: '설명 초과',
                };

                return (
                  <Link
                    key={post.id}
                    href={`/admin/posts/${post.id}`}
                    className="block p-3 rounded border border-slate-200 hover:border-blue-500 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate mb-1">
                          {post.title}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {post.issues.map((issue) => (
                            <span
                              key={issue}
                              className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-600"
                            >
                              {issueLabels[issue] || issue}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {post.locale === 'ko' ? '한국어' : 'English'} • {post.slug}
                        </div>
                      </div>
                      <div className="text-xs text-blue-600 whitespace-nowrap">편집 →</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 히트맵 데이터 */}
        {heatmapData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Top Clicked Elements */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">
                인기 클릭 요소 (30일)
              </h2>
              {heatmapData.topClickedElements.length === 0 ? (
                <p className="text-sm text-slate-600">데이터가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {heatmapData.topClickedElements.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 p-2 rounded hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {item.element_id || '(ID 없음)'}
                        </div>
                        <div className="text-xs text-slate-600 truncate">{item.page_path}</div>
                      </div>
                      <div className="text-sm text-slate-900 font-medium">{item.clicks}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 페이지별 클릭 통계 */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">
                페이지별 클릭 (30일)
              </h2>
              {heatmapData.pageClickStats.length === 0 ? (
                <p className="text-sm text-slate-600">데이터가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {heatmapData.pageClickStats.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 p-2 rounded hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {item.page_path}
                        </div>
                        <div className="text-xs text-slate-600">
                          {item.unique_elements}개 요소
                        </div>
                      </div>
                      <div className="text-sm text-slate-900 font-medium">{item.clicks}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Web Vitals 카드 */}
        {webVitalsData && webVitalsData.metrics.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">
              Web Vitals 성능 지표 ({dateRange?.days || 30}일)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {webVitalsData.metrics.map((metric) => {
                const total = metric.good + metric.needsImprovement + metric.poor;
                const goodRate = total > 0 ? ((metric.good / total) * 100).toFixed(1) : '0';
                const needsImprovementRate = total > 0 ? ((metric.needsImprovement / total) * 100).toFixed(1) : '0';
                const poorRate = total > 0 ? ((metric.poor / total) * 100).toFixed(1) : '0';

                // 메트릭 이름 한글 변환 (의미 설명)
                const metricNames: Record<string, string> = {
                  LCP: 'LCP - 가장 큰 콘텐츠가 화면에 표시되는 시간',
                  CLS: 'CLS - 페이지 레이아웃이 얼마나 안정적인지 측정 (목표: 0.1 이하)',
                  INP: 'INP - 사용자 상호작용에 대한 응답 속도',
                  FCP: 'FCP - 첫 번째 콘텐츠가 화면에 표시되는 시간',
                  TTFB: 'TTFB - 서버로부터 첫 번째 바이트를 받는 시간',
                  FID: 'FID - 사용자의 첫 입력에 대한 응답 지연 시간',
                };
                
                // CLS 값 검증: 비정상적으로 높은 경우 경고
                const isCLSAbnormal = metric.name === 'CLS' && metric.p75 > 0.25;
                const isCLSPoor = metric.name === 'CLS' && metric.p75 > 0.1;

                return (
                  <div
                    key={metric.name}
                    className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="text-sm font-bold text-slate-900 mb-3">
                      {metricNames[metric.name] || metric.name}
                    </div>
                    {isCLSAbnormal && (
                      <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        ⚠️ CLS 값이 비정상적으로 높습니다. 측정/집계 파이프라인을 확인해주세요.
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">P50</span>
                        <span className={`font-medium ${
                          metric.name === 'CLS' && metric.p50 > 0.1 ? 'text-red-600' : 'text-slate-900'
                        }`}>
                          {metric.name === 'CLS' ? metric.p50.toFixed(3) : `${Math.round(metric.p50)}ms`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">P75</span>
                        <span className={`font-medium ${
                          isCLSPoor ? 'text-red-600' : 'text-slate-900'
                        }`}>
                          {metric.name === 'CLS' ? metric.p75.toFixed(3) : `${Math.round(metric.p75)}ms`}
                        </span>
                        {metric.name === 'CLS' && (
                          <span className="text-xs text-slate-500 ml-1">(목표: ≤0.1)</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">P95</span>
                        <span className={`font-medium ${
                          metric.name === 'CLS' && metric.p95 > 0.1 ? 'text-red-600' : 'text-slate-900'
                        }`}>
                          {metric.name === 'CLS' ? metric.p95.toFixed(3) : `${Math.round(metric.p95)}ms`}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-green-600">Good</span>
                          <span className="font-medium text-slate-900">
                            {metric.good} ({goodRate}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-yellow-600">Needs Improvement</span>
                          <span className="font-medium text-slate-900">
                            {metric.needsImprovement} ({needsImprovementRate}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-red-600">Poor</span>
                          <span className="font-medium text-slate-900">
                            {metric.poor} ({poorRate}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top 콘텐츠 및 Referrer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Top Posts */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">인기 포스트 (30일)</h2>
            {topPosts.length === 0 ? (
              <p className="text-sm text-slate-600">데이터가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {topPosts.slice(0, 10).map((post) => (
                  <div
                    key={post.post_id}
                    className="flex items-start justify-between gap-2 p-2 rounded hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{post.title}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        {post.locale === 'ko' ? '한국어' : 'English'} • 조회수: {post.pageviews} • 방문자: {post.uniques}
                      </div>
                    </div>
                    <Link
                      href={`/admin/posts/${post.post_id}`}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      보기
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Referrers */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">유입 경로 (30일)</h2>
            {topReferrers.length === 0 ? (
              <p className="text-sm text-slate-600">데이터가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {topReferrers.slice(0, 10).map((ref, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 p-2 rounded hover:bg-slate-50 transition-colors"
                  >
                    <div className="text-sm text-slate-700 truncate flex-1">
                      {ref.referrer_host || '(direct)'}
                    </div>
                    <div className="text-xs text-slate-600">{ref.sessions}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 최근 활동 */}
        {recentActivity && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* 최근 발행 포스트 */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">최근 발행 포스트</h2>
              {recentActivity.posts.length === 0 ? (
                <p className="text-sm text-slate-600">없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {recentActivity.posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/admin/posts/${post.id}`}
                      className="block p-2 rounded hover:bg-slate-50 transition-colors"
                    >
                      <div className="text-sm font-medium text-slate-900 truncate">{post.title}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString('ko-KR')
                          : '미발행'}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 최근 댓글 */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">최근 댓글</h2>
              {recentActivity.comments.length === 0 ? (
                <p className="text-sm text-slate-600">없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {recentActivity.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-2 rounded hover:bg-slate-50 transition-colors"
                    >
                      <div className="text-sm text-slate-900">{comment.author_name}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 최근 문의 */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">최근 문의</h2>
              {recentActivity.inquiries.length === 0 ? (
                <p className="text-sm text-slate-600">없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {recentActivity.inquiries.map((inquiry) => (
                    <div
                      key={inquiry.id}
                      className="p-2 rounded hover:bg-slate-50 transition-colors"
                    >
                      <div className="text-sm text-slate-900">{inquiry.name}</div>
                      <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                        <span>{new Date(inquiry.created_at).toLocaleDateString('ko-KR')}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            inquiry.status === 'completed'
                              ? 'bg-green-500/20 text-green-600'
                              : inquiry.status === 'contacted'
                              ? 'bg-yellow-500/20 text-yellow-600'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {inquiry.status === 'completed'
                            ? '완료'
                            : inquiry.status === 'contacted'
                            ? '연락완료'
                            : '대기'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      {/* 보고서 모달 */}
      {showReportModal && report && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">AI 분석 보고서</h2>
                {report.period && (
                  <p className="text-xs text-slate-600 mt-1">
                    {formatDateRangeForReport(
                      new Date(report.period.startDate),
                      new Date(report.period.endDate),
                      report.period.days
                    )}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => report && exportReportToMarkdown(report)}
                  className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                >
                  Markdown 내보내기
                </button>
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportDailyStats([]);
                    setReportTopPages([]);
                    setReportTopPosts([]);
                    setReportComments([]);
                    setCommentContent('');
                    setEditingCommentId(null);
                    setEditingCommentContent('');
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* 요약 */}
              {report.summary && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">요약</h3>
                  <p className="text-slate-700 whitespace-pre-line">{report.summary.overview}</p>
                  {report.summary.keyMetrics && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-slate-600">총 페이지뷰</div>
                        <div className="text-lg font-bold text-slate-900">{report.summary.keyMetrics.totalPageviews.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600">총 방문자</div>
                        <div className="text-lg font-bold text-slate-900">{report.summary.keyMetrics.totalUniques.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600">일평균 페이지뷰</div>
                        <div className="text-lg font-bold text-slate-900">{Math.round(report.summary.keyMetrics.avgDailyPageviews).toLocaleString()}</div>
                      </div>
                    </div>
                  )}

                  {/* 일별 트래픽 추이 그래프 */}
                  {reportDailyStats.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-slate-900 mb-3">일별 트래픽 추이</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportDailyStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="day"
                            stroke="#cbd5e1"
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                          />
                          <YAxis stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                            labelStyle={{ color: '#1e293b' }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="pageviews"
                            stroke="#06b6d4"
                            strokeWidth={2}
                            name="페이지뷰"
                            dot={{ fill: '#06b6d4', r: 3 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="uniques"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            name="방문자"
                            dot={{ fill: '#8b5cf6', r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* 이전 기간 비교 그래프 */}
                  {report.comparison && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-slate-900 mb-3">이전 기간 대비</h4>
                      
                      {/* 비교표 (코드로 생성) */}
                      <div className="mb-4 overflow-x-auto">
                        <table className="w-full border-collapse border border-slate-300 text-sm">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border border-slate-300 px-4 py-2 text-left">지표</th>
                              <th className="border border-slate-300 px-4 py-2 text-right">
                                {report.comparison.previousPeriod && (
                                  <div>
                                    <div className="text-xs text-slate-500">이전 기간</div>
                                    <div className="text-xs">
                                      {formatDateKSTSimple(new Date(report.comparison.previousPeriod.startDate))} ~ {formatDateKSTSimple(new Date(report.comparison.previousPeriod.endDate))}
                                    </div>
                                  </div>
                                )}
                              </th>
                              <th className="border border-slate-300 px-4 py-2 text-right">
                                <div>
                                  <div className="text-xs text-slate-500">현재 기간</div>
                                  <div className="text-xs">
                                    {formatDateKSTSimple(new Date(report.period.startDate))} ~ {formatDateKSTSimple(new Date(report.period.endDate))}
                                  </div>
                                </div>
                              </th>
                              <th className="border border-slate-300 px-4 py-2 text-right">변화</th>
                              <th className="border border-slate-300 px-4 py-2 text-right">변화율</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-300 px-4 py-2 font-medium">페이지뷰</td>
                              <td className="border border-slate-300 px-4 py-2 text-right">
                                {report.comparison.changes.pageviews.previous.toLocaleString()}
                              </td>
                              <td className="border border-slate-300 px-4 py-2 text-right font-semibold">
                                {report.comparison.changes.pageviews.current.toLocaleString()}
                              </td>
                              <td className={`border border-slate-300 px-4 py-2 text-right font-semibold ${
                                report.comparison.changes.pageviews.trend === 'up' ? 'text-green-600' :
                                report.comparison.changes.pageviews.trend === 'down' ? 'text-red-600' : 'text-slate-600'
                              }`}>
                                {report.comparison.changes.pageviews.change > 0 ? '+' : ''}
                                {report.comparison.changes.pageviews.change.toLocaleString()}
                              </td>
                              <td className={`border border-slate-300 px-4 py-2 text-right font-semibold ${
                                report.comparison.changes.pageviews.trend === 'up' ? 'text-green-600' :
                                report.comparison.changes.pageviews.trend === 'down' ? 'text-red-600' : 'text-slate-600'
                              }`}>
                                {report.comparison.changes.pageviews.previous > 0
                                  ? `${((report.comparison.changes.pageviews.change / report.comparison.changes.pageviews.previous) * 100).toFixed(1)}%`
                                  : '-'}
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-slate-300 px-4 py-2 font-medium">방문자</td>
                              <td className="border border-slate-300 px-4 py-2 text-right">
                                {report.comparison.changes.uniques.previous.toLocaleString()}
                              </td>
                              <td className="border border-slate-300 px-4 py-2 text-right font-semibold">
                                {report.comparison.changes.uniques.current.toLocaleString()}
                              </td>
                              <td className={`border border-slate-300 px-4 py-2 text-right font-semibold ${
                                report.comparison.changes.uniques.trend === 'up' ? 'text-green-600' :
                                report.comparison.changes.uniques.trend === 'down' ? 'text-red-600' : 'text-slate-600'
                              }`}>
                                {report.comparison.changes.uniques.change > 0 ? '+' : ''}
                                {report.comparison.changes.uniques.change.toLocaleString()}
                              </td>
                              <td className={`border border-slate-300 px-4 py-2 text-right font-semibold ${
                                report.comparison.changes.uniques.trend === 'up' ? 'text-green-600' :
                                report.comparison.changes.uniques.trend === 'down' ? 'text-red-600' : 'text-slate-600'
                              }`}>
                                {report.comparison.changes.uniques.previous > 0
                                  ? `${((report.comparison.changes.uniques.change / report.comparison.changes.uniques.previous) * 100).toFixed(1)}%`
                                  : '-'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-600 mb-1">페이지뷰 변화</div>
                          <div className={`text-2xl font-bold ${
                            report.comparison.changes.pageviews.trend === 'up'
                              ? 'text-green-600'
                              : report.comparison.changes.pageviews.trend === 'down'
                              ? 'text-red-600'
                              : 'text-slate-600'
                          }`}>
                            {report.comparison.changes.pageviews.trend === 'up' ? '↑' : 
                             report.comparison.changes.pageviews.trend === 'down' ? '↓' : '→'}
                            {Math.abs(report.comparison.changes.pageviews.change).toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {report.comparison.changes.pageviews.previous > 0
                              ? `${((report.comparison.changes.pageviews.change / report.comparison.changes.pageviews.previous) * 100).toFixed(1)}%`
                              : '-'}
                          </div>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-600 mb-1">방문자 변화</div>
                          <div className={`text-2xl font-bold ${
                            report.comparison.changes.uniques.trend === 'up'
                              ? 'text-green-600'
                              : report.comparison.changes.uniques.trend === 'down'
                              ? 'text-red-600'
                              : 'text-slate-600'
                          }`}>
                            {report.comparison.changes.uniques.trend === 'up' ? '↑' : 
                             report.comparison.changes.uniques.trend === 'down' ? '↓' : '→'}
                            {Math.abs(report.comparison.changes.uniques.change).toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {report.comparison.changes.uniques.previous > 0
                              ? `${((report.comparison.changes.uniques.change / report.comparison.changes.uniques.previous) * 100).toFixed(1)}%`
                              : '-'}
                          </div>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={[
                          {
                            name: '페이지뷰',
                            현재: report.comparison.changes.pageviews.current,
                            이전: report.comparison.changes.pageviews.previous,
                          },
                          {
                            name: '방문자',
                            현재: report.comparison.changes.uniques.current,
                            이전: report.comparison.changes.uniques.previous,
                          },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                            }}
                          />
                          <Legend />
                          <Bar dataKey="현재" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="이전" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* 주요 발견사항 */}
              {report.insights && report.insights.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">주요 발견사항</h3>
                  <div className="space-y-3">
                    {report.insights.map((insight: any, index: number) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          insight.type === 'positive'
                            ? 'bg-green-50 border-green-200'
                            : insight.type === 'warning'
                            ? 'bg-yellow-50 border-yellow-200'
                            : insight.type === 'negative'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-slate-900">{insight.title}</h4>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              insight.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : insight.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {insight.priority === 'high' ? '높음' : insight.priority === 'medium' ? '중간' : '낮음'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">{insight.description}</p>
                        {insight.evidence && (
                          <div className="text-xs text-slate-600 mt-2">
                            근거: {insight.evidence.metric}
                            {insight.evidence.current !== undefined && ` (현재: ${insight.evidence.current})`}
                            {insight.evidence.changePct !== undefined && ` (변화: ${insight.evidence.changePct > 0 ? '+' : ''}${insight.evidence.changePct.toFixed(1)}%)`}
                          </div>
                        )}
                        <div className="text-xs text-slate-500 mt-1">
                          신뢰도: {insight.confidence === 'high' ? '높음' : insight.confidence === 'medium' ? '중간' : '낮음'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 성능 분석 */}
              {report.performance && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">성능 분석</h3>
                  
                  {/* Web Vitals Radar Chart */}
                  {report.performance.webVitals?.metrics && report.performance.webVitals.metrics.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-slate-900 mb-3">Web Vitals 성능 지표</h4>
                      <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-700">{report.performance.webVitals.summary}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-slate-600">전체 상태:</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            report.performance.webVitals.overall === 'good'
                              ? 'bg-green-100 text-green-700'
                              : report.performance.webVitals.overall === 'needs-improvement'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {report.performance.webVitals.overall === 'good' ? '양호' : 
                             report.performance.webVitals.overall === 'needs-improvement' ? '개선 필요' : '불량'}
                          </span>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={report.performance.webVitals.metrics.map((m: any) => {
                          // 각 메트릭의 최대값 설정 (정규화용)
                          let maxValue = 2500;
                          if (m.name === 'CLS') maxValue = 0.25;
                          else if (m.name === 'INP') maxValue = 500;
                          else if (m.name === 'FCP') maxValue = 1800;
                          else if (m.name === 'TTFB') maxValue = 800;
                          else if (m.name === 'FID') maxValue = 100;
                          
                          return {
                            metric: m.name,
                            value: m.value,
                            fullMark: maxValue,
                            status: m.status,
                          };
                        })}>
                          <PolarGrid />
                          <PolarAngleAxis 
                            dataKey="metric" 
                            tick={{ fill: '#64748b', fontSize: 12 }} 
                          />
                          <PolarRadiusAxis 
                            angle={90} 
                            domain={[0, 'dataMax']} 
                            tick={{ fill: '#64748b', fontSize: 10 }} 
                          />
                          <Radar
                            name="값"
                            dataKey="value"
                            stroke="#06b6d4"
                            fill="#06b6d4"
                            fillOpacity={0.6}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                            }}
                            formatter={(value: number, name: string, props: any) => {
                              const metric = props.payload.metric;
                              if (metric === 'CLS') {
                                return [value.toFixed(3), 'CLS'];
                              }
                              return [value.toLocaleString(), name];
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {report.performance.webVitals.metrics.map((metric: any, index: number) => {
                          const isCLSAbnormal = metric.name === 'CLS' && metric.value > 0.25;
                          const isCLSPoor = metric.name === 'CLS' && metric.value > 0.1;
                          return (
                            <div key={index} className="p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold text-slate-900">
                                  {metric.name}
                                  {metric.name === 'CLS' && (
                                    <span className="text-xs text-slate-500 ml-1">(목표: ≤0.1)</span>
                                  )}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded ${
                                  metric.status === 'good'
                                    ? 'bg-green-100 text-green-700'
                                    : metric.status === 'needs-improvement'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {metric.status === 'good' ? '양호' : 
                                   metric.status === 'needs-improvement' ? '개선 필요' : '불량'}
                                </span>
                              </div>
                              <div className={`text-lg font-bold ${
                                isCLSPoor ? 'text-red-600' : 'text-slate-900'
                              }`}>
                                {metric.name === 'CLS' ? metric.value.toFixed(3) : metric.value.toLocaleString()}
                              </div>
                              {isCLSAbnormal && (
                                <div className="text-xs text-red-700 mt-1 font-semibold">
                                  ⚠️ 비정상적으로 높은 값입니다. 파이프라인 검증 필요
                                </div>
                              )}
                              {metric.recommendation && (
                                <div className="text-xs text-slate-600 mt-1">{metric.recommendation}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 참여도 분석 */}
                  {report.performance.engagement && (
                    <div>
                      <h4 className="text-md font-semibold text-slate-900 mb-3">참여도 분석</h4>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-600 mb-1">평균 스크롤 깊이</div>
                          <div className="text-2xl font-bold text-slate-900">
                            {report.performance.engagement.avgScrollDepthPct.toFixed(1)}%
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <div className="text-sm text-slate-600 mb-1">평균 체류 시간</div>
                          <div className="text-2xl font-bold text-slate-900">
                            {Math.round(report.performance.engagement.avgViewDurationSec)}초
                          </div>
                        </div>
                      </div>
                      {report.performance.engagement.topEngagedPages && report.performance.engagement.topEngagedPages.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-slate-900 mb-2">참여도 높은 페이지</h5>
                          <div className="space-y-2">
                            {report.performance.engagement.topEngagedPages.slice(0, 5).map((page: any, index: number) => (
                              <div key={index} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                                <span className="text-sm text-slate-700 truncate flex-1">{page.page_path}</span>
                                <div className="flex gap-4 text-xs text-slate-600">
                                  <span>스크롤: {page.avgScrollDepthPct.toFixed(1)}%</span>
                                  <span>체류: {Math.round(page.avgViewDurationSec)}초</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 트렌드 분석 */}
              {report.trends && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">트렌드 분석</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="text-md font-semibold text-slate-900 mb-2">트래픽 트렌드</h4>
                      <p className="text-sm text-slate-700">{report.trends.trafficTrendDescription}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="text-md font-semibold text-slate-900 mb-2">콘텐츠 트렌드</h4>
                      <p className="text-sm text-slate-700">{report.trends.topContentTrend}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="text-md font-semibold text-slate-900 mb-2">유입 트렌드</h4>
                      <p className="text-sm text-slate-700">{report.trends.referrerTrend}</p>
                    </div>
                  </div>

                  {/* Top 페이지 Bar Chart */}
                  {reportTopPages.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-slate-900 mb-3">인기 페이지 Top 5</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={reportTopPages.slice(0, 5).map(page => ({
                            name: page.page_path.length > 30 
                              ? page.page_path.substring(0, 30) + '...' 
                              : page.page_path,
                            pageviews: page.pageviews,
                            uniques: page.uniques,
                          }))}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            stroke="#cbd5e1" 
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            width={150}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                            }}
                          />
                          <Legend />
                          <Bar dataKey="pageviews" fill="#06b6d4" radius={[0, 4, 4, 0]} name="페이지뷰" />
                          <Bar dataKey="uniques" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="방문자" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* 권장사항 */}
              {report.recommendations && report.recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">권장사항</h3>
                  <div className="space-y-3">
                    {report.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-slate-900">{rec.title}</h4>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {rec.category}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">{rec.description}</p>
                        {rec.actionItems && rec.actionItems.length > 0 && (
                          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                            {rec.actionItems.map((item: string, itemIndex: number) => (
                              <li key={itemIndex}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 댓글 섹션 */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">댓글 ({reportComments.length})</h3>
                
                {/* 댓글 목록 */}
                <div className="space-y-4 mb-6">
                  {reportComments.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">아직 댓글이 없습니다.</p>
                  ) : (
                    reportComments.map((comment) => (
                      <div key={comment.id} className="p-4 bg-slate-50 rounded-lg">
                        {editingCommentId === comment.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingCommentContent}
                              onChange={(e) => setEditingCommentContent(e.target.value)}
                              className="w-full p-2 border border-slate-300 rounded text-sm"
                              rows={3}
                              placeholder="댓글을 수정하세요..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditComment(comment.id)}
                                disabled={commentLoading}
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingCommentContent('');
                                }}
                                className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-semibold text-slate-900 text-sm">{comment.author_name}</div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {new Date(comment.created_at).toLocaleString('ko-KR', { 
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                  {comment.updated_at !== comment.created_at && (
                                    <span className="ml-1">(수정됨)</span>
                                  )}
                                </div>
                              </div>
                              {comment.user_id === user?.id && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(comment.id);
                                      setEditingCommentContent(comment.content);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-700"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-xs text-red-600 hover:text-red-700"
                                  >
                                    삭제
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* 댓글 작성 */}
                <div className="space-y-2">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded text-sm"
                    rows={3}
                    placeholder="댓글을 작성하세요..."
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddComment}
                      disabled={!commentContent.trim() || commentLoading}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {commentLoading ? '작성 중...' : '댓글 작성'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 전체 보고서 목록 모달 */}
      {showAllReports && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">전체 보고서 목록</h2>
              <button
                onClick={() => setShowAllReports(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {loadingAllReports ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-slate-600">로딩 중...</p>
                </div>
              ) : allReports.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600">저장된 보고서가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allReports.map((savedReport) => (
                    <button
                      key={savedReport.id}
                      onClick={() => {
                        setShowAllReports(false);
                        loadReport(savedReport.id);
                      }}
                      className="w-full text-left p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                              {savedReport.report_type === 'daily' ? '일일' : savedReport.report_type === 'weekly' ? '주간' : savedReport.report_type === 'monthly' ? '월간' : '커스텀'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {savedReport.days}일
                            </span>
                            {savedReport.created_via === 'manual' && (
                              <span className="text-xs text-slate-400">(수동 생성)</span>
                            )}
                          </div>
                          <div className="text-sm text-slate-600">
                            {savedReport.period_start && savedReport.period_end && (
                              <>
                                {new Date(savedReport.period_start).toLocaleDateString('ko-KR')} ~ {new Date(savedReport.period_end).toLocaleDateString('ko-KR')}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-slate-900">
                            {new Date(savedReport.generated_at).toLocaleDateString('ko-KR', { 
                              year: 'numeric',
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


