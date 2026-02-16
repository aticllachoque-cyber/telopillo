'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './button'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7)
    const toast: Toast = { id, message, type }

    setToasts((prev) => [...prev, toast])

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div
        className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:left-auto sm:max-w-sm"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`
              flex items-center gap-3 p-4 rounded-lg shadow-lg border
              animate-in slide-in-from-bottom-5 fade-in duration-200
              motion-reduce:animate-none
              ${
                toast.type === 'error'
                  ? 'bg-destructive text-destructive-foreground border-destructive'
                  : toast.type === 'success'
                    ? 'bg-green-600 text-white border-green-700'
                    : toast.type === 'warning'
                      ? 'bg-yellow-600 text-white border-yellow-700'
                      : 'bg-background text-foreground border-border'
              }
            `}
          >
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 opacity-70 hover:opacity-100"
              onClick={() => removeToast(toast.id)}
              aria-label="Cerrar notificación"
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
