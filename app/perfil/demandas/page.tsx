'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DemandStatusBadge, getDemandDisplayStatus } from '@/components/demand/DemandStatusBadge'
import {
  Plus,
  Loader2,
  ArrowLeft,
  Eye,
  CheckCircle2,
  RefreshCw,
  Trash2,
  MessageSquare,
} from 'lucide-react'
import type { DemandPost } from '@/types/database'

type TabKey = 'active' | 'found' | 'expired'

const TAB_LABELS: Record<TabKey, string> = {
  active: 'Activas',
  found: 'Encontradas',
  expired: 'Expiradas',
}

type TabCounts = Record<TabKey, number | null>

export default function DemandDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('active')
  const [posts, setPosts] = useState<DemandPost[]>([])
  const [tabCounts, setTabCounts] = useState<TabCounts>({
    active: null,
    found: null,
    expired: null,
  })
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRenewing, setIsRenewing] = useState<string | null>(null)
  const [isMarkingFound, setIsMarkingFound] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Mis Solicitudes - Telopillo.bo'
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) throw error
      if (!user) {
        router.push('/login?redirect=/perfil/demandas')
        return
      }
      setUserId(user.id)
    } catch {
      router.push('/login?redirect=/perfil/demandas')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTabCounts = useCallback(async () => {
    if (!userId) return
    const now = new Date().toISOString()
    try {
      const [activeRes, foundRes, expiredRes] = await Promise.all([
        supabase
          .from('demand_posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'active')
          .gt('expires_at', now),
        supabase
          .from('demand_posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'found'),
        supabase
          .from('demand_posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'active')
          .lt('expires_at', now),
      ])
      setTabCounts({
        active: activeRes.count ?? 0,
        found: foundRes.count ?? 0,
        expired: expiredRes.count ?? 0,
      })
    } catch (err) {
      console.error('Error fetching tab counts:', err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchPosts = useCallback(async () => {
    if (!userId) return
    setIsLoadingPosts(true)

    try {
      let query = supabase
        .from('demand_posts')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })

      if (activeTab === 'active') {
        query = query.eq('status', 'active').gt('expires_at', new Date().toISOString())
      } else if (activeTab === 'found') {
        query = query.eq('status', 'found')
      } else if (activeTab === 'expired') {
        query = query.eq('status', 'active').lt('expires_at', new Date().toISOString())
      }

      const { data, error } = await query
      if (error) throw error
      setPosts((data as DemandPost[]) ?? [])
    } catch (err) {
      console.error('Error fetching demand posts:', err)
    } finally {
      setIsLoadingPosts(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeTab])

  useEffect(() => {
    if (userId) {
      fetchPosts()
      fetchTabCounts()
    }
  }, [userId, activeTab, fetchPosts, fetchTabCounts])

  const handleDelete = async () => {
    if (!deleteTarget || !userId) return
    setIsDeleting(true)

    try {
      const { error } = await supabase
        .from('demand_posts')
        .update({ status: 'deleted' })
        .eq('id', deleteTarget)
        .eq('user_id', userId)

      if (error) throw error
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget))
      fetchTabCounts()
    } catch (err) {
      console.error('Error deleting post:', err)
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleRenew = async (postId: string) => {
    if (!userId) return
    setIsRenewing(postId)

    try {
      const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const { error } = await supabase
        .from('demand_posts')
        .update({ expires_at: newExpiry })
        .eq('id', postId)
        .eq('user_id', userId)

      if (error) throw error
      fetchPosts()
    } catch (err) {
      console.error('Error renewing post:', err)
    } finally {
      setIsRenewing(null)
    }
  }

  const handleMarkFound = async (postId: string) => {
    if (!userId) return
    setIsMarkingFound(postId)

    try {
      const { error } = await supabase
        .from('demand_posts')
        .update({ status: 'found' })
        .eq('id', postId)
        .eq('user_id', userId)

      if (error) throw error
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      fetchTabCounts()
    } catch (err) {
      console.error('Error marking as found:', err)
    } finally {
      setIsMarkingFound(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background py-8" aria-busy="true">
        <div className="container max-w-3xl px-4 sm:px-6">
          <div className="mb-6 space-y-3">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="flex items-center justify-between">
              <div className="h-7 w-40 rounded bg-muted animate-pulse" />
              <div className="h-10 w-36 rounded-md bg-muted animate-pulse" />
            </div>
          </div>
          <div className="flex gap-1 border-b mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 w-24 rounded bg-muted animate-pulse" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4 flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-16 rounded bg-muted animate-pulse" />
                  <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                </div>
                <div className="flex gap-1">
                  <div className="size-10 rounded bg-muted animate-pulse" />
                  <div className="size-10 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!userId) return null

  return (
    <div className="min-h-dvh bg-background py-8">
      <div className="container max-w-3xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/perfil"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 min-h-[44px] -my-2 py-2 -ml-2 pl-2 pr-2 touch-manipulation"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Volver al perfil
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-balance">Mis Solicitudes</h1>
            <Button asChild className="min-h-[44px]">
              <Link href="/busco/publicar">
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Nueva solicitud
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 border-b mb-4 sm:mb-6"
          role="tablist"
          aria-label="Estado de solicitudes"
        >
          {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => {
            const count = tabCounts[key]
            return (
              <button
                key={key}
                role="tab"
                aria-selected={activeTab === key}
                aria-controls={`tabpanel-${key}`}
                onClick={() => setActiveTab(key)}
                className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
                  activeTab === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {TAB_LABELS[key]}
                {count !== null && <span className="ml-1.5 tabular-nums text-xs">({count})</span>}
              </button>
            )
          })}
        </div>

        {/* Tab panel */}
        <div role="tabpanel" id={`tabpanel-${activeTab}`}>
          {isLoadingPosts ? (
            <div className="space-y-3" aria-busy="true" aria-label="Cargando solicitudes">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-4 flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-16 rounded bg-muted animate-pulse" />
                    <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="flex gap-1">
                    <div className="size-10 rounded bg-muted animate-pulse" />
                    <div className="size-10 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4 text-pretty">
                {activeTab === 'active' && 'No tienes solicitudes activas.'}
                {activeTab === 'found' && 'No tienes solicitudes marcadas como encontradas.'}
                {activeTab === 'expired' && 'No tienes solicitudes expiradas.'}
              </p>
              {activeTab === 'active' && (
                <Button asChild className="min-h-[44px]">
                  <Link href="/busco/publicar">
                    <Plus className="mr-2 h-4 w-4" aria-hidden />
                    Publicar solicitud
                  </Link>
                </Button>
              )}
              {activeTab === 'found' && (
                <Button asChild variant="outline" className="min-h-[44px]">
                  <Link href="/busco">Ver solicitudes activas</Link>
                </Button>
              )}
              {activeTab === 'expired' && (
                <Button asChild variant="outline" className="min-h-[44px]">
                  <Link href="/busco/publicar">
                    <Plus className="mr-2 h-4 w-4" aria-hidden />
                    Publicar nueva solicitud
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {posts.map((post) => {
                const display = getDemandDisplayStatus(post.status, post.expires_at)
                const hasOffers = post.offers_count > 0

                return (
                  <Card key={post.id}>
                    <CardContent className="py-3 sm:py-4">
                      <div className="min-w-0">
                        {/* Badges + title + description */}
                        <div className="flex items-center gap-2 mb-1">
                          {activeTab !== 'active' && <DemandStatusBadge status={display} />}
                          <Badge
                            variant={hasOffers ? 'default' : 'outline'}
                            className={`text-xs ${hasOffers ? 'bg-primary/15 text-primary border-primary/30' : ''}`}
                            aria-label={`${post.offers_count} ${post.offers_count === 1 ? 'oferta' : 'ofertas'}`}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" aria-hidden />
                            {post.offers_count} {post.offers_count === 1 ? 'oferta' : 'ofertas'}
                          </Badge>
                        </div>
                        <Link
                          href={`/busco/${post.id}`}
                          className="font-medium hover:text-primary line-clamp-2"
                        >
                          {post.title}
                        </Link>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {post.description}
                        </p>

                        {/* Actions row — full width on mobile */}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="min-h-[40px] gap-1.5 text-xs"
                          >
                            <Link href={`/busco/${post.id}`}>
                              <Eye className="h-4 w-4" aria-hidden />
                              <span>Ver</span>
                            </Link>
                          </Button>

                          {display === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkFound(post.id)}
                              disabled={isMarkingFound === post.id}
                              className="min-h-[40px] gap-1.5 text-xs"
                              aria-label={`Marcar como encontrado: ${post.title}`}
                            >
                              {isMarkingFound === post.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" aria-hidden />
                              )}
                              <span>Encontrado</span>
                            </Button>
                          )}

                          {display === 'expired' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRenew(post.id)}
                              disabled={isRenewing === post.id}
                              className="min-h-[40px] gap-1.5 text-xs"
                              aria-label={`Renovar solicitud: ${post.title}`}
                            >
                              {isRenewing === post.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              ) : (
                                <RefreshCw className="h-4 w-4" aria-hidden />
                              )}
                              <span>Renovar</span>
                            </Button>
                          )}

                          <div className="ml-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(post.id)}
                              className="min-h-[40px] gap-1.5 text-xs text-destructive hover:text-destructive"
                              aria-label={`Eliminar solicitud: ${post.title}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                              <span>Eliminar</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(val) => !val && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar esta solicitud?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Si necesitas volver a publicar, puedes crear una
                nueva solicitud desde el botón &quot;Nueva solicitud&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
