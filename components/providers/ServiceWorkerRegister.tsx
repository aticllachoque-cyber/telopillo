'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker in production only.
 * Skipped in dev to avoid stale cache interference with HMR.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service worker registration failed:', error)
      })
    }
  }, [])

  return null
}
