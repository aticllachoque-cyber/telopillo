'use client'

import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import type { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Package, Store, UserCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarColor } from '@/lib/utils'

const MENU_BASE =
  'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground'
const MENU_ACTIVE = 'bg-accent/60 text-accent-foreground'

export function menuClass(pathname: string, href: string) {
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
  return `${MENU_BASE} ${isActive ? MENU_ACTIVE : ''}`
}

type DrawerProfile = {
  full_name: string
  avatar_url: string | null
}

export type MobileNavigationDrawerProps = {
  panelRef: RefObject<HTMLDivElement | null>
  onClose: (restoreFocus?: boolean) => void
  pathname: string
  isAuthenticated: boolean
  profile: DrawerProfile | null | undefined
  user: User | null | undefined
  signOut: () => Promise<void>
  router: { push: (href: string) => void; refresh: () => void }
}

/**
 * Slide-over navigation panel for small viewports (hamburger menu).
 * Rendered via createPortal from Header — not the sticky header bar.
 */
export function MobileNavigationDrawer({
  panelRef,
  onClose,
  pathname,
  isAuthenticated,
  profile,
  user,
  signOut,
  router,
}: MobileNavigationDrawerProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 lg:hidden"
        onClick={() => onClose()}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        id="mobile-nav-dialog"
        className="fixed inset-y-0 right-0 z-50 w-[280px] lg:hidden bg-background shadow-2xl"
        role="dialog"
        aria-label="Menú de navegación"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b px-4 py-4">
          {isAuthenticated && profile ? (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage
                  src={profile.avatar_url || undefined}
                  alt={`Foto de perfil de ${profile.full_name}`}
                />
                <AvatarFallback className={`text-sm font-medium ${getAvatarColor(user?.id || '')}`}>
                  {profile.full_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{profile.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          ) : (
            <span className="text-lg font-bold">Menú</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onClose()}
            aria-label="Cerrar menú"
            className="size-11 min-h-[44px] min-w-[44px] shrink-0 touch-manipulation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </div>

        <nav
          className="flex flex-col h-[calc(100%-64px)] overflow-y-auto"
          aria-label="Navegación principal"
        >
          {!isAuthenticated && (
            <div className="mx-4 mt-4 rounded-lg border bg-primary/5 p-4">
              <p className="text-sm font-semibold">Creá tu cuenta gratis</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Publicá, ofertá y contactá vendedores
              </p>
              <Button asChild size="sm" className="w-full mt-3 min-h-[40px]">
                <Link href="/register" onClick={() => onClose(false)}>
                  Crear Cuenta
                </Link>
              </Button>
            </div>
          )}

          <div className="flex-1 px-4 py-4 flex flex-col gap-4">
            <section
              className="space-y-1 rounded-xl border border-border/80 bg-muted/40 p-3 shadow-sm"
              aria-labelledby="mobile-nav-marketplace-heading"
            >
              <h2
                id="mobile-nav-marketplace-heading"
                className="flex items-center gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-foreground/80"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background/80 text-foreground ring-1 ring-border/60">
                  <Store className="h-3.5 w-3.5" aria-hidden />
                </span>
                Marketplace
              </h2>
              <Link
                href="/"
                className={menuClass(pathname, '/')}
                aria-current={pathname === '/' ? 'page' : undefined}
                onClick={() => onClose(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Inicio
              </Link>
              <Link
                href="/buscar"
                className={menuClass(pathname, '/buscar')}
                aria-current={pathname.startsWith('/buscar') ? 'page' : undefined}
                onClick={() => onClose(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                Productos
              </Link>
              <Link
                href="/categorias"
                className={menuClass(pathname, '/categorias')}
                aria-current={pathname.startsWith('/categorias') ? 'page' : undefined}
                onClick={() => onClose(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
                Categorías
              </Link>
              <Link
                href="/busco"
                className={menuClass(pathname, '/busco')}
                aria-current={pathname.startsWith('/busco') ? 'page' : undefined}
                onClick={() => onClose(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Solicitudes
              </Link>
            </section>

            {isAuthenticated && (
              <section
                className="space-y-1 rounded-xl border border-primary/25 bg-primary/5 p-3 shadow-sm"
                aria-labelledby="mobile-nav-publications-heading"
              >
                <h2
                  id="mobile-nav-publications-heading"
                  className="flex items-center gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-foreground/90"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background/90 text-primary ring-1 ring-primary/25">
                    <Package className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  Publicaciones
                </h2>
                <Link
                  href="/perfil/mis-productos"
                  className={menuClass(pathname, '/perfil/mis-productos')}
                  aria-current={pathname.startsWith('/perfil/mis-productos') ? 'page' : undefined}
                  onClick={() => onClose(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="m7.5 4.27 9 5.15" />
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                  </svg>
                  Mis productos
                </Link>
                <Link
                  href="/perfil/demandas"
                  className={menuClass(pathname, '/perfil/demandas')}
                  aria-current={pathname.startsWith('/perfil/demandas') ? 'page' : undefined}
                  onClick={() => onClose(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <path d="M12 11h4" />
                    <path d="M12 16h4" />
                    <path d="M8 11h.01" />
                    <path d="M8 16h.01" />
                  </svg>
                  Mis solicitudes
                </Link>
              </section>
            )}

            <section
              className="space-y-1 rounded-xl border border-border/80 bg-muted/50 p-3 shadow-sm"
              aria-labelledby="mobile-nav-account-heading"
            >
              <h2
                id="mobile-nav-account-heading"
                className="flex items-center gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-foreground/80"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background/80 text-foreground ring-1 ring-border/60">
                  <UserCircle className="h-3.5 w-3.5" aria-hidden />
                </span>
                Cuenta
              </h2>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className={menuClass(pathname, '/profile')}
                    aria-current={pathname.startsWith('/profile') ? 'page' : undefined}
                    onClick={() => onClose(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Perfil
                  </Link>
                  <Link
                    href="/mensajes"
                    className={menuClass(pathname, '/mensajes')}
                    aria-current={pathname.startsWith('/mensajes') ? 'page' : undefined}
                    onClick={() => onClose(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                    </svg>
                    Mensajes
                  </Link>
                  <button
                    className={`${MENU_BASE} w-full text-left`}
                    onClick={async () => {
                      onClose()
                      await signOut()
                      router.push('/')
                      router.refresh()
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className={menuClass(pathname, '/login')}
                  aria-current={pathname.startsWith('/login') ? 'page' : undefined}
                  onClick={() => onClose(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" x2="3" y1="12" y2="12" />
                  </svg>
                  Iniciar Sesión
                </Link>
              )}
            </section>
          </div>

          <div className="border-t p-4">
            {isAuthenticated ? (
              <Button asChild className="w-full" size="lg">
                <Link href="/crear" onClick={() => onClose(false)}>
                  Publicar Gratis
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full" size="lg">
                <Link href="/register" onClick={() => onClose(false)}>
                  Crear Cuenta
                </Link>
              </Button>
            )}
          </div>
        </nav>
      </div>
    </>
  )
}
