import type { NextConfig } from 'next'

const SUPABASE_HOSTNAME = 'apwpsjjzcbytnvtnmmru.supabase.co'

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/test-results/**',
          '**/playwright-report/**',
        ],
        poll: 2000,
      }
    }
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: SUPABASE_HOSTNAME,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async redirects() {
    return [
      {
        source: '/perfil',
        destination: '/profile',
        permanent: true,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `img-src 'self' data: https://${SUPABASE_HOSTNAME}`,
              `connect-src 'self' https://${SUPABASE_HOSTNAME}`,
              // TODO: Remove 'unsafe-inline' once we implement nonce-based CSP
              // For now, it's needed for inline styles in shadcn/ui and Tailwind
              "style-src 'self' 'unsafe-inline'",
              // NOTE: 'unsafe-inline' needed for Next.js inline scripts
              // 'unsafe-eval' removed for better security (not required for Next.js 13+)
              "script-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
