import { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uslab.ai';

  const supabase = createServerClient();

  // 발행된 포스트 조회
  const { data: posts } = await (supabase as any)
    .from('uslab_posts')
    .select('slug, locale, updated_at, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  // 포스트 URL 생성
  const postUrls: MetadataRoute.Sitemap = (posts || []).map((post: any) => ({
    url: `${baseUrl}/${post.locale}/blog/${post.slug}`,
    lastModified: post.updated_at || post.published_at || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 정적 페이지 URL
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/ko`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/ko/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/en/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ko/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/en/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  return [...staticUrls, ...postUrls];
}
