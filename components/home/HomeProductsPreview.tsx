import { HomeFeedSection } from './HomeFeedSection'
import type { HomepagePreviewProduct } from '@/lib/home/getHomepagePreview'
import { HomeProductListItem } from './HomeProductListItem'

interface HomeProductsPreviewProps {
  products: HomepagePreviewProduct[]
}

export function HomeProductsPreview({ products }: HomeProductsPreviewProps) {
  if (products.length === 0) return null

  return (
    <HomeFeedSection
      title="Publicaciones recientes"
      description="Una muestra de productos que ya se están moviendo en Telopillo."
      ctaHref="/buscar"
      ctaLabel="Ver más productos"
    >
      <ul className="grid list-none grid-cols-1 gap-4 p-0 m-0" role="list">
        {products.map((product, index) => (
          <li key={product.id}>
            <HomeProductListItem product={product} priority={index === 0} />
          </li>
        ))}
      </ul>
    </HomeFeedSection>
  )
}
