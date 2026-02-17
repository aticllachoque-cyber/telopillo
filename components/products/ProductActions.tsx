'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast'
import { Edit, MoreVertical, Loader2, Share2 } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://telopillo.bo'

interface ProductActionsProps {
  productId: string
  productTitle?: string
  status: string
  onUpdate?: () => void
  showEdit?: boolean
  variant?: 'dropdown' | 'buttons'
}

type ActionType = 'sold' | 'inactive' | 'delete' | null

export function ProductActions({
  productId,
  productTitle,
  status,
  onUpdate,
  showEdit = true,
  variant = 'dropdown',
}: ProductActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [dialogAction, setDialogAction] = useState<ActionType>(null)

  const handleEdit = () => {
    router.push(`/productos/${productId}/editar`)
  }

  const handleShareProduct = async () => {
    const productUrl = `${BASE_URL}/productos/${productId}`
    const shareTitle = productTitle || 'Producto en Telopillo.bo'
    const shareText = `Mira este producto: ${shareTitle}`

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: productUrl })
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(productUrl)
      showToast('Enlace del producto copiado', 'success')
    } catch {
      showToast('No se pudo copiar el enlace', 'error')
    }
  }

  const handleAction = async (action: ActionType) => {
    if (!action) return

    setIsProcessing(true)

    try {
      let newStatus: string

      switch (action) {
        case 'sold':
          newStatus = 'sold'
          break
        case 'inactive':
          newStatus = 'inactive'
          break
        case 'delete':
          newStatus = 'deleted'
          break
        default:
          return
      }

      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', productId)

      if (error) throw error

      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate()
      } else {
        // Default behavior: redirect to my products
        router.push('/perfil/mis-productos')
      }
    } catch (err) {
      console.error('Error updating product:', err)
      showToast('Error al actualizar el producto', 'error')
    } finally {
      setIsProcessing(false)
      setDialogAction(null)
    }
  }

  const openDialog = (action: ActionType) => {
    setDialogAction(action)
  }

  const closeDialog = () => {
    setDialogAction(null)
  }

  if (variant === 'buttons') {
    return (
      <>
        <div className="flex flex-wrap gap-2">
          {showEdit && (
            <Button onClick={handleEdit} variant="outline" disabled={isProcessing}>
              <Edit className="mr-2 h-4 w-4" aria-hidden />
              Editar
            </Button>
          )}
          {status === 'active' && (
            <>
              <Button onClick={() => openDialog('sold')} variant="outline" disabled={isProcessing}>
                Marcar como vendido
              </Button>
              <Button
                onClick={() => openDialog('inactive')}
                variant="outline"
                disabled={isProcessing}
              >
                Marcar como inactivo
              </Button>
            </>
          )}
          <Button
            onClick={() => openDialog('delete')}
            variant="destructive"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Procesando...
              </>
            ) : (
              'Eliminar'
            )}
          </Button>
        </div>

        {/* Confirmation Dialogs */}
        <ConfirmationDialogs
          dialogAction={dialogAction}
          isProcessing={isProcessing}
          onConfirm={handleAction}
          onCancel={closeDialog}
        />
      </>
    )
  }

  // Dropdown variant (default)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 shadow-md"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <MoreVertical className="h-4 w-4" aria-hidden />
            )}
            <span className="sr-only">Acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {showEdit && (
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" aria-hidden />
              Editar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleShareProduct}>
            <Share2 className="mr-2 h-4 w-4" aria-hidden />
            Compartir
          </DropdownMenuItem>
          {status === 'active' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openDialog('sold')}>
                Marcar como vendido
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDialog('inactive')}>
                Marcar como inactivo
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => openDialog('delete')}
            className="text-destructive focus:text-destructive"
          >
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialogs */}
      <ConfirmationDialogs
        dialogAction={dialogAction}
        isProcessing={isProcessing}
        onConfirm={handleAction}
        onCancel={closeDialog}
      />
    </>
  )
}

// Separate component for confirmation dialogs
function ConfirmationDialogs({
  dialogAction,
  isProcessing,
  onConfirm,
  onCancel,
}: {
  dialogAction: ActionType
  isProcessing: boolean
  onConfirm: (action: ActionType) => void
  onCancel: () => void
}) {
  return (
    <>
      {/* Mark as Sold Dialog */}
      <AlertDialog open={dialogAction === 'sold'} onOpenChange={onCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como vendido?</AlertDialogTitle>
            <AlertDialogDescription>
              El producto se marcará como vendido y dejará de aparecer en las búsquedas activas.
              Podrás reactivarlo más tarde si lo necesitas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onConfirm('sold')} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Procesando...
                </>
              ) : (
                'Marcar como vendido'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Inactive Dialog */}
      <AlertDialog open={dialogAction === 'inactive'} onOpenChange={onCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como inactivo?</AlertDialogTitle>
            <AlertDialogDescription>
              El producto se marcará como inactivo y dejará de aparecer en las búsquedas. Podrás
              reactivarlo cuando quieras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onConfirm('inactive')} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Procesando...
                </>
              ) : (
                'Marcar como inactivo'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={dialogAction === 'delete'} onOpenChange={onCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto será eliminado permanentemente y no
              podrá ser recuperado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onConfirm('delete')}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
