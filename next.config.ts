import type { NextConfig } from 'next'
import type { Redirect } from 'next/dist/lib/load-custom-routes'

// Single place for dev vs prod: local Supabase, dev origins, and CSP differ by NODE_ENV
const SUPABASE_CLOUD_HOSTNAME = 'apwpsjjzcbytnvtnmmru.supabase.co'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? `https://${SUPABASE_CLOUD_HOSTNAME}`
const supabaseOrigin = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  turbopack: {},
  // Dev only: allow dev server from other origins (e.g. phone at 192.168.1.12). Key must be present for Next to apply.
  allowedDevOrigins: isDev
    ? [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://192.168.1.12:3000',
        'https://localhost:3000',
        'https://127.0.0.1:3000',
        'https://192.168.1.12:3000',
      ]
    : [],
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
      // Local Supabase (dev only)
      ...(isDev
        ? [
            {
              protocol: 'http' as const,
              hostname: '127.0.0.1',
              port: '54321',
              pathname: '/storage/v1/object/public/**',
            },
            // Same storage host as 127.0.0.1; stored URLs may use localhost from env/clients
            {
              protocol: 'http' as const,
              hostname: 'localhost',
              port: '54321',
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
      ...(isDev
        ? [
            { protocol: 'https' as const, hostname: 'picsum.photos' },
            { protocol: 'https' as const, hostname: 'fastly.picsum.photos' },
          ]
        : []),
    ],
  },

  async redirects(): Promise<Redirect[]> {
    const base: Redirect[] = [
      {
        source: '/perfil',
        destination: '/profile',
        permanent: true,
      },
    ]

    // One canonical host for session cookies (www vs apex). Uses NEXT_PUBLIC_APP_URL hostname.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!isDev && appUrl && !appUrl.includes('localhost') && !appUrl.includes('127.0.0.1')) {
      try {
        const canonical = new URL(appUrl)
        const host = canonical.hostname
        const origin = canonical.origin
        if (host && !host.includes('vercel.app')) {
          const alternateHost = host.startsWith('www.') ? host.slice(4) : `www.${host}`
          if (alternateHost !== host) {
            base.push({
              source: '/:path*',
              has: [{ type: 'host', value: alternateHost }],
              destination: `${origin}/:path*`,
              permanent: true,
            })
          }
        }
      } catch {
        // ignore invalid NEXT_PUBLIC_APP_URL
      }
    }

    return base
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
              `img-src 'self' data: blob: https://${SUPABASE_CLOUD_HOSTNAME}${isDev ? ' http://127.0.0.1:54321 http://localhost:54321 https://picsum.photos https://fastly.picsum.photos' : ''}`,
              `connect-src 'self' ${supabaseOrigin}`,
              // worker-src allows blob: workers (e.g. browser-image-compression) when script-src does not
              "worker-src 'self' blob:",
              // TODO: Remove 'unsafe-inline' once we implement nonce-based CSP
              // For now, it's needed for inline styles in shadcn/ui and Tailwind
              "style-src 'self' 'unsafe-inline'",
              // 'unsafe-inline' needed for Next.js inline scripts
              // 'unsafe-eval' needed in dev for React Hot Reload; stripped in production
              // cdn.jsdelivr.net: browser-image-compression loads its web worker script from here when useWebWorker is true
              isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net"
                : "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
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
