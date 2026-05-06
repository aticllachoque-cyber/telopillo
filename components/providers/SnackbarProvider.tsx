'use client'

import { SnackbarProvider as SnackbarProviderComponent } from '@/components/ui/snackbar'

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  return <SnackbarProviderComponent>{children}</SnackbarProviderComponent>
}
