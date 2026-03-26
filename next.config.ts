import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['sharp', '@react-pdf/renderer'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}

export default nextConfig
