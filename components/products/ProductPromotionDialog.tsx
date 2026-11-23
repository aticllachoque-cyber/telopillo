'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useSnackbar } from '@/components/ui/snackbar'
import {
  PromotionFields,
  buildPromotionPayloadFromDraft,
  createEmptyPromotionDraft,
  type PromotionFormDraft,
} from '@/components/products/PromotionFields'
import {
  listMyPromotionsAction,
  removeProductPromotionAction,
  upsertProductPromotionAction,
  type SellerPromotionSummary,
} from '@/lib/actions/promotions'
import { calculateDiscountPercent } from '@/lib/utils/promotion'
import { Loader2, Tag, Trash2 } from 'lucide-react'

interface ProductPromotionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  productTitle?: string
  productPrice: number
  currentPromotion?: {
    promo_id?: string | null
    promo_name?: string | null
    promo_price?: number | null
  } | null
  onUpdate?: () => void
}

export function ProductPromotionDialog({
  open,
  onOpenChange,
  productId,
  productTitle,
  productPrice,
  currentPromotion,
  onUpdate,
}: ProductPromotionDialogProps) {
  const router = useRouter()
  const { showSnackbar } = useSnackbar()
  const [existingPromotions, setExistingPromotions] = useState<SellerPromotionSummary[]>([])
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<PromotionFormDraft>(() => createEmptyPromotionDraft())

  const hasCurrentPromotion =
    Boolean(currentPromotion?.promo_name) &&
    currentPromotion?.promo_price != null &&
    currentPromotion.promo_price > 0 &&
    currentPromotion.promo_price < productPrice

  useEffect(() => {
    if (!open) return

    let active = true
    setError(null)
    setIsLoadingPromotions(true)

    const initialPercent =
      hasCurrentPromotion && currentPromotion?.promo_price != null
        ? calculateDiscountPercent(productPrice, currentPromotion.promo_price)
        : 0

    if (hasCurrentPromotion) {
      setDraft({
        mode: 'new',
        promotionId: currentPromotion?.promo_id ?? '',
        name: currentPromotion?.promo_name ?? '',
        promoPrice: String(currentPromotion?.promo_price ?? ''),
        discountPercent: initialPercent > 0 ? String(initialPercent) : '',
        replacePromotionId: currentPromotion?.promo_id ?? undefined,
      })
    } else {
      setDraft(createEmptyPromotionDraft())
    }

    listMyPromotionsAction()
      .then((res) => {
        if (!active) return
        if (res.success) {
          setExistingPromotions(res.data)
          const firstPromo = res.data[0]
          if (!hasCurrentPromotion && firstPromo) {
            setDraft((prev) =>
              prev.name || prev.promoPrice
                ? prev
                : {
                    ...prev,
                    mode: 'existing',
                    promotionId: firstPromo.id,
                  }
            )
          }
        }
      })
      .finally(() => {
        if (active) setIsLoadingPromotions(false)
      })

    return () => {
      active = false
    }
  }, [
    open,
    hasCurrentPromotion,
    currentPromotion?.promo_id,
    currentPromotion?.promo_name,
    currentPromotion?.promo_price,
    productPrice,
  ])

  const notifySuccess = (message: string) => {
    showSnackbar(message, { variant: 'success' })
    onOpenChange(false)
    if (onUpdate) {
      onUpdate()
    } else {
      router.refresh()
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const { payload, error: validationError } = buildPromotionPayloadFromDraft(draft, productPrice)
    if (!payload || validationError) {
      setError(validationError ?? 'Revisá los datos de la promoción')
      return
    }

    setIsSaving(true)
    try {
      const result = await upsertProductPromotionAction(productId, payload)
      if (!result.success) {
        setError(result.error)
        return
      }
      notifySuccess(
        hasCurrentPromotion ? 'Promoción actualizada' : 'Promoción agregada al producto'
      )
    } catch (err) {
      console.error('[ProductPromotionDialog] save error', err)
      setError('No se pudo guardar la promoción. Intentá de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    setError(null)
    setIsRemoving(true)
    try {
      const result = await removeProductPromotionAction(productId)
      if (!result.success) {
        setError(result.error)
        return
      }
      notifySuccess('Promoción quitada del producto')
    } catch (err) {
      console.error('[ProductPromotionDialog] remove error', err)
      setError('No se pudo quitar la promoción. Intentá de nuevo.')
    } finally {
      setIsRemoving(false)
    }
  }

  const isBusy = isSaving || isRemoving

  return (
    <Dialog open={open} onOpenChange={(next) => !isBusy && onOpenChange(next)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-rose-700 dark:text-rose-400" aria-hidden />
            {hasCurrentPromotion ? 'Editar promoción' : 'Agregar promoción'}
          </DialogTitle>
          <DialogDescription className="text-pretty">
            {productTitle
              ? `Definí el nombre y el precio promocional para «${productTitle}».`
              : 'Definí el nombre y el precio promocional para este producto.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} noValidate className="space-y-5">
          <PromotionFields
            basePrice={productPrice}
            existingPromotions={existingPromotions}
            isLoadingPromotions={isLoadingPromotions}
            value={draft}
            onChange={(next) => {
              setDraft(next)
              if (error) setError(null)
            }}
            error={error}
            disabled={isBusy}
            idPrefix={`promo-${productId.slice(0, 8)}`}
          />

          <DialogFooter className="gap-2 sm:justify-between">
            {hasCurrentPromotion ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemove}
                disabled={isBusy}
                className="min-h-[44px] text-destructive hover:bg-destructive/10 hover:text-destructive touch-manipulation sm:min-h-10"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Quitando...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                    Quitar promoción
                  </>
                )}
              </Button>
            ) : (
              <div className="hidden sm:block" />
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isBusy}
                className="min-h-[44px] touch-manipulation sm:min-h-10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isBusy}
                className="min-h-[44px] touch-manipulation sm:min-h-10"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Guardando...
                  </>
                ) : (
                  'Guardar promoción'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
