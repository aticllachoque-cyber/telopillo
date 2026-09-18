// Telopillo service worker: instant repeat launches for the TWA/PWA.
// - Home navigation: stale-while-revalidate (cached shell paints immediately)
// - Other navigations: network-first with offline page fallback
// - Immutable build assets and brand icons: cache-first
// - Optimized images (_next/image): stale-while-revalidate
// Cross-origin storage URLs are intentionally NOT intercepted: every app
// image goes through the same-origin /_next/image optimizer, and relaying
// opaque responses through respondWith proved unreliable in Chromium.
const VERSION = 'telopillo-v2'
const OFFLINE_URL = '/offline'
const RUNTIME_CACHE = `${VERSION}-runtime`
const HOME_PATH = '/'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(RUNTIME_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL]))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

// Store a response for later reuse. Set-Cookie is stripped so a cached
// navigation can never replay a stale session cookie.
async function stash(cache, request, response) {
  try {
    const headers = new Headers(response.headers)
    headers.delete('set-cookie')
    await cache.put(
      request,
      new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    )
  } catch {
    // Unstorable response (stream already consumed, quota, etc.); skip caching.
  }
}

// fallback: 'offline' serves the offline page (navigations); 'error' fails
// the request (subresources) so an <img> never receives HTML.
async function staleWhileRevalidate(request, { fallback = 'offline' } = {}) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)
  const networkFetch = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await stash(cache, request, response.clone())
      }
      return response
    })
    .catch(() => null)
  if (cached) return cached
  if (fallback === 'offline') {
    return (await networkFetch) || cache.match(OFFLINE_URL) || Response.error()
  }
  return (await networkFetch) || Response.error()
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    await stash(cache, request, response.clone())
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // Navigations: home is served stale-while-revalidate so the app paints
  // instantly on repeat launches (TWA cold start); everything else is
  // network-first with the offline page as fallback.
  if (request.mode === 'navigate') {
    const url = new URL(request.url)
    if (url.origin === self.location.origin && url.pathname === HOME_PATH) {
      event.respondWith(staleWhileRevalidate(request))
    } else {
      event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
    }
    return
  }

  const url = new URL(request.url)
  const isSameOrigin = url.origin === self.location.origin
  const isStaticAsset =
    isSameOrigin &&
    (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/'))
  const isOptimizedImage = isSameOrigin && url.pathname.startsWith('/_next/image')

  if (isStaticAsset) {
    event.respondWith(cacheFirst(request))
  } else if (isOptimizedImage) {
    event.respondWith(staleWhileRevalidate(request, { fallback: 'error' }))
  }
})
