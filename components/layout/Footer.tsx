import Link from 'next/link'
import { Facebook, Instagram, Twitter } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold">Telopillo.bo</h3>
            <p className="text-sm text-muted-foreground">Lo que buscás, ¡telopillo!</p>
            <div className="flex space-x-4">
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
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

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Telopillo.bo. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
