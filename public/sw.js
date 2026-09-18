// Telopillo service worker: offline fallback for navigations,
// cache-first for immutable build assets and brand icons.
const VERSION = 'telopillo-v1'
const OFFLINE_URL = '/offline'
const RUNTIME_CACHE = `${VERSION}-runtime`

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(RUNTIME_CACHE).then((cache) => cache.addAll([OFFLINE_URL])))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)))
      )
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // Navigations: network-first, offline page as fallback.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
    return
  }

  // Immutable assets: cache-first.
  const url = new URL(request.url)
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/'))

  if (isStaticAsset) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
      })
    )
  }
})
