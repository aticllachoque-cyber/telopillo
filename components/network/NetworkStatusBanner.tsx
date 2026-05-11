'use client'

import { useNetworkStatus } from '@/components/providers/NetworkStatusProvider'
import type { NetworkStatus } from '@/lib/network/status'

const BANNER_COPY: Record<NetworkStatus, string> = {
  offline:
    'Sin conexión. Puedes seguir navegando, pero algunas acciones no funcionarán hasta reconectarte.',
  reconnecting: 'Conexión restablecida. Reintentando sincronizar tu actividad...',
  online: '',
}

const BANNER_CLASSNAME: Record<Exclude<NetworkStatus, 'online'>, string> = {
  offline: 'border-amber-500/30 bg-amber-500/10 text-amber-950',
  reconnecting: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-950',
}

export function NetworkStatusBanner() {
  const { status } = useNetworkStatus()

  if (status === 'online') return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`border-b px-4 py-2 text-sm ${BANNER_CLASSNAME[status]}`}
    >
      <div className="container mx-auto max-w-6xl">
        <p>{BANNER_COPY[status]}</p>
      </div>
    </div>
  )
}
