import { ProductCard } from './ProductCard'

interface Product {
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

interface ProductGridProps {
  products: Product[]
  onUpdate?: () => void
  showActions?: boolean
}

export function ProductGrid({ products, onUpdate, showActions = true }: ProductGridProps) {
  if (products.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onUpdate={onUpdate}
          showActions={showActions}
        />
      ))}
    </div>
  )
}
