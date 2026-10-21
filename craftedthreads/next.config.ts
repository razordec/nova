import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    ppr: true, // Partial Prerendering (Next 15)
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  // model-viewer ships as a custom element; keep it out of SSR
  transpilePackages: ['@google/model-viewer'],
}

export default nextConfig