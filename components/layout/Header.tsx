'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { UserMenu } from './UserMenu'
import { SearchBar } from '@/components/search/SearchBar'
import { useAuth } from '@/components/providers/AuthProvider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarColor } from '@/lib/utils'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, profile, isAuthenticated, signOut } = useAuth()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const closeMenu = useCallback((restoreFocus = true) => {
    setMobileMenuOpen(false)
    if (restoreFocus) {
      requestAnimationFrame(() => previousActiveElement.current?.focus())
    }
  }, [])

  // Escape key to close menu (WCAG 2.4.3 - Focus Order)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        closeMenu()
        previousActiveElement.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen, closeMenu])

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

  // Body scroll lock when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

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
          className="hidden md:flex items-center space-x-4 shrink-0"
          aria-label="Navegación principal"
        >
          <Link
            href="/categorias"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Categorías
          </Link>
          <Button asChild size="sm">
            <Link href="/publicar">Publicar Gratis</Link>
          </Button>
          <UserMenu />
        </nav>

        {/* Mobile controls: avatar/login + hamburger */}
        <div className="flex md:hidden items-center gap-2">
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
              className="fixed inset-0 z-[60] bg-black/50 md:hidden"
              onClick={() => closeMenu()}
              aria-hidden="true"
            />
            {/* Menu - Slide-in from right */}
            <div
              ref={menuRef}
              id="mobile-nav-dialog"
              className="fixed inset-y-0 right-0 z-[70] w-[280px] md:hidden bg-background shadow-2xl"
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
                  className="size-10 shrink-0 touch-manipulation"
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
                {/* Mobile Search Bar */}
                <div className="px-4 pt-4 pb-2">
                  <SearchBar placeholder="Buscar productos..." />
                </div>

                <div className="flex-1 px-4 py-4 space-y-1">
                  <Link
                    href="/buscar"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
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
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    Buscar
                  </Link>
                  <Link
                    href="/categorias"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
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

                  {/* Divider */}
                  <div className="py-2">
                    <div className="border-t" />
                  </div>

                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
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
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
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
                          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                          <path d="m3.3 7 8.7 5 8.7-5" />
                          <path d="M12 22V12" />
                        </svg>
                        Mis Publicaciones
                      </Link>
                      <Link
                        href="/mensajes"
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
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
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-left"
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
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
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
                  <Button asChild className="w-full" size="lg">
                    <Link href="/publicar" onClick={() => closeMenu(false)}>
                      Publicar Gratis
                    </Link>
                  </Button>
                </div>
              </nav>
            </div>
          </>,
          document.body
        )}
    </header>
  )
}
