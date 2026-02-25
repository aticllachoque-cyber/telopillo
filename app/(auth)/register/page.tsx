'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Shield, Store, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
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
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBusiness, setShowBusiness] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

      router.push('/')
    } catch (error) {
      setError(
        getAuthErrorMessage(
          error,
          'No se pudo crear la cuenta. Verificá tu email e intentá de nuevo.'
        )
      )
    } finally {
      setIsLoading(false)
    }
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="h-11 pr-10"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? 'password-error password-hint' : 'password-hint'
                  }
                  {...register('password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
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
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="h-11 pr-10"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  {...register('confirmPassword')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
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
