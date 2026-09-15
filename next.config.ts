import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl) : null
const supabaseProtocol: 'http' | 'https' = supabaseOrigin?.protocol === 'http:' ? 'http' : 'https'

const nextConfig: NextConfig = {
  images: {
    // 화면에서 실제로 사용하는 폭만 유지해 같은 원본의 변형 캐시가 과도하게 늘어나지 않도록 합니다.
    deviceSizes: [384, 640, 828, 1080, 1280],
    imageSizes: [64, 96, 128, 160, 256, 384],
    formats: ['image/webp'],
    remotePatterns: supabaseOrigin ? [
      {
        protocol: supabaseProtocol,
        hostname: supabaseOrigin.hostname,
        port: supabaseOrigin.port,
        pathname: '/storage/v1/object/**',
      },
    ] : [],
    // Supabase Storage 미디어는 업로드 후 내용이 바뀌지 않으므로 최적화 결과를 30일 캐시합니다.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        source: '/bbs',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600' },
          { key: 'Vercel-CDN-Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=3600' },
        ],
      },
      {
        source: '/bbs/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600' },
          { key: 'Vercel-CDN-Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=3600' },
        ],
      },
    ]
  },
};

export default nextConfig;
