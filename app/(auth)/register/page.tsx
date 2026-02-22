'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Shield, Store, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAuthErrorMessage } from '@/lib/utils'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { BUSINESS_CATEGORIES } from '@/lib/validations/business-profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Logo } from '@/components/ui/logo'
import { OAuthButtons } from '@/components/auth/OAuthButtons'

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showBusiness, setShowBusiness] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    document.title = 'Crear Cuenta - Telopillo.bo'
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      wantsBusiness: false,
      businessName: '',
      businessCategory: '',
    },
  })

  const toggleBusiness = () => {
    const next = !showBusiness
    setShowBusiness(next)
    setValue('wantsBusiness', next)
    if (!next) {
      setValue('businessName', '')
      setValue('businessCategory', '')
    }
  }

  const onSubmit = async (data: RegisterInput) => {
    try {
      setIsLoading(true)
      setError(null)

      const metadata: Record<string, string> = {
        full_name: data.fullName,
      }

      if (data.wantsBusiness && data.businessName) {
        metadata.business_name = data.businessName
        if (data.businessCategory) metadata.business_category = data.businessCategory
      }

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setSuccess(true)
    } catch (error) {
      setError(getAuthErrorMessage(error, 'Error al crear la cuenta'))
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="rounded-lg bg-green-50 p-8 dark:bg-green-950">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold">¡Registro Exitoso!</h2>
            <p className="mb-2 text-muted-foreground">
              Te hemos enviado un email de verificación. Revisa tu bandeja de entrada.
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              <span aria-hidden="true">💡</span> <strong>Tip:</strong> Si no lo ves, revisa tu
              carpeta de spam o correo no deseado.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Ir a Iniciar Sesión</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <Logo className="mx-auto" />
          <div>
            <h1 className="text-3xl font-semibold">Crear Cuenta</h1>
            <CardDescription>Únete a la comunidad de Telopillo</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                className="h-11"
                autoComplete="name"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                {...register('fullName')}
                disabled={isLoading}
              />
              {errors.fullName && (
                <p id="fullName-error" className="text-sm text-destructive" role="alert">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="h-11"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'password-error password-hint' : 'password-hint'
                }
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
              <p id="password-hint" className="text-xs text-muted-foreground">
                Mínimo 8 caracteres, 1 mayúscula, 1 número
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="h-11"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                {...register('confirmPassword')}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="text-sm text-destructive" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Optional business section */}
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
              <button
                type="button"
                onClick={toggleBusiness}
                className="flex w-full items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors min-h-[44px]"
                aria-expanded={showBusiness}
                aria-controls="business-fields"
              >
                <span className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" aria-hidden />
                  ¿Tienes un negocio? Créalo ahora (opcional)
                </span>
                {showBusiness ? (
                  <ChevronUp className="h-4 w-4" aria-hidden />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden />
                )}
              </button>

              {showBusiness && (
                <div id="business-fields" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Nombre del Negocio</Label>
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="Mi Tienda Bolivia"
                      className="h-11"
                      aria-invalid={!!errors.businessName}
                      aria-describedby={errors.businessName ? 'businessName-error' : undefined}
                      {...register('businessName')}
                      disabled={isLoading}
                    />
                    {errors.businessName && (
                      <p id="businessName-error" className="text-sm text-destructive" role="alert">
                        {errors.businessName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessCategory">Categoría del Negocio</Label>
                    <Select
                      onValueChange={(val) => setValue('businessCategory', val)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-11 w-full" id="businessCategory">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-foreground/60">
                      Opcional - puedes cambiarlo después
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" disabled={isLoading} className="w-full h-11">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O regístrate con</span>
            </div>
          </div>

          <OAuthButtons />

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>

          <div className="flex items-center justify-center gap-2 border-t pt-4 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" aria-hidden />
            <span>Tus datos están protegidos y seguros</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
