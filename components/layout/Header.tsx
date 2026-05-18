'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, Search, X } from 'lucide-react'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { MobileNavigationDrawer } from './MobileNavigationDrawer'
import { UserMenu } from './UserMenu'
import { SearchBar } from '@/components/search/SearchBar'
import { useAuth } from '@/components/providers/AuthProvider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, getAvatarColor } from '@/lib/utils'

function desktopMarketplaceLinkClass(pathname: string, href: string) {
  const active = pathname.startsWith(href)
  return cn(
    'inline-flex min-h-[44px] items-center rounded-md px-2.5 py-2 text-sm transition-colors whitespace-nowrap',
    active
      ? 'bg-background font-medium text-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
  )
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { user, profile, isAuthenticated, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const closeMenu = useCallback((restoreFocus = true) => {
    setMobileMenuOpen(false)
    if (restoreFocus) {
      requestAnimationFrame(() => previousActiveElement.current?.focus())
    }
  }, [])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    requestAnimationFrame(() => previousActiveElement.current?.focus())
  }, [])

  // Escape key to close menu or search overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (searchOpen) {
          closeSearch()
        } else if (mobileMenuOpen) {
          closeMenu()
          previousActiveElement.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen, searchOpen, closeMenu, closeSearch])

  // Close search overlay on route change
  useEffect(() => {
    if (searchOpen) setSearchOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Autofocus search input when overlay opens
  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }, [searchOpen])

  // Focus first focusable element when menu opens (WCAG 2.1.2 - No Keyboard Trap)
  useEffect(() => {
    if (mobileMenuOpen) {
      const menu = menuRef.current
      if (menu) {
        const focusable = menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
        focusable[0]?.focus()
      }
    }
  }, [mobileMenuOpen])

  // Body scroll lock when menu or search overlay is open
  useEffect(() => {
    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen, searchOpen])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 min-w-0 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center space-x-2 rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:flex-initial lg:shrink-0"
        >
          <span className="truncate text-[1.35rem] font-bold text-primary sm:text-2xl">
            Telopillo
          </span>
        </Link>

        {/* Desktop Search Bar (Suspense required for useSearchParams during static generation) */}
        <div className="hidden lg:flex flex-1 max-w-xl min-w-0">
          <Suspense fallback={<div className="w-full min-h-10" />}>
            <SearchBar className="w-full" />
          </Suspense>
        </div>

        {/* Desktop Navigation */}
        <nav
          className="hidden lg:flex items-center gap-2 shrink-0"
          aria-label="Navegación principal"
        >
          <div
            className="flex items-center gap-0.5 rounded-xl border border-border/80 bg-muted/40 px-1 py-1 shadow-sm"
            aria-labelledby="desktop-marketplace-nav-label"
          >
            <span id="desktop-marketplace-nav-label" className="sr-only">
              Marketplace
            </span>
            <Link
              href="/buscar"
              className={desktopMarketplaceLinkClass(pathname, '/buscar')}
              aria-current={pathname.startsWith('/buscar') ? 'page' : undefined}
            >
              Productos
            </Link>
            <Link
              href="/categorias"
              className={desktopMarketplaceLinkClass(pathname, '/categorias')}
              aria-current={pathname.startsWith('/categorias') ? 'page' : undefined}
            >
              Categorías
            </Link>
            <Link
              href="/busco"
              className={desktopMarketplaceLinkClass(pathname, '/busco')}
              aria-current={pathname.startsWith('/busco') ? 'page' : undefined}
            >
              Solicitudes
            </Link>
          </div>
          <Button asChild className="min-h-[44px]">
            <Link href="/crear">Publicar Gratis</Link>
          </Button>
          <UserMenu />
        </nav>

        {/* Mobile controls: search + avatar/login + hamburger */}
        <div className="flex shrink-0 items-center gap-0.5 lg:hidden sm:gap-1">
          {/* Mobile Search Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px] touch-manipulation"
            onClick={() => {
              previousActiveElement.current = document.activeElement as HTMLElement | null
              setSearchOpen(true)
            }}
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" aria-hidden />
          </Button>

          {!isAuthenticated ? (
            <Button asChild className="min-h-[44px] px-3 text-sm touch-manipulation sm:px-4">
              <Link href="/login">Entrar</Link>
            </Button>
          ) : profile ? (
            <Link
              href="/profile"
              className="shrink-0 rounded-full p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 touch-manipulation"
              aria-label="Ir a mi perfil"
            >
              <Avatar className="size-9">
                <AvatarImage
                  src={profile.avatar_url || undefined}
                  alt={`Foto de perfil de ${profile.full_name}`}
                />
                <AvatarFallback className={`text-xs font-medium ${getAvatarColor(user?.id || '')}`}>
                  {profile.full_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : null}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px] touch-manipulation"
            onClick={() => {
              if (mobileMenuOpen) {
                closeMenu()
              } else {
                previousActiveElement.current = document.activeElement as HTMLElement | null
                setMobileMenuOpen(true)
              }
            }}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-dialog"
          >
            <Menu className="h-6 w-6" aria-hidden />
          </Button>
        </div>
      </div>

      {/* Mobile slide-over menu (portal — not the sticky header bar) */}
      {mobileMenuOpen &&
        createPortal(
          <MobileNavigationDrawer
            panelRef={menuRef}
            onClose={closeMenu}
            pathname={pathname}
            isAuthenticated={isAuthenticated}
            profile={profile}
            user={user}
            signOut={signOut}
            router={router}
          />,
          document.body
        )}
      {/* Mobile Search Overlay */}
      {searchOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={closeSearch}
              aria-hidden="true"
            />
            <div
              className="fixed inset-x-0 top-0 z-50 bg-background shadow-lg lg:hidden"
              role="dialog"
              aria-label="Buscar productos"
              aria-modal="true"
            >
              <div className="container flex h-16 min-w-0 items-center gap-2 px-3 sm:px-4">
                <form
                  className="flex min-w-0 flex-1 items-center gap-2"
                  role="search"
                  aria-label="Buscar productos"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const input = searchInputRef.current
                    const q = input?.value.trim()
                    if (!q) return
                    router.push(`/buscar?q=${encodeURIComponent(q)}`)
                    setSearchOpen(false)
                  }}
                >
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      aria-hidden
                    />
                    <input
                      ref={searchInputRef}
                      type="search"
                      placeholder="Buscar productos..."
                      autoComplete="off"
                      maxLength={200}
                      className="flex h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label="Buscar productos"
                    />
                  </div>
                  <Button type="submit" size="icon" className="min-h-[44px] min-w-[44px] shrink-0">
                    <Search className="h-4 w-4" aria-hidden />
                  </Button>
                </form>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeSearch}
                  aria-label="Cerrar búsqueda"
                  className="min-h-[44px] min-w-[44px] shrink-0 touch-manipulation"
                >
                  <X className="h-5 w-5" aria-hidden />
                </Button>
              </div>
            </div>
          </>,
          document.body
        )}
    </header>
  )
}
