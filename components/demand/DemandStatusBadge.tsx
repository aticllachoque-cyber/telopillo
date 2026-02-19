import { Badge } from '@/components/ui/badge'

type DemandStatus = 'active' | 'found' | 'expired'

interface DemandStatusBadgeProps {
  status: DemandStatus
}

const STATUS_CONFIG: Record<DemandStatus, { label: string; className: string }> = {
  active: {
    label: 'Activo',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  found: {
    label: 'Encontrado',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  expired: {
    label: 'Expirado',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
}

export function DemandStatusBadge({ status }: DemandStatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}

export function getDemandDisplayStatus(status: string, expiresAt: string): DemandStatus {
  if (status === 'found') return 'found'
  if (status === 'active' && new Date(expiresAt) < new Date()) return 'expired'
  return 'active'
}
