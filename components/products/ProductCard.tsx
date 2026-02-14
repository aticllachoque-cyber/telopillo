import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, MapPin } from 'lucide-react'
import { ProductActions } from './ProductActions'

interface ProductCardProps {
  product: {
    id: string
    title: string
    price: number
    images: string[]
    status: string
    location_city: string
    location_department: string
    views_count: number
    created_at: string
  }
  onUpdate?: () => void
  showActions?: boolean
}

export function ProductCard({ product, onUpdate, showActions = true }: ProductCardProps) {
  const statusConfig = {
    active: { label: 'Activo', variant: 'default' as const, color: 'bg-green-500' },
    sold: { label: 'Vendido', variant: 'secondary' as const, color: 'bg-blue-500' },
    inactive: { label: 'Inactivo', variant: 'outline' as const, color: 'bg-gray-500' },
    deleted: { label: 'Eliminado', variant: 'destructive' as const, color: 'bg-red-500' },
  }

  const status = statusConfig[product.status as keyof typeof statusConfig] || statusConfig.active
  const imageUrl = product.images[0] || '/placeholder-product.png'
  const location = `${product.location_city}, ${product.location_department}`

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Image */}
      <Link
        href={`/productos/${product.id}`}
        className="block relative aspect-square overflow-hidden bg-muted"
      >
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={status.variant} className="shadow-md">
            {status.label}
          </Badge>
        </div>

        {/* Quick Actions Menu */}
        {showActions && (
          <div
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.preventDefault()}
          >
            <ProductActions
              productId={product.id}
              status={product.status}
              onUpdate={onUpdate}
              variant="dropdown"
            />
          </div>
        )}
      </Link>

      {/* Content */}
      <CardContent className="p-4">
        <Link href={`/productos/${product.id}`} className="block space-y-2">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
            {product.title}
          </h3>

          {/* Price */}
          <p className="text-2xl font-bold text-primary">
            Bs {product.price.toLocaleString('es-BO')}
          </p>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden />
            <span className="truncate">{location}</span>
          </div>
        </Link>
      </CardContent>

      {/* Footer - Stats */}
      <CardFooter className="p-4 pt-0 flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4" aria-hidden />
          <span>{product.views_count}</span>
        </div>
        <span className="text-xs">
          {new Date(product.created_at).toLocaleDateString('es-BO', {
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </CardFooter>
    </Card>
  )
}
