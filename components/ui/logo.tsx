import Link from 'next/link'
import { MapPin } from 'lucide-react'

interface LogoProps {
  className?: string
  showIcon?: boolean
}

export function Logo({ className = '', showIcon = true }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      {showIcon && <MapPin className="h-6 w-6 text-primary" aria-hidden />}
      <span className="text-2xl font-bold text-primary">Telopillo</span>
    </Link>
  )
}
