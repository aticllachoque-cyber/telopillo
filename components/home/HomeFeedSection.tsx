import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface HomeFeedSectionProps {
  title: string
  description: string
  ctaHref: string
  ctaLabel: string
  children: ReactNode
}

export function HomeFeedSection({
  title,
  description,
  ctaHref,
  ctaLabel,
  children,
}: HomeFeedSectionProps) {
  const headingId = `home-section-${title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`

  return (
    <section className="py-16 md:py-20" aria-labelledby={headingId}>
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 id={headingId} className="text-balance text-3xl font-bold sm:text-4xl">
              {title}
            </h2>
            <p className="mt-2 text-pretty text-muted-foreground">{description}</p>
          </div>
          <Link
            href={ctaHref}
            className="inline-flex min-h-[44px] shrink-0 touch-manipulation items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span>{ctaLabel}</span>
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          </Link>
        </div>
        {children}
      </div>
    </section>
  )
}
