import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
}

/**
 * Telopillo monogram (same geometry as app/icon.svg): charcoal tile, paper "T" whose
 * crossbar hooks right and catches the amber dot ("te lo pillo"). Decorative only —
 * callers render the visible "Telopillo" wordmark next to it.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="16 16 480 480"
      className={cn('size-8 shrink-0', className)}
      aria-hidden
      focusable="false"
    >
      <rect x="16" y="16" width="480" height="480" rx="112" fill="#1E1E1E" />
      <path
        d="M 140 166 H 324 Q 368 166 368 210 V 252 Q 368 282 340 282"
        fill="none"
        stroke="#F7F7F5"
        strokeWidth="64"
        strokeLinecap="round"
      />
      <path
        d="M 242 166 V 378"
        fill="none"
        stroke="#F7F7F5"
        strokeWidth="64"
        strokeLinecap="round"
      />
      <circle cx="305" cy="232" r="20" fill="#F59E0B" stroke="#1E1E1E" strokeWidth="6" />
    </svg>
  )
}
