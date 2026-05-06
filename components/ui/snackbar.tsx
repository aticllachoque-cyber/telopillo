'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

type SnackbarVariant = 'success' | 'error' | 'warning' | 'info'

interface SnackbarAction {
  label: string
  onClick: () => void
}

interface SnackbarOptions {
  variant?: SnackbarVariant
  duration?: number | null
  action?: SnackbarAction
}

interface SnackbarItem {
  id: string
  message: string
  variant: SnackbarVariant
  duration: number | null
  action?: SnackbarAction
}

interface SnackbarContextType {
  showSnackbar: (message: string, options?: SnackbarOptions) => string
  dismissSnackbar: (id: string) => void
}

const DEFAULT_DURATIONS: Record<SnackbarVariant, number> = {
  success: 4000,
  info: 4000,
  warning: 5500,
  error: 7000,
}

const VARIANT_STYLES: Record<SnackbarVariant, string> = {
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/80 dark:bg-emerald-950/80 dark:text-emerald-100',
  error:
    'border-destructive/30 bg-destructive/10 text-foreground dark:border-destructive/50 dark:bg-destructive/15 dark:text-destructive-foreground',
  warning:
    'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/80 dark:bg-amber-950/80 dark:text-amber-100',
  info: 'border-border bg-card text-card-foreground dark:bg-card/95',
}

const VARIANT_ICON_STYLES: Record<SnackbarVariant, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-destructive dark:text-destructive',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-muted-foreground',
}

const VARIANT_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
} satisfies Record<SnackbarVariant, typeof CheckCircle2>

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined)

function getRole(variant: SnackbarVariant) {
  return variant === 'error' || variant === 'warning' ? 'alert' : 'status'
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbars, setSnackbars] = useState<SnackbarItem[]>([])
  const timeoutRefs = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismissSnackbar = useCallback((id: string) => {
    const timeoutId = timeoutRefs.current.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutRefs.current.delete(id)
    }
    setSnackbars((prev) => prev.filter((snackbar) => snackbar.id !== id))
  }, [])

  const showSnackbar = useCallback(
    (message: string, options: SnackbarOptions = {}) => {
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)
      const variant = options.variant ?? 'info'
      const duration =
        options.duration === undefined ? DEFAULT_DURATIONS[variant] : options.duration

      setSnackbars((prev) => [
        ...prev,
        {
          id,
          message,
          variant,
          duration,
          action: options.action,
        },
      ])

      if (typeof duration === 'number' && duration > 0) {
        const timeoutId = setTimeout(() => {
          dismissSnackbar(id)
        }, duration)
        timeoutRefs.current.set(id, timeoutId)
      }

      return id
    },
    [dismissSnackbar]
  )

  useEffect(() => {
    const timeouts = timeoutRefs.current
    return () => {
      for (const timeoutId of timeouts.values()) {
        clearTimeout(timeoutId)
      }
      timeouts.clear()
    }
  }, [])

  const contextValue = useMemo(
    () => ({
      showSnackbar,
      dismissSnackbar,
    }),
    [dismissSnackbar, showSnackbar]
  )

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}

      <div className="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-[min(100%,28rem)] flex-col gap-3 sm:inset-x-auto sm:right-4 sm:left-auto sm:mx-0">
        {snackbars.map((snackbar) => {
          const Icon = VARIANT_ICONS[snackbar.variant]

          return (
            <div
              key={snackbar.id}
              role={getRole(snackbar.variant)}
              aria-live={
                snackbar.variant === 'error' || snackbar.variant === 'warning'
                  ? 'assertive'
                  : 'polite'
              }
              aria-atomic="true"
              className={cn(
                'pointer-events-auto overflow-hidden rounded-2xl border shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/95',
                'animate-in slide-in-from-bottom-4 fade-in duration-200 motion-reduce:animate-none',
                VARIANT_STYLES[snackbar.variant]
              )}
            >
              <div className="flex items-start gap-3 px-4 py-3.5">
                <Icon
                  className={cn('mt-0.5 size-5 shrink-0', VARIANT_ICON_STYLES[snackbar.variant])}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-5">{snackbar.message}</p>
                  {snackbar.action ? (
                    <Button
                      type="button"
                      variant="link"
                      className="mt-1 h-auto px-0 text-sm font-semibold text-current"
                      onClick={snackbar.action.onClick}
                    >
                      {snackbar.action.label}
                    </Button>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="mt-[-2px] shrink-0 rounded-full text-current opacity-70 hover:bg-black/5 hover:text-current hover:opacity-100 dark:hover:bg-white/10"
                  onClick={() => dismissSnackbar(snackbar.id)}
                  aria-label="Cerrar notificación"
                >
                  <X className="size-3.5" aria-hidden />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </SnackbarContext.Provider>
  )
}

export function useSnackbar() {
  const context = useContext(SnackbarContext)
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider')
  }
  return context
}
