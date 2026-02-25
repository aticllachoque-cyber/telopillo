import type { NextConfig } from 'next'

const SUPABASE_CLOUD_HOSTNAME = 'apwpsjjzcbytnvtnmmru.supabase.co'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? `https://${SUPABASE_CLOUD_HOSTNAME}`
const supabaseOrigin = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`

const nextConfig: NextConfig = {
  turbopack: {},
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
        hostname: SUPABASE_CLOUD_HOSTNAME,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      ...(process.env.NODE_ENV === 'development'
        ? [
            { protocol: 'https' as const, hostname: 'picsum.photos' },
            { protocol: 'https' as const, hostname: 'fastly.picsum.photos' },
          ]
        : []),
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
              `img-src 'self' data: https://${SUPABASE_CLOUD_HOSTNAME} http://127.0.0.1:54321${process.env.NODE_ENV === 'development' ? ' https://picsum.photos https://fastly.picsum.photos' : ''}`,
              `connect-src 'self' ${supabaseOrigin}`,
              // TODO: Remove 'unsafe-inline' once we implement nonce-based CSP
              // For now, it's needed for inline styles in shadcn/ui and Tailwind
              "style-src 'self' 'unsafe-inline'",
              // 'unsafe-inline' needed for Next.js inline scripts
              // 'unsafe-eval' needed in dev for React Hot Reload; stripped in production
              process.env.NODE_ENV === 'production'
                ? "script-src 'self' 'unsafe-inline'"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
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
