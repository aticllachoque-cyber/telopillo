'use client'

import { useState } from 'react'
import { User, Store, Phone, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BadgeConfig {
  label: string
  description: string
  icon: React.ReactNode
  variant: 'neutral' | 'positive'
}

function getBadgeConfig(hasBusinessProfile: boolean, verificationLevel: number): BadgeConfig {
  if (hasBusinessProfile) {
    if (verificationLevel >= 1) {
      return {
        label: 'Negocio con Teléfono',
        description: 'Este negocio proporcionó un número de teléfono de contacto',
        icon: <Phone className="size-3.5" aria-hidden="true" />,
        variant: 'positive',
      }
    }
    return {
      label: 'Nuevo Negocio',
      description: 'Este negocio se registró recientemente en Telopillo',
      icon: <Store className="size-3.5" aria-hidden="true" />,
      variant: 'neutral',
    }
  }

  // personal (no business profile)
  if (verificationLevel >= 1) {
    return {
      label: 'Vendedor con Teléfono',
      description: 'Este vendedor proporcionó un número de teléfono de contacto',
      icon: <Phone className="size-3.5" aria-hidden="true" />,
      variant: 'positive',
    }
  }
  return {
    label: 'Nuevo Vendedor',
    description: 'Este vendedor se registró recientemente en Telopillo',
    icon: <User className="size-3.5" aria-hidden="true" />,
    variant: 'neutral',
  }
}

interface VerificationBadgeProps {
  hasBusinessProfile: boolean
  verificationLevel: number
  size?: 'sm' | 'default'
  showTeaser?: boolean
  className?: string
}

export function VerificationBadge({
  hasBusinessProfile,
  verificationLevel,
  size = 'default',
  showTeaser = false,
  className,
}: VerificationBadgeProps) {
  const config = getBadgeConfig(hasBusinessProfile, verificationLevel)
  const [showTooltip, setShowTooltip] = useState(false)
  const descriptionId = `badge-desc-${hasBusinessProfile ? 'biz' : 'personal'}-${verificationLevel}`

  return (
    <div className={cn('inline-flex flex-col gap-1', className)}>
      <span
        role="img"
        aria-label={config.label}
        aria-describedby={descriptionId}
        tabIndex={0}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={cn(
          'relative inline-flex items-center gap-1.5 rounded-full border font-medium cursor-default',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
          config.variant === 'positive'
            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
            : 'border-muted bg-muted/50 text-muted-foreground'
        )}
      >
        {config.icon}
        {config.label}
        {config.variant === 'positive' && (
          <ShieldCheck className="size-3.5 text-green-600 dark:text-green-400" aria-hidden="true" />
        )}

        {/* Accessible tooltip */}
        {showTooltip && (
          <span
            role="tooltip"
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs font-normal text-popover-foreground bg-popover border rounded-md shadow-md whitespace-nowrap z-50 pointer-events-none"
          >
            {config.description}
          </span>
        )}
      </span>

      {/* Screen reader description (always available) */}
      <span id={descriptionId} className="sr-only">
        {config.description}
      </span>

      {showTeaser && verificationLevel < 2 && (
        <p className="text-xs text-muted-foreground">
          Próximamente podrás verificar tu identidad para ganar más confianza
        </p>
      )}
    </div>
  )
}
