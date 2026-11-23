'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProductPrice } from '@/components/products/ProductPrice'
import type { SellerPromotionSummary } from '@/lib/actions/promotions'
import {
  PROMOTION_MAX_DISCOUNT_PERCENT,
  PROMOTION_MIN_DISCOUNT_PERCENT,
  PROMOTION_NAME_MAX_LENGTH,
  PROMOTION_QUICK_PERCENTS,
  calculateDiscountPercent,
  calculatePromoPriceFromPercent,
  formatBobPrice,
  roundBobAmount,
} from '@/lib/utils/promotion'
import {
  validatePromoPriceAgainstBase,
  type ProductPromotionInput,
} from '@/lib/validations/promotion'
import { cn } from '@/lib/utils'
import { Loader2, Percent, Sparkles, Tag } from 'lucide-react'

export interface PromotionFormDraft {
  mode: 'new' | 'existing'
  promotionId: string
  name: string
  /** Optional suggested discount percentage (string input, e.g. '10') */
  discountPercent: string
  /** Per-product promotional price in BOB (always editable by the seller) */
  promoPrice: string
  /** Original promotion ID when editing a product that already has a promotion */
  replacePromotionId?: string
}

export function createEmptyPromotionDraft(
  existingPromotions: SellerPromotionSummary[] = []
): PromotionFormDraft {
  const firstPromo = existingPromotions[0]
  return {
    mode: firstPromo ? 'existing' : 'new',
    promotionId: firstPromo ? firstPromo.id : '',
    name: '',
    discountPercent: '',
    promoPrice: '',
  }
}

export function buildPromotionPayloadFromDraft(
  draft: PromotionFormDraft,
  basePrice: number
): { payload: ProductPromotionInput | null; error: string | null } {
  const parsedPromoPrice = Number(draft.promoPrice)
  const priceError = validatePromoPriceAgainstBase(basePrice, parsedPromoPrice)
  if (priceError) {
    return { payload: null, error: priceError }
  }

  if (draft.mode === 'existing') {
    if (!draft.promotionId) {
      return { payload: null, error: 'Seleccioná una de tus promociones' }
    }
    return {
      payload: {
        mode: 'existing',
        promotionId: draft.promotionId,
        promoPrice: roundBobAmount(parsedPromoPrice),
      },
      error: null,
    }
  }

  const trimmedName = draft.name.trim()
  if (trimmedName.length < 2) {
    return {
      payload: null,
      error: 'Ingresá un nombre para la promoción (mínimo 2 caracteres)',
    }
  }
  if (trimmedName.length > PROMOTION_NAME_MAX_LENGTH) {
    return {
      payload: null,
      error: `El nombre no puede superar ${PROMOTION_NAME_MAX_LENGTH} caracteres`,
    }
  }

  const parsedPercent = draft.discountPercent.trim() ? Number(draft.discountPercent) : null
  const validPercent =
    parsedPercent != null &&
    Number.isInteger(parsedPercent) &&
    parsedPercent >= PROMOTION_MIN_DISCOUNT_PERCENT &&
    parsedPercent <= PROMOTION_MAX_DISCOUNT_PERCENT
      ? parsedPercent
      : null

  return {
    payload: {
      mode: 'new',
      name: trimmedName,
      promoPrice: roundBobAmount(parsedPromoPrice),
      defaultDiscountPercent: validPercent,
      replacePromotionId: draft.replacePromotionId,
    },
    error: null,
  }
}

interface PromotionFieldsProps {
  basePrice: number
  existingPromotions: SellerPromotionSummary[]
  isLoadingPromotions?: boolean
  value: PromotionFormDraft
  onChange: (next: PromotionFormDraft) => void
  error?: string | null
  disabled?: boolean
  idPrefix?: string
}

export function PromotionFields({
  basePrice,
  existingPromotions,
  isLoadingPromotions = false,
  value,
  onChange,
  error,
  disabled = false,
  idPrefix = 'promo',
}: PromotionFieldsProps) {
  const hasValidBasePrice = Number.isFinite(basePrice) && basePrice > 0
  const hasExistingPromotions = existingPromotions.length > 0
  const selectedExisting = existingPromotions.find((p) => p.id === value.promotionId)

  const numericPromoPrice = Number(value.promoPrice)
  const isPromoPriceValid =
    hasValidBasePrice &&
    Number.isFinite(numericPromoPrice) &&
    numericPromoPrice > 0 &&
    numericPromoPrice < basePrice

  const effectivePromoName =
    value.mode === 'existing' ? (selectedExisting?.name ?? '') : value.name.trim()

  const computedDiscountPercent = isPromoPriceValid
    ? calculateDiscountPercent(basePrice, numericPromoPrice)
    : 0
  const savingsAmount = isPromoPriceValid ? roundBobAmount(basePrice - numericPromoPrice) : 0

  const handleModeChange = (nextMode: 'new' | 'existing') => {
    if (nextMode === value.mode) return
    if (nextMode === 'existing' && existingPromotions.length > 0) {
      const target =
        existingPromotions.find((p) => p.id === value.promotionId) ?? existingPromotions[0]
      if (!target) return
      let nextPrice = value.promoPrice
      let nextPercent = value.discountPercent
      if (target.default_discount_percent && hasValidBasePrice && !nextPrice) {
        nextPercent = String(target.default_discount_percent)
        nextPrice = String(
          calculatePromoPriceFromPercent(basePrice, target.default_discount_percent)
        )
      }
      onChange({
        ...value,
        mode: 'existing',
        promotionId: target.id,
        discountPercent: nextPercent,
        promoPrice: nextPrice,
      })
    } else {
      onChange({
        ...value,
        mode: 'new',
      })
    }
  }

  const handleSelectExisting = (promotionId: string) => {
    const selected = existingPromotions.find((p) => p.id === promotionId)
    let nextPrice = value.promoPrice
    let nextPercent = value.discountPercent
    if (selected?.default_discount_percent && hasValidBasePrice) {
      nextPercent = String(selected.default_discount_percent)
      nextPrice = String(
        calculatePromoPriceFromPercent(basePrice, selected.default_discount_percent)
      )
    }
    onChange({
      ...value,
      mode: 'existing',
      promotionId,
      discountPercent: nextPercent,
      promoPrice: nextPrice,
    })
  }

  const handleApplyPercent = (percentValue: string) => {
    const cleaned = percentValue.replace(/[^\d]/g, '')
    const numeric = Number(cleaned)
    if (
      cleaned &&
      hasValidBasePrice &&
      Number.isInteger(numeric) &&
      numeric >= PROMOTION_MIN_DISCOUNT_PERCENT &&
      numeric <= PROMOTION_MAX_DISCOUNT_PERCENT
    ) {
      const calculated = calculatePromoPriceFromPercent(basePrice, numeric)
      onChange({
        ...value,
        discountPercent: cleaned,
        promoPrice: String(calculated),
      })
    } else {
      onChange({
        ...value,
        discountPercent: cleaned,
      })
    }
  }

  const handlePromoPriceChange = (rawPrice: string) => {
    const numeric = Number(rawPrice)
    const nextPercent =
      hasValidBasePrice && Number.isFinite(numeric) && numeric > 0 && numeric < basePrice
        ? String(calculateDiscountPercent(basePrice, numeric))
        : ''
    onChange({
      ...value,
      promoPrice: rawPrice,
      discountPercent: nextPercent === '0' ? '' : nextPercent,
    })
  }

  if (!hasValidBasePrice) {
    return (
      <div className="rounded-lg border border-border/80 bg-muted/40 p-4 text-sm text-muted-foreground">
        Ingresá primero un precio normal válido para este producto y después configurá la promoción.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mode selector: reuse an existing seller promotion or create a new one */}
      {isLoadingPromotions ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Cargando tus promociones...
        </div>
      ) : (
        hasExistingPromotions && (
          <div
            role="group"
            aria-label="Origen de la promoción"
            className="grid grid-cols-2 gap-2 rounded-lg bg-muted/60 p-1"
          >
            <Button
              type="button"
              variant={value.mode === 'existing' ? 'default' : 'ghost'}
              size="sm"
              disabled={disabled}
              onClick={() => handleModeChange('existing')}
              aria-pressed={value.mode === 'existing'}
              className="min-h-[44px] touch-manipulation sm:min-h-9"
            >
              Usar existente ({existingPromotions.length})
            </Button>
            <Button
              type="button"
              variant={value.mode === 'new' ? 'default' : 'ghost'}
              size="sm"
              disabled={disabled}
              onClick={() => handleModeChange('new')}
              aria-pressed={value.mode === 'new'}
              className="min-h-[44px] touch-manipulation sm:min-h-9"
            >
              Crear nueva
            </Button>
          </div>
        )
      )}

      {/* Existing promotion selector OR new promotion name */}
      {value.mode === 'existing' && hasExistingPromotions ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-existing`}>
            Elegí una de tus promociones <span className="text-destructive">*</span>
          </Label>
          <Select
            value={value.promotionId}
            onValueChange={handleSelectExisting}
            disabled={disabled}
          >
            <SelectTrigger id={`${idPrefix}-existing`} className="min-h-[44px] w-full sm:min-h-10">
              <SelectValue placeholder="Seleccioná una promoción" />
            </SelectTrigger>
            <SelectContent>
              {existingPromotions.map((promo) => (
                <SelectItem key={promo.id} value={promo.id}>
                  <span className="flex items-center gap-2">
                    <span>{promo.name}</span>
                    {promo.default_discount_percent != null && (
                      <span className="text-xs text-muted-foreground">
                        (-{promo.default_discount_percent}% sugerido)
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            El precio promocional se define para este producto en particular.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`${idPrefix}-name`}>
              Nombre de la promoción <span className="text-destructive">*</span>
            </Label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {value.name.length}/{PROMOTION_NAME_MAX_LENGTH}
            </span>
          </div>
          <div className="relative">
            <Tag
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id={`${idPrefix}-name`}
              type="text"
              maxLength={PROMOTION_NAME_MAX_LENGTH}
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              placeholder="Ej: Oferta fin de semana, Liquidación"
              disabled={disabled}
              className="min-h-[44px] pl-9 sm:min-h-10"
              aria-describedby={`${idPrefix}-name-help`}
            />
          </div>
          <p id={`${idPrefix}-name-help`} className="text-xs text-muted-foreground">
            Podrás reutilizar este nombre después en otros artículos.
          </p>
        </div>
      )}

      {/* Discount percentage helper (optional) + direct editable promo price */}
      <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Precio normal actual:{' '}
            <strong className="text-foreground tabular-nums">{formatBobPrice(basePrice)}</strong>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {PROMOTION_QUICK_PERCENTS.map((pct) => {
              const isSelected = value.discountPercent === String(pct)
              return (
                <button
                  key={pct}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleApplyPercent(String(pct))}
                  className={cn(
                    'min-h-[36px] rounded-md border px-2.5 text-xs font-semibold tabular-nums transition-colors touch-manipulation sm:min-h-7',
                    isSelected
                      ? 'border-rose-700 bg-rose-700 text-white dark:border-rose-500 dark:bg-rose-600'
                      : 'border-border bg-background text-foreground hover:bg-muted'
                  )}
                  aria-label={`Aplicar ${pct}% de descuento`}
                >
                  -{pct}%
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Promo price (seller always has final control) */}
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-price`}>
              Precio de promoción (BOB) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                Bs
              </span>
              <Input
                id={`${idPrefix}-price`}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                max={Math.max(0.01, basePrice - 0.01)}
                value={value.promoPrice}
                onChange={(e) => handlePromoPriceChange(e.target.value)}
                placeholder={String(calculatePromoPriceFromPercent(basePrice, 10))}
                disabled={disabled}
                className="min-h-[44px] pl-9 tabular-nums sm:min-h-10"
              />
            </div>
          </div>

          {/* Discount % input (auto-calculates promo price) */}
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-percent`}>Descuento (%) opcional</Label>
            <div className="relative">
              <Input
                id={`${idPrefix}-percent`}
                type="number"
                inputMode="numeric"
                min={PROMOTION_MIN_DISCOUNT_PERCENT}
                max={PROMOTION_MAX_DISCOUNT_PERCENT}
                step="1"
                value={value.discountPercent}
                onChange={(e) => handleApplyPercent(e.target.value)}
                placeholder="Ej: 5"
                disabled={disabled}
                className="min-h-[44px] pr-9 tabular-nums sm:min-h-10"
              />
              <Percent
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Ingresá un porcentaje para calcular el precio automáticamente, o fijá directamente el
          precio en Bs.
        </p>
      </div>

      {/* Inline validation error */}
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {/* Live storefront preview */}
      {isPromoPriceValid && effectivePromoName && (
        <div className="rounded-lg border border-rose-200/80 bg-rose-50/40 p-3 dark:border-rose-900/60 dark:bg-rose-950/20">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-rose-700 dark:text-rose-400" aria-hidden />
            Así se verá en tu vitrina
          </div>
          <ProductPrice
            price={basePrice}
            promoPrice={numericPromoPrice}
            promoName={effectivePromoName}
            variant="card"
          />
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            Ahorro para el comprador: <strong>{formatBobPrice(savingsAmount)}</strong>
            {computedDiscountPercent > 0 ? ` (-${computedDiscountPercent}%)` : ''}
          </p>
        </div>
      )}
    </div>
  )
}
