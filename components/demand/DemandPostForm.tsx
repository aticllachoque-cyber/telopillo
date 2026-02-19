'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { demandPostSchema, type DemandPostInput } from '@/lib/validations/demand'
import { CATEGORIES, getSubcategories } from '@/lib/data/categories'
import { CATEGORY_LABELS } from '@/lib/validations/product'
import { LocationSelector } from '@/components/profile/LocationSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface DemandPostFormProps {
  userId: string
}

export function DemandPostForm({ userId }: DemandPostFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DemandPostInput>({
    resolver: zodResolver(demandPostSchema),
    mode: 'onTouched',
    defaultValues: {
      title: '',
      description: '',
      category: undefined,
      subcategory: undefined,
      location_department: undefined,
      location_city: '',
      price_min: undefined,
      price_max: undefined,
    },
  })

  const selectedCategory = watch('category')
  const selectedDepartment = watch('location_department')
  const selectedCity = watch('location_city')
  const subcategories = selectedCategory ? getSubcategories(selectedCategory) : []

  const onSubmit = async (data: DemandPostInput) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const { data: post, error } = await supabase
        .from('demand_posts')
        .insert({
          user_id: userId,
          title: data.title,
          description: data.description,
          category: data.category,
          subcategory: data.subcategory || null,
          location_department: data.location_department,
          location_city: data.location_city,
          price_min: data.price_min ?? null,
          price_max: data.price_max ?? null,
        })
        .select('id')
        .single()

      if (error) throw error

      router.push(`/busco/${post.id}`)
    } catch (error) {
      console.error('Error creating demand post:', error)
      setSubmitError('No se pudo publicar tu solicitud. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">¿Qué estás buscando? *</Label>
        <Input
          id="title"
          placeholder="Ej: iPhone 13 128GB en buen estado"
          className="h-11"
          maxLength={100}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
          {...register('title')}
        />
        {errors.title && (
          <p id="title-error" className="text-sm text-destructive" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Describe lo que necesitas *</Label>
        <Textarea
          id="description"
          placeholder="Incluye detalles como marca, modelo, estado, color, características importantes..."
          className="min-h-[120px] resize-y"
          maxLength={1000}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
          {...register('description')}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-destructive" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Category + Subcategory */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Categoría *</Label>
          <Select
            value={selectedCategory || ''}
            onValueChange={(val) => {
              setValue('category', val as DemandPostInput['category'], {
                shouldValidate: true,
              })
              setValue('subcategory', undefined)
            }}
          >
            <SelectTrigger
              id="category"
              className="h-11"
              aria-invalid={!!errors.category}
              aria-describedby={errors.category ? 'category-error' : undefined}
            >
              <SelectValue placeholder="Selecciona categoría" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {CATEGORY_LABELS[cat.id as keyof typeof CATEGORY_LABELS] || cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p id="category-error" className="text-sm text-destructive" role="alert">
              {errors.category.message}
            </p>
          )}
        </div>

        {subcategories.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategoría</Label>
            <Select
              value={watch('subcategory') || ''}
              onValueChange={(val) => setValue('subcategory', val)}
            >
              <SelectTrigger id="subcategory" className="h-11">
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                {subcategories.map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Location */}
      <LocationSelector
        department={selectedDepartment || null}
        city={selectedCity || null}
        onDepartmentChange={(val) =>
          setValue('location_department', val as DemandPostInput['location_department'], {
            shouldValidate: true,
          })
        }
        onCityChange={(val) => setValue('location_city', val, { shouldValidate: true })}
        errors={{
          department: errors.location_department?.message,
          city: errors.location_city?.message,
        }}
      />

      {/* Price Range */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Presupuesto (opcional)</legend>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price_min">Desde Bs.</Label>
            <Input
              id="price_min"
              type="number"
              min={0}
              step="0.01"
              placeholder="0"
              className="h-11"
              aria-invalid={!!errors.price_min}
              aria-describedby={errors.price_min ? 'price-min-error' : undefined}
              value={watch('price_min') ?? ''}
              onChange={(e) => {
                const val = e.target.value
                setValue('price_min', val ? parseFloat(val) : undefined, {
                  shouldValidate: true,
                })
              }}
            />
            {errors.price_min && (
              <p id="price-min-error" className="text-sm text-destructive" role="alert">
                {errors.price_min.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="price_max">Hasta Bs.</Label>
            <Input
              id="price_max"
              type="number"
              min={0}
              step="0.01"
              placeholder="0"
              className="h-11"
              aria-invalid={!!errors.price_max}
              aria-describedby={errors.price_max ? 'price-max-error' : undefined}
              value={watch('price_max') ?? ''}
              onChange={(e) => {
                const val = e.target.value
                setValue('price_max', val ? parseFloat(val) : undefined, {
                  shouldValidate: true,
                })
              }}
            />
            {errors.price_max && (
              <p id="price-max-error" className="text-sm text-destructive" role="alert">
                {errors.price_max.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Submit Error */}
      {submitError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4" role="alert">
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}

      {/* Submit */}
      <Button type="submit" size="lg" className="w-full min-h-[44px]" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Publicando...
          </>
        ) : (
          'Publicar solicitud'
        )}
      </Button>
    </form>
  )
}
