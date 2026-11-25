import Link from 'next/link'
import { BrandMark } from '@/components/ui/brand-mark'

interface LogoProps {
  className?: string
  showIcon?: boolean
}

export function Logo({ className = '', showIcon = true }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      {showIcon && <BrandMark className="size-8" />}
      <span className="text-2xl font-bold tracking-tight text-foreground">Telopillo</span>
    </Link>
  )
}
