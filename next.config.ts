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
    minimumCacheTTL: 60 * 60 * 24,
  },
};

export default nextConfig;
