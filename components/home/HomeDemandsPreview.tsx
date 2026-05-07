import { HomeFeedSection } from './HomeFeedSection'
import type { SearchDemandPost } from '@/types/database'
import { HomeDemandListItem } from './HomeDemandListItem'

interface HomeDemandsPreviewProps {
  demands: SearchDemandPost[]
}

export function HomeDemandsPreview({ demands }: HomeDemandsPreviewProps) {
  if (demands.length === 0) return null

  return (
    <HomeFeedSection
      title="Gente buscando esto ahora"
      description="Compradores publicando lo que necesitan para recibir ofertas de vendedores."
      ctaHref="/busco"
      ctaLabel="Ver más solicitudes"
    >
      <ul className="grid list-none grid-cols-1 gap-4 p-0 m-0" role="list">
        {demands.map((post) => (
          <li key={post.id}>
            <HomeDemandListItem post={post} />
          </li>
        ))}
      </ul>
    </HomeFeedSection>
  )
}
