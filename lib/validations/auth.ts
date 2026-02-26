import { z } from 'zod'
import { stripHtml } from './sanitize'

export const registerSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').transform(stripHtml),
    wantsBusiness: z.boolean().optional(),
    businessName: z
      .string()
      .optional()
      .transform((val) => (val ? stripHtml(val) : val)),
    businessCategory: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.wantsBusiness) {
        return !!data.businessName && data.businessName.trim().length >= 2
      }
      return true
    },
    {
      message: 'El nombre del negocio debe tener al menos 2 caracteres',
      path: ['businessName'],
    }
  )

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>
export type RegisterFormInput = z.input<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
