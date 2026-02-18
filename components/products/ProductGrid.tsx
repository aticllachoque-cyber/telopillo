import { ProductCard } from './ProductCard'

interface Product {
  id: string
  user_id?: string
  title: string
  price: number
  images: string[]
  status: string
  location_city: string
  location_department: string
  views_count: number
  created_at: string
  // Seller info (optional — present when from search API)
  seller_name?: string | null
  seller_business_name?: string | null
  seller_business_slug?: string | null
  seller_verification_level?: number
}

interface ProductGridProps {
  products: Product[]
  onUpdate?: () => void
  showActions?: boolean
  /** Show or hide status badges on cards (hide on public-facing pages) */
  showStatusBadge?: boolean
}

export function ProductGrid({
  products,
  onUpdate,
  showActions = true,
  showStatusBadge,
}: ProductGridProps) {
  if (products.length === 0) {
    return null
  }

  return (
    <ul
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0"
      role="list"
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            onUpdate={onUpdate}
            showActions={showActions}
            showStatusBadge={showStatusBadge ?? showActions}
            priority={index === 0}
          />
        </li>
      ))}
    </ul>
  )
}
