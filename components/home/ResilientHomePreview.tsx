'use client'

import { useEffect, useState } from 'react'
import { HomeDemandsPreview } from '@/components/home/HomeDemandsPreview'
import { HomeProductsPreview } from '@/components/home/HomeProductsPreview'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchWithPolicy } from '@/lib/network/fetch'
import type { HomepagePreviewProduct } from '@/lib/home/getHomepagePreview'
import { buildReadCacheKey, loadReadCache, saveReadCache } from '@/lib/offline/read-cache'
import type { SearchDemandPost } from '@/types/database'

interface HomePreviewResponse {
  products: HomepagePreviewProduct[]
  demands: SearchDemandPost[]
}

interface ResilientHomePreviewProps {
  initialData: HomePreviewResponse
}

const HOME_PREVIEW_CACHE_VERSION = 1
const HOME_PREVIEW_CACHE_KEY = buildReadCacheKey('home:preview', 'v1')

function HomePreviewSkeleton() {
  return (
    <div className="space-y-10 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="mt-3 h-5 w-full max-w-lg" />
        <div className="mt-6 grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ResilientHomePreview({ initialData }: ResilientHomePreviewProps) {
  const hasInitialContent = initialData.products.length > 0 || initialData.demands.length > 0
  const [data, setData] = useState<HomePreviewResponse | null>(
    hasInitialContent ? initialData : null
  )
  const [isLoading, setIsLoading] = useState(!hasInitialContent)
  const [cachedUpdatedAt, setCachedUpdatedAt] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const cached = !hasInitialContent
      ? loadReadCache<HomePreviewResponse>(HOME_PREVIEW_CACHE_KEY, HOME_PREVIEW_CACHE_VERSION)
      : null

    if (hasInitialContent) {
      saveReadCache(HOME_PREVIEW_CACHE_KEY, initialData, HOME_PREVIEW_CACHE_VERSION)
    } else if (cached) {
      setData(cached.data)
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }

    const load = async () => {
      try {
        const response = await fetchWithPolicy('/api/home-preview', {
          timeoutMs: 12_000,
          retries: 1,
        })

        if (!response.ok) {
          throw new Error('No se pudo cargar la portada.')
        }

        const nextData = (await response.json()) as HomePreviewResponse
        if (!isMounted) return

        setData(nextData)
        setCachedUpdatedAt(null)
        setErrorMessage(null)
        saveReadCache(HOME_PREVIEW_CACHE_KEY, nextData, HOME_PREVIEW_CACHE_VERSION)
      } catch (error) {
        console.error('[ResilientHomePreview] Failed to refresh home preview', error)
        if (!isMounted) return

        if (cached) {
          setData(cached.data)
          setCachedUpdatedAt(cached.updatedAt)
          setErrorMessage(null)
          return
        }

        setCachedUpdatedAt(null)
        setErrorMessage('No pudimos cargar la portada en este momento. Intenta de nuevo más tarde.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [hasInitialContent, initialData])

  if (isLoading && !data) {
    return <HomePreviewSkeleton />
  }

  return (
    <>
      {cachedUpdatedAt && (
        <section className="py-6">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Mostrando contenido guardado por una falla de conexión.{' '}
              {`Última actualización: ${new Date(cachedUpdatedAt).toLocaleString('es-BO')}.`}
            </div>
          </div>
        </section>
      )}

      {errorMessage && !data && (
        <section className="py-6">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          </div>
        </section>
      )}

      {data?.products.length ? <HomeProductsPreview products={data.products} /> : null}
      {data?.demands.length ? <HomeDemandsPreview demands={data.demands} /> : null}
    </>
  )
}
