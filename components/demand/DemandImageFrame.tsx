import Image from 'next/image'
import { CATEGORY_ICONS } from '@/lib/data/categories'
import { CATEGORY_LABELS } from '@/lib/validations/product'
import { cn } from '@/lib/utils'
import { resolveDemandImageUrl, shouldBypassNextImageOptimization } from '@/lib/utils/image'

interface DemandImageFrameProps {
  imageUrl: string | null
  category: string
  title: string
  className?: string
  aspectClassName?: string
  sizes?: string
  iconClassName?: string
}

const CATEGORY_ACCENTS: Record<string, string> = {
  electronics: 'from-sky-100 via-cyan-50 to-blue-100 text-sky-900',
  vehicles: 'from-orange-100 via-amber-50 to-yellow-100 text-orange-950',
  home: 'from-emerald-100 via-lime-50 to-green-100 text-emerald-950',
  fashion: 'from-rose-100 via-pink-50 to-fuchsia-100 text-rose-950',
  construction: 'from-stone-200 via-amber-100 to-orange-100 text-stone-950',
  sports: 'from-teal-100 via-cyan-50 to-sky-100 text-teal-950',
  baby: 'from-violet-100 via-fuchsia-50 to-pink-100 text-violet-950',
  toys: 'from-indigo-100 via-blue-50 to-sky-100 text-indigo-950',
  beauty: 'from-pink-100 via-rose-50 to-purple-100 text-pink-950',
  books: 'from-yellow-100 via-amber-50 to-orange-100 text-yellow-950',
}

export function DemandImageFrame({
  imageUrl,
  category,
  title,
  className,
  aspectClassName = 'aspect-[16/10]',
  sizes = '(max-width: 768px) 100vw, 50vw',
  iconClassName,
}: DemandImageFrameProps) {
  const Icon = CATEGORY_ICONS[category]
  const categoryLabel = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category
  const accent =
    CATEGORY_ACCENTS[category] || 'from-slate-100 via-gray-50 to-zinc-100 text-slate-900'
  const resolvedImageUrl = resolveDemandImageUrl(imageUrl)

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/60 bg-muted shadow-sm',
        aspectClassName,
        className
      )}
    >
      {resolvedImageUrl ? (
        <Image
          src={resolvedImageUrl}
          alt={title}
          fill
          className="object-cover"
          sizes={sizes}
          unoptimized={shouldBypassNextImageOptimization(resolvedImageUrl)}
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br p-4 text-center',
            accent
          )}
        >
          {Icon ? <Icon className={cn('h-9 w-9 opacity-90', iconClassName)} aria-hidden /> : null}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">Busco</p>
            <p className="line-clamp-2 text-sm font-semibold text-balance">{categoryLabel}</p>
          </div>
        </div>
      )}
    </div>
  )
}
