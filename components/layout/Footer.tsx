'use client'

import Link from 'next/link'
import { Facebook, Instagram, Twitter, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        {/* Mobile: Accordion Layout */}
        <div className="md:hidden space-y-4">
          {/* Brand - Always visible */}
          <div className="space-y-3 pb-4 border-b">
            <h3 className="text-lg font-bold">Telopillo.bo</h3>
            <p className="text-sm text-muted-foreground">Lo que buscás, ¡telopillo!</p>
            <div className="flex space-x-4">
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" aria-hidden />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" aria-hidden />
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" aria-hidden />
              </Link>
            </div>
          </div>

          {/* Company - Collapsible */}
          <div className="border-b pb-4">
            <button
              onClick={() => toggleSection('company')}
              className="flex w-full items-center justify-between py-2 text-sm font-semibold"
              aria-expanded={openSections.company}
            >
              Empresa
              <ChevronDown
                className={`h-4 w-4 transition-transform ${openSections.company ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {openSections.company && (
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/acerca" className="text-muted-foreground hover:text-primary">
                    Acerca de
                  </Link>
                </li>
                <li>
                  <Link href="/contacto" className="text-muted-foreground hover:text-primary">
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-primary">
                    Blog
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Support - Collapsible */}
          <div className="border-b pb-4">
            <button
              onClick={() => toggleSection('support')}
              className="flex w-full items-center justify-between py-2 text-sm font-semibold"
              aria-expanded={openSections.support}
            >
              Soporte
              <ChevronDown
                className={`h-4 w-4 transition-transform ${openSections.support ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {openSections.support && (
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/ayuda" className="text-muted-foreground hover:text-primary">
                    Centro de Ayuda
                  </Link>
                </li>
                <li>
                  <Link href="/seguridad" className="text-muted-foreground hover:text-primary">
                    Seguridad
                  </Link>
                </li>
                <li>
                  <Link href="/reportar" className="text-muted-foreground hover:text-primary">
                    Reportar Problema
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Legal - Collapsible */}
          <div className="border-b pb-4">
            <button
              onClick={() => toggleSection('legal')}
              className="flex w-full items-center justify-between py-2 text-sm font-semibold"
              aria-expanded={openSections.legal}
            >
              Legal
              <ChevronDown
                className={`h-4 w-4 transition-transform ${openSections.legal ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {openSections.legal && (
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/terminos" className="text-muted-foreground hover:text-primary">
                    Términos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidad" className="text-muted-foreground hover:text-primary">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-muted-foreground hover:text-primary">
                    Política de Cookies
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold">Telopillo.bo</h3>
            <p className="text-sm text-muted-foreground">Lo que buscás, ¡telopillo!</p>
            <div className="flex space-x-4">
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" aria-hidden />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" aria-hidden />
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" aria-hidden />
              </Link>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/acerca" className="text-muted-foreground hover:text-primary">
                  Acerca de
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-muted-foreground hover:text-primary">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Soporte</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/ayuda" className="text-muted-foreground hover:text-primary">
                  Centro de Ayuda
                </Link>
              </li>
              <li>
                <Link href="/seguridad" className="text-muted-foreground hover:text-primary">
                  Seguridad
                </Link>
              </li>
              <li>
                <Link href="/reportar" className="text-muted-foreground hover:text-primary">
                  Reportar Problema
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terminos" className="text-muted-foreground hover:text-primary">
                  Términos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-muted-foreground hover:text-primary">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted-foreground hover:text-primary">
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright - Always visible */}
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Telopillo.bo. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
