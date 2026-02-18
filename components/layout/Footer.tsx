'use client'

import Link from 'next/link'
import { Facebook, Instagram, Twitter } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-6 md:py-8">
        {/* Top row: Brand + Social + Links */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Brand + Social */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold">Telopillo.bo</span>
            <div className="flex gap-3">
              <Link
                href="https://facebook.com/telopillo.bo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center touch-manipulation"
                aria-label="Seguinos en Facebook"
              >
                <Facebook className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="https://instagram.com/telopillo.bo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center touch-manipulation"
                aria-label="Seguinos en Instagram"
              >
                <Instagram className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="https://twitter.com/telopillo_bo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors p-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center touch-manipulation"
                aria-label="Seguinos en Twitter"
              >
                <Twitter className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          {/* Links - inline on mobile, row on desktop */}
          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
          >
            <Link
              href="/acerca"
              className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              Acerca de
            </Link>
            <Link
              href="/contacto"
              className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              Contacto
            </Link>
            <Link
              href="/ayuda"
              className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              Ayuda
            </Link>
            <Link
              href="/seguridad"
              className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              Seguridad
            </Link>
            <Link
              href="/terminos"
              className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              Términos
            </Link>
            <Link
              href="/privacidad"
              className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              Privacidad
            </Link>
            <Link
              href="/cookies"
              className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              Cookies
            </Link>
          </nav>
        </div>

        {/* Copyright */}
        <p className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
          &copy; {currentYear} Telopillo.bo. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
