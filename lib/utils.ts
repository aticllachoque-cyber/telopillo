import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const AUTH_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos',
  'Email not confirmed': 'Debes confirmar tu email antes de iniciar sesión',
  'User already registered': 'Este email ya está registrado',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  'Email rate limit exceeded': 'Demasiados intentos. Intenta de nuevo en unos minutos',
  'For security purposes, you can only request this after 60 seconds':
    'Por seguridad, espera 60 segundos antes de intentar de nuevo',
  'User not found': 'No se encontró una cuenta con ese email',
  'New password should be different from the old password':
    'La nueva contraseña debe ser diferente a la anterior',
  'Auth session missing': 'Tu sesión ha expirado. Inicia sesión de nuevo',
  'Token has expired or is invalid': 'El enlace ha expirado. Solicita uno nuevo',
}

/**
 * Maps Supabase auth error messages to user-friendly Spanish equivalents.
 * Falls back to `fallback` for unmapped errors.
 */
export function getAuthErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : String(error)
  return AUTH_ERROR_MAP[message] ?? fallback
}

/**
 * Deterministic avatar color palette.
 * Each entry is [background, text] Tailwind classes.
 * Chosen for WCAG AA contrast on both light and dark themes.
 */
const AVATAR_COLORS: [string, string][] = [
  ['bg-red-100 dark:bg-red-900/40', 'text-red-700 dark:text-red-300'],
  ['bg-orange-100 dark:bg-orange-900/40', 'text-orange-700 dark:text-orange-300'],
  ['bg-amber-100 dark:bg-amber-900/40', 'text-amber-700 dark:text-amber-300'],
  ['bg-yellow-100 dark:bg-yellow-900/40', 'text-yellow-700 dark:text-yellow-300'],
  ['bg-lime-100 dark:bg-lime-900/40', 'text-lime-700 dark:text-lime-300'],
  ['bg-green-100 dark:bg-green-900/40', 'text-green-700 dark:text-green-300'],
  ['bg-emerald-100 dark:bg-emerald-900/40', 'text-emerald-700 dark:text-emerald-300'],
  ['bg-teal-100 dark:bg-teal-900/40', 'text-teal-700 dark:text-teal-300'],
  ['bg-cyan-100 dark:bg-cyan-900/40', 'text-cyan-700 dark:text-cyan-300'],
  ['bg-sky-100 dark:bg-sky-900/40', 'text-sky-700 dark:text-sky-300'],
  ['bg-blue-100 dark:bg-blue-900/40', 'text-blue-700 dark:text-blue-300'],
  ['bg-indigo-100 dark:bg-indigo-900/40', 'text-indigo-700 dark:text-indigo-300'],
  ['bg-violet-100 dark:bg-violet-900/40', 'text-violet-700 dark:text-violet-300'],
  ['bg-purple-100 dark:bg-purple-900/40', 'text-purple-700 dark:text-purple-300'],
  ['bg-fuchsia-100 dark:bg-fuchsia-900/40', 'text-fuchsia-700 dark:text-fuchsia-300'],
  ['bg-pink-100 dark:bg-pink-900/40', 'text-pink-700 dark:text-pink-300'],
  ['bg-rose-100 dark:bg-rose-900/40', 'text-rose-700 dark:text-rose-300'],
]

/**
 * Returns a deterministic Tailwind class string for avatar fallback backgrounds.
 * Pass the user ID (preferred) or display name as seed.
 */
export function getAvatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  const [bg, text] = AVATAR_COLORS[index]
  return `${bg} ${text}`
}
