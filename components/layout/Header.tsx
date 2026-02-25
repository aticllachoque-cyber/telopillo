'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, Search, X } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { UserMenu } from './UserMenu'
import { SearchBar } from '@/components/search/SearchBar'
import { useAuth } from '@/components/providers/AuthProvider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarColor } from '@/lib/utils'

const MENU_BASE =
  'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground'
const MENU_ACTIVE = 'bg-accent/60 text-accent-foreground'

function menuClass(pathname: string, href: string) {
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
  return `${MENU_BASE} ${isActive ? MENU_ACTIVE : ''}`
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
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <span className="text-2xl font-bold text-primary">Telopillo.bo</span>
        </Link>

        {/* Desktop Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <SearchBar className="w-full" />
        </div>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center space-x-3 shrink-0"
          aria-label="Navegación principal"
        >
          <Button asChild size="sm">
            <Link href="/publicar">Publicar Gratis</Link>
          </Button>
          <UserMenu />
        </nav>

        {/* Mobile controls: search + avatar/login + hamburger */}
        <div className="flex md:hidden items-center gap-1">
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
            <Button asChild size="sm">
              <Link href="/login">Ingresar</Link>
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

      {/* Mobile Menu rendered via Portal to escape header stacking context */}
      {mobileMenuOpen &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-50 bg-black/50 md:hidden"
              onClick={() => closeMenu()}
              aria-hidden="true"
            />
            {/* Menu - Slide-in from right */}
            <div
              ref={menuRef}
              id="mobile-nav-dialog"
              className="fixed inset-y-0 right-0 z-50 w-[280px] md:hidden bg-background shadow-2xl"
              role="dialog"
              aria-label="Menú de navegación"
              aria-modal="true"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between border-b px-4 py-4">
                {isAuthenticated && profile ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarImage
                        src={profile.avatar_url || undefined}
                        alt={`Foto de perfil de ${profile.full_name}`}
                      />
                      <AvatarFallback
                        className={`text-sm font-medium ${getAvatarColor(user?.id || '')}`}
                      >
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
                  onClick={() => closeMenu()}
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

              {/* Menu Content */}
              <nav
                className="flex flex-col h-[calc(100%-64px)] overflow-y-auto"
                aria-label="Navegación principal"
              >
                {/* Sign-up banner for logged-out users */}
                {!isAuthenticated && (
                  <div className="mx-4 mt-4 rounded-lg border bg-primary/5 p-4">
                    <p className="text-sm font-semibold">Creá tu cuenta gratis</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Publicá, ofertá y contactá vendedores
                    </p>
                    <Button asChild size="sm" className="w-full mt-3 min-h-[40px]">
                      <Link href="/register" onClick={() => closeMenu(false)}>
                        Crear Cuenta
                      </Link>
                    </Button>
                  </div>
                )}

                <div className="flex-1 px-4 py-4 space-y-1">
                  <Link
                    href="/"
                    className={menuClass(pathname, '/')}
                    aria-current={pathname === '/' ? 'page' : undefined}
                    onClick={() => closeMenu(false)}
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
                    onClick={() => closeMenu(false)}
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
                    onClick={() => closeMenu(false)}
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
                    onClick={() => closeMenu(false)}
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
                    Se busca
                  </Link>

                  {/* Divider */}
                  <div className="py-2">
                    <div className="border-t" />
                  </div>

                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/profile"
                        className={menuClass(pathname, '/profile')}
                        aria-current={pathname.startsWith('/profile') ? 'page' : undefined}
                        onClick={() => closeMenu(false)}
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
                        href="/perfil/mis-productos"
                        className={menuClass(pathname, '/perfil/mis-productos')}
                        aria-current={
                          pathname.startsWith('/perfil/mis-productos') ? 'page' : undefined
                        }
                        onClick={() => closeMenu(false)}
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
                        Mis Publicaciones
                      </Link>
                      <Link
                        href="/perfil/demandas"
                        className={menuClass(pathname, '/perfil/demandas')}
                        aria-current={pathname.startsWith('/perfil/demandas') ? 'page' : undefined}
                        onClick={() => closeMenu(false)}
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
                        Mis Solicitudes
                      </Link>
                      <Link
                        href="/mensajes"
                        className={menuClass(pathname, '/mensajes')}
                        aria-current={pathname.startsWith('/mensajes') ? 'page' : undefined}
                        onClick={() => closeMenu(false)}
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
                          closeMenu()
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
                      onClick={() => closeMenu(false)}
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
                </div>

                {/* Menu Footer - CTA */}
                <div className="border-t p-4">
                  {isAuthenticated ? (
                    <Button asChild className="w-full" size="lg">
                      <Link href="/publicar" onClick={() => closeMenu(false)}>
                        Publicar Gratis
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full" size="lg">
                      <Link href="/register" onClick={() => closeMenu(false)}>
                        Crear Cuenta
                      </Link>
                    </Button>
                  )}
                </div>
              </nav>
            </div>
          </>,
          document.body
        )}
      {/* Mobile Search Overlay */}
      {searchOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50 md:hidden"
              onClick={closeSearch}
              aria-hidden="true"
            />
            <div
              className="fixed inset-x-0 top-0 z-50 md:hidden bg-background shadow-lg"
              role="dialog"
              aria-label="Buscar productos"
              aria-modal="true"
            >
              <div className="container flex items-center gap-2 h-16">
                <form
                  className="flex flex-1 items-center gap-2"
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
