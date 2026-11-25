import { Tag } from 'lucide-react'
import { productPresentation } from '@/lib/constants/productPresentation'
import { cn } from '@/lib/utils'
import { formatBobPrice, resolveActivePromotion } from '@/lib/utils/promotion'

export interface ProductPriceProps {
  price: number
  promoPrice?: number | null
  promoName?: string | null
  variant?: 'card' | 'compact' | 'detail' | 'inline'
  /** Alignment for desktop detail headers */
  align?: 'left' | 'right'
  showPromoName?: boolean
  showDiscountBadge?: boolean
  className?: string
}

export function ProductPrice({
  price,
  promoPrice,
  promoName,
  variant = 'card',
  align = 'left',
  showPromoName = true,
  showDiscountBadge = true,
  className,
}: ProductPriceProps) {
  const promo = resolveActivePromotion(price, {
    promo_name: promoName,
    promo_price: promoPrice,
  })

  if (!promo) {
    const regularClass =
      variant === 'detail'
        ? productPresentation.detailPrice
        : variant === 'compact'
          ? 'text-xl font-bold leading-tight text-primary tabular-nums'
          : variant === 'inline'
            ? productPresentation.sellerPreviewPrice
            : productPresentation.listingPrice

    return (
      <p className={cn(regularClass, align === 'right' && 'sm:text-right', className)}>
        {formatBobPrice(price)}
      </p>
    )
  }

  const promoPriceSize =
    variant === 'detail'
      ? 'text-2xl sm:text-3xl font-bold tabular-nums leading-tight'
      : variant === 'compact'
        ? 'text-lg sm:text-xl font-bold tabular-nums leading-tight'
        : variant === 'inline'
          ? 'text-lg font-bold tabular-nums leading-tight'
          : 'text-xl sm:text-2xl font-bold tabular-nums leading-tight'

  const originalPriceSize =
    variant === 'detail'
      ? 'text-sm sm:text-base'
      : variant === 'compact' || variant === 'inline'
        ? 'text-xs sm:text-sm'
        : 'text-xs sm:text-sm'

  return (
    <div
      className={cn('flex min-w-0 flex-col gap-1', align === 'right' && 'sm:items-end', className)}
    >
      {showPromoName && (
        <div
          className={cn(
            'flex min-w-0 max-w-full flex-wrap items-center gap-1.5',
            align === 'right' && 'sm:justify-end'
          )}
        >
          <span
            className={cn(
              productPresentation.promoNamePill,
              variant === 'compact' && 'px-1.5 py-0.5 text-[11px]'
            )}
            title={promo.promoName}
          >
            <Tag className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{promo.promoName}</span>
          </span>
          {showDiscountBadge && promo.discountPercent > 0 && variant === 'detail' && (
            <span className={productPresentation.promoDiscountBadge}>
              -{promo.discountPercent}%
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          'flex flex-wrap items-baseline gap-x-2 gap-y-0.5',
          align === 'right' && 'sm:justify-end'
        )}
      >
        <p className={cn(promoPriceSize, productPresentation.promoPrice)}>
          <span className="sr-only">Precio en promoción: </span>
          {formatBobPrice(promo.promoPrice)}
        </p>
        <p className={cn(originalPriceSize, productPresentation.promoOriginalPrice)}>
          <span className="sr-only">Precio anterior: </span>
          {formatBobPrice(promo.originalPrice)}
        </p>
        {showDiscountBadge && promo.discountPercent > 0 && variant !== 'detail' && (
          <span
            className={cn(
              productPresentation.promoDiscountBadge,
              variant === 'compact' && 'text-[11px]'
            )}
          >
            <span className="sr-only">Descuento del </span>-{promo.discountPercent}%
          </span>
        )}
      </div>
    </div>
  )
}
