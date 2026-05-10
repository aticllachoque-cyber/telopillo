import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { DemandPostForm } from '@/components/demand/DemandPostForm'
import { createClient } from '@/lib/supabase/server'
import type { DemandPostInput } from '@/lib/validations/demand'
import {
  getDemandEditPath,
  getDemandPath,
  resolveUuidFromRouteParam,
} from '@/lib/utils/publicRoutes'

interface EditDemandPostPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditDemandPostPage({ params }: EditDemandPostPageProps) {
  const supabase = await createClient()
  const { id: routeId } = await params
  const id = resolveUuidFromRouteParam(routeId)
  if (!id) {
    notFound()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(getDemandEditPath(routeId))}`)
  }

  const { data: post, error } = await supabase
    .from('demand_posts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !post) {
    notFound()
  }

  const defaultValues: Partial<DemandPostInput> = {
    title: post.title,
    description: post.description,
    category: post.category as DemandPostInput['category'],
    subcategory: post.subcategory ?? undefined,
    location_department: post.location_department as DemandPostInput['location_department'],
    location_city: post.location_city,
    price_min: post.price_min ?? undefined,
    price_max: post.price_max ?? undefined,
    image_url: post.image_url,
  }

  return (
    <div className="min-h-dvh bg-background py-8">
      <div className="container max-w-2xl px-4 sm:px-6">
        <div className="mb-8">
          <Link
            href={getDemandPath(id)}
            className="mb-4 inline-flex min-h-[44px] touch-manipulation items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Volver a la solicitud
          </Link>
          <h1 className="text-3xl font-bold text-balance">Editar solicitud</h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            Actualiza la información para que los vendedores entiendan mejor lo que necesitás.
          </p>
        </div>

        <DemandPostForm
          userId={user.id}
          demandPostId={id}
          mode="edit"
          defaultValues={defaultValues}
        />
      </div>
    </div>
  )
}
