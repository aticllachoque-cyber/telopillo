'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import {
  productSchema,
  type ProductInput,
  CONDITION_LABELS,
  CONDITION_DESCRIPTIONS,
  PRODUCT_CONDITIONS,
  BOLIVIA_DEPARTMENTS,
} from '@/lib/validations/product'
import { CATEGORIES, getSubcategories } from '@/lib/data/categories'
import { ImageUpload } from '@/components/products/ImageUpload'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, AlertCircle } from 'lucide-react'

interface ProductFormProps {
  userId: string
  defaultValues?: Partial<ProductInput>
  productId?: string // For editing
  mode?: 'create' | 'edit'
}

export function ProductForm({
  userId,
  defaultValues,
  productId,
  mode = 'create',
}: ProductFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subcategories, setSubcategories] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues || {
      images: [],
    },
  })

  // Watch category to update subcategories
  const selectedCategory = watch('category')
  const images = watch('images')
  const title = watch('title')
  const description = watch('description')

  // Update subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const subs = getSubcategories(selectedCategory)
      setSubcategories(subs)
      // Reset subcategory if it's not valid for the new category
      const currentSubcategory = watch('subcategory')
      if (currentSubcategory && !subs.includes(currentSubcategory)) {
        setValue('subcategory', undefined)
      }
    } else {
      setSubcategories([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory])

  const onSubmit = async (data: ProductInput) => {
    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === 'create') {
        // Create new product
        const { data: product, error: insertError } = await supabase
          .from('products')
          .insert({
            user_id: userId,
            title: data.title,
            description: data.description,
            category: data.category,
            subcategory: data.subcategory || null,
            price: data.price,
            condition: data.condition,
            location_department: data.location_department,
            location_city: data.location_city,
            images: data.images,
            status: 'active',
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Redirect to product detail page
        router.push(`/productos/${product.id}`)
      } else if (mode === 'edit' && productId) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            title: data.title,
            description: data.description,
            category: data.category,
            subcategory: data.subcategory || null,
            price: data.price,
            condition: data.condition,
            location_department: data.location_department,
            location_city: data.location_city,
            images: data.images,
          })
          .eq('id', productId)
          .eq('user_id', userId) // Ensure user owns the product

        if (updateError) throw updateError

        // Redirect to product detail page
        router.push(`/productos/${productId}`)
      }
    } catch (err) {
      console.error('Error saving product:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar el producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4 flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Error al guardar</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Título del Producto <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Ej: iPhone 13 Pro Max 256GB"
          aria-invalid={errors.title ? 'true' : 'false'}
          aria-describedby={errors.title ? 'title-error' : 'title-help'}
        />
        <div className="flex justify-between items-center">
          <p id="title-help" className="text-xs text-muted-foreground">
            Mínimo 10 caracteres, máximo 100
          </p>
          <p className="text-xs text-muted-foreground">{title?.length || 0}/100</p>
        </div>
        {errors.title && (
          <p id="title-error" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Descripción <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Describe tu producto en detalle: estado, características, incluye..."
          rows={6}
          aria-invalid={errors.description ? 'true' : 'false'}
          aria-describedby={errors.description ? 'description-error' : 'description-help'}
        />
        <div className="flex justify-between items-center">
          <p id="description-help" className="text-xs text-muted-foreground">
            Mínimo 50 caracteres, máximo 5000
          </p>
          <p className="text-xs text-muted-foreground">{description?.length || 0}/5000</p>
        </div>
        {errors.description && (
          <p id="description-error" className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Category & Subcategory */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">
            Categoría <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedCategory}
            onValueChange={(value) => setValue('category', value as ProductInput['category'])}
          >
            <SelectTrigger
              id="category"
              aria-invalid={errors.category ? 'true' : 'false'}
              aria-describedby={errors.category ? 'category-error' : undefined}
            >
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p id="category-error" className="text-sm text-destructive">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Subcategory */}
        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategoría (Opcional)</Label>
          <Select
            value={watch('subcategory') || ''}
            onValueChange={(value) => setValue('subcategory', value || undefined)}
            disabled={!selectedCategory || subcategories.length === 0}
          >
            <SelectTrigger id="subcategory">
              <SelectValue placeholder="Selecciona una subcategoría" />
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
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price">
          Precio (BOB) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="1"
          {...register('price', { valueAsNumber: true })}
          placeholder="Ej: 5000"
          aria-invalid={errors.price ? 'true' : 'false'}
          aria-describedby={errors.price ? 'price-error' : 'price-help'}
        />
        <p id="price-help" className="text-xs text-muted-foreground">
          Precio en Bolivianos (BOB)
        </p>
        {errors.price && (
          <p id="price-error" className="text-sm text-destructive">
            {errors.price.message}
          </p>
        )}
      </div>

      {/* Condition */}
      <div className="space-y-3">
        <Label>
          Estado del Producto <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={watch('condition')}
          onValueChange={(value) => setValue('condition', value as ProductInput['condition'])}
          aria-invalid={errors.condition ? 'true' : 'false'}
          aria-describedby={errors.condition ? 'condition-error' : undefined}
        >
          {PRODUCT_CONDITIONS.map((condition) => (
            <div key={condition} className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value={condition} id={`condition-${condition}`} />
              <div className="space-y-1 leading-none">
                <Label htmlFor={`condition-${condition}`} className="font-medium cursor-pointer">
                  {CONDITION_LABELS[condition]}
                </Label>
                <p className="text-sm text-muted-foreground">{CONDITION_DESCRIPTIONS[condition]}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
        {errors.condition && (
          <p id="condition-error" className="text-sm text-destructive">
            {errors.condition.message}
          </p>
        )}
      </div>

      {/* Location */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Department */}
        <div className="space-y-2">
          <Label htmlFor="location_department">
            Departamento <span className="text-destructive">*</span>
          </Label>
          <Select
            value={watch('location_department')}
            onValueChange={(value) =>
              setValue('location_department', value as ProductInput['location_department'])
            }
          >
            <SelectTrigger
              id="location_department"
              aria-invalid={errors.location_department ? 'true' : 'false'}
              aria-describedby={errors.location_department ? 'department-error' : undefined}
            >
              <SelectValue placeholder="Selecciona un departamento" />
            </SelectTrigger>
            <SelectContent>
              {BOLIVIA_DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.location_department && (
            <p id="department-error" className="text-sm text-destructive">
              {errors.location_department.message}
            </p>
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="location_city">
            Ciudad <span className="text-destructive">*</span>
          </Label>
          <Input
            id="location_city"
            {...register('location_city')}
            placeholder="Ej: La Paz"
            aria-invalid={errors.location_city ? 'true' : 'false'}
            aria-describedby={errors.location_city ? 'city-error' : undefined}
          />
          {errors.location_city && (
            <p id="city-error" className="text-sm text-destructive">
              {errors.location_city.message}
            </p>
          )}
        </div>
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label>
          Imágenes del Producto <span className="text-destructive">*</span>
        </Label>
        <ImageUpload
          userId={userId}
          value={images || []}
          onChange={(urls) => setValue('images', urls)}
          maxImages={5}
          disabled={isSubmitting}
          error={errors.images?.message}
        />
        {errors.images && <p className="text-sm text-destructive">{errors.images.message}</p>}
      </div>

      {/* Submit Button */}
      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Guardando...
            </>
          ) : mode === 'create' ? (
            'Publicar Producto'
          ) : (
            'Guardar Cambios'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
