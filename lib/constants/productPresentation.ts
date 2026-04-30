/**
 * Shared Tailwind classes for product listing cards and the product detail page.
 * Keeps typography, meta density, and the WhatsApp CTA visually aligned across surfaces.
 */
export const productPresentation = {
  listingTitle: 'font-semibold text-base sm:text-lg leading-snug text-balance line-clamp-2',
  listingPrice: 'text-xl sm:text-2xl font-bold text-primary tabular-nums leading-tight',
  /** Sidebar “Tu consulta sobre” preview on product detail */
  sellerPreviewPrice: 'font-bold text-base text-primary tabular-nums leading-tight',
  /** Detail page: one step above listing scale, not oversized on mobile */
  detailTitle: 'font-bold text-balance break-words text-xl sm:text-2xl lg:text-3xl tracking-tight',
  detailPrice: 'text-2xl sm:text-3xl font-bold text-primary tabular-nums leading-tight',
  locationRow: 'flex items-center gap-1 text-xs sm:text-sm text-muted-foreground',
  locationIcon: 'h-3 w-3 shrink-0',
  /** Description / section headings on detail */
  sectionHeading: 'text-base font-semibold sm:text-lg mb-2 sm:mb-3 text-balance',
  sectionBody:
    'text-sm sm:text-base text-muted-foreground whitespace-pre-wrap leading-relaxed text-pretty',
  /** Same outline WhatsApp treatment as listing cards */
  whatsappButtonClass:
    'min-h-[44px] border-green-700/80 bg-green-50 py-2 text-sm text-green-900 hover:bg-green-100 hover:text-green-950 dark:border-green-600 dark:bg-green-950/40 dark:text-green-50 dark:hover:bg-green-900/50',
  /** Compact meta rows (detail page): icon + label + value on one line */
  metaRow: 'flex items-start gap-2 text-sm leading-snug min-w-0',
  metaIcon: 'h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5',
  metaLabel: 'text-muted-foreground shrink-0',
} as const
