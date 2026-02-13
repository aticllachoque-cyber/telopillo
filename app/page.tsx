import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Package, Search, MessageCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="container py-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Lo que buscás, <span className="text-primary">¡telopillo!</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          El marketplace boliviano donde comprás y vendés de todo, fácil y rápido.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" asChild>
            <Link href="/buscar">Buscar Productos</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/publicar">Publicar Gratis</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">¿Por qué Telopillo.bo?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Package className="h-6 w-6 text-primary" />
                <CardTitle>Publicá Gratis</CardTitle>
              </div>
              <CardDescription>
                Publicá tus productos sin costo y llegá a miles de compradores en toda Bolivia
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Search className="h-6 w-6 text-primary" />
                <CardTitle>Búsqueda Inteligente</CardTitle>
              </div>
              <CardDescription>
                Encontrá lo que buscás rápido con nuestra búsqueda avanzada y filtros
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-6 w-6 text-primary" />
                <CardTitle>Chat Directo</CardTitle>
              </div>
              <CardDescription>
                Hablá directamente con vendedores y compradores de forma segura
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Categorías Populares</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            'Electrónica',
            'Vehículos',
            'Inmuebles',
            'Moda',
            'Hogar',
            'Deportes',
            'Servicios',
            'Más...',
          ].map((category) => (
            <Link key={category} href={`/categorias/${category.toLowerCase()}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <p className="font-medium">{category}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">¿Listo para empezar?</CardTitle>
            <CardDescription>
              Creá tu cuenta gratis y comenzá a comprar o vender hoy mismo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" asChild>
              <Link href="/registro">Crear Cuenta Gratis</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
