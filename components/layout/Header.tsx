'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isAuthenticated = false // TODO: Replace with actual auth state
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
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">Telopillo.bo</span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center space-x-6 flex-1 justify-center"
          aria-label="Navegación principal"
        >
          <Link href="/buscar" className="text-sm font-medium transition-colors hover:text-primary">
            Buscar
          </Link>
          <Link
            href="/categorias"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Categorías
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Button asChild>
            <Link href="/publicar">Publicar Gratis</Link>
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mis-publicaciones">Mis Publicaciones</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mensajes">Mensajes</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
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

      {/* Mobile Menu with Backdrop */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => closeMenu()}
            aria-hidden="true"
          />
          {/* Menu */}
          <div
            ref={menuRef}
            id="mobile-nav-dialog"
            className="fixed inset-x-0 top-16 z-50 md:hidden border-t bg-background shadow-lg"
            role="dialog"
            aria-label="Menú de navegación"
            aria-modal="true"
          >
            <nav className="container py-4 space-y-3" aria-label="Navegación principal">
              <Link
                href="/buscar"
                className="block text-sm font-medium transition-colors hover:text-primary py-2"
                onClick={() => closeMenu(false)}
              >
                Buscar
              </Link>
              <Link
                href="/categorias"
                className="block text-sm font-medium transition-colors hover:text-primary py-2"
                onClick={() => closeMenu(false)}
              >
                Categorías
              </Link>
              <Link
                href="/publicar"
                className="block text-sm font-medium transition-colors hover:text-primary py-2"
                onClick={() => closeMenu(false)}
              >
                Publicar Gratis
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/perfil"
                    className="block text-sm font-medium transition-colors hover:text-primary py-2"
                    onClick={() => closeMenu(false)}
                  >
                    Perfil
                  </Link>
                  <Link
                    href="/mensajes"
                    className="block text-sm font-medium transition-colors hover:text-primary py-2"
                    onClick={() => closeMenu(false)}
                  >
                    Mensajes
                  </Link>
                  <button
                    className="block w-full text-left text-sm font-medium transition-colors hover:text-primary py-2"
                    onClick={() => closeMenu()}
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block text-sm font-medium transition-colors hover:text-primary py-2"
                  onClick={() => closeMenu(false)}
                >
                  Iniciar Sesión
                </Link>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
