'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OfferProductModalProps {
  demandPostId: string
  currentUserId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface UserProduct {
  id: string
  title: string
  price: number
  images: string[]
  status: string
  location_city: string
}

export function OfferProductModal({
  demandPostId,
  currentUserId,
  open,
  onClose,
  onSuccess,
}: OfferProductModalProps) {
  const supabase = createClient()
  const [products, setProducts] = useState<UserProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const loadProducts = async () => {
    setIsLoadingProducts(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('id, title, price, images, status, location_city')
        .eq('user_id', currentUserId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setProducts(data ?? [])
    } catch (err) {
      console.error('Error loading products:', err)
      setError('No se pudieron cargar tus productos.')
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedProductId) return

    setIsSubmitting(true)
    setError(null)

    try {
      const { error: insertError } = await supabase.from('demand_offers').insert({
        demand_post_id: demandPostId,
        product_id: selectedProductId,
        seller_id: currentUserId,
        message: message.trim() || null,
      })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Ya ofreciste este producto para esta solicitud.')
          return
        }
        throw insertError
      }

      onSuccess()
    } catch (err) {
      console.error('Error creating offer:', err)
      setError('No se pudo enviar la oferta. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ofrecer mi producto</DialogTitle>
          <DialogDescription className="text-pretty">
            Selecciona uno de tus productos activos para ofrecerlo al comprador.
          </DialogDescription>
        </DialogHeader>

        {isLoadingProducts ? (
          <div
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            aria-busy="true"
            aria-label="Cargando productos"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="size-14 shrink-0 rounded bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2 text-pretty">
              No tienes productos activos para ofrecer.
            </p>
            <p className="text-sm text-muted-foreground mb-4 text-pretty">
              Publica un producto primero para poder hacer ofertas.
            </p>
            <Button asChild variant="outline" className="min-h-[44px]">
              <a href="/publicar">Publicar producto</a>
            </Button>
          </div>
        ) : (
          <>
            <div
              className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-[300px] overflow-y-auto"
              role="radiogroup"
              aria-label="Selecciona un producto"
            >
              {products.map((product) => {
                const isSelected = selectedProductId === product.id
                const imageUrl = product.images?.[0]

                return (
                  <button
                    key={product.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedProductId(product.id)}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors min-h-[44px]',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    {imageUrl && (
                      <div className="relative h-14 w-14 shrink-0 rounded overflow-hidden bg-muted">
                        <Image
                          src={imageUrl}
                          alt={product.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.title}</p>
                      <p className="text-sm text-primary font-semibold">
                        Bs. {product.price.toLocaleString('es-BO')}
                      </p>
                      <p className="text-xs text-muted-foreground">{product.location_city}</p>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary shrink-0 mt-1" aria-hidden />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer-message">Mensaje (opcional)</Label>
              <Textarea
                id="offer-message"
                placeholder="Agrega un mensaje para el comprador..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                className="resize-y min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
            </div>
          </>
        )}

        {error && (
          <div
            className="rounded-lg border border-destructive/50 bg-destructive/5 p-3"
            role="alert"
          >
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="min-h-[44px]">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedProductId || isSubmitting}
            className="min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Enviando...
              </>
            ) : (
              'Enviar oferta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
