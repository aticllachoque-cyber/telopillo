'use client'

import { ToastProvider as ToastProviderComponent } from '@/components/ui/toast'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <ToastProviderComponent>{children}</ToastProviderComponent>
}
