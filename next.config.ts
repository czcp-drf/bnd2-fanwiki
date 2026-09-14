import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl) : null
const supabaseProtocol: 'http' | 'https' = supabaseOrigin?.protocol === 'http:' ? 'http' : 'https'

const nextConfig: NextConfig = {
  images: {
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
};

export default nextConfig;
