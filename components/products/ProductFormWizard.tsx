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
import { CATEGORIES, getSubcategories, CATEGORY_ICONS } from '@/lib/data/categories'
import { ImageUpload } from '@/components/products/ImageUpload'
import { CategoryGrid } from '@/components/products/CategoryGrid'
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
import { useToast } from '@/components/ui/toast'
import {
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  FileText,
  Tag,
  Camera,
  Eye,
  MapPin,
  Package,
} from 'lucide-react'

interface ProductFormWizardProps {
  userId: string
  defaultValues?: Partial<ProductInput>
  productId?: string
  mode?: 'create' | 'edit'
}

const STEPS = [
  { id: 1, title: 'Fotos', description: 'Imágenes del producto', icon: Camera },
  { id: 2, title: 'Información', description: 'Título y descripción', icon: FileText },
  { id: 3, title: 'Detalles', description: 'Precio, estado y ubicación', icon: Tag },
  { id: 4, title: 'Revisar', description: 'Confirmar y publicar', icon: Eye },
] as const

// Fields validated per step
const STEP_FIELDS: Record<number, (keyof ProductInput)[]> = {
  1: ['images'],
  2: ['title', 'description', 'category'],
  3: ['price', 'condition', 'location_department', 'location_city'],
  4: [],
}

export function ProductFormWizard({
  userId,
  defaultValues,
  productId,
  mode = 'create',
}: ProductFormWizardProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subcategories, setSubcategories] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues || {
      images: [],
    },
    mode: 'onTouched',
  })

  // Watch all values for the review step
  const watchAll = watch()
  const selectedCategory = watch('category')
  const images = watch('images')
  const title = watch('title')
  const description = watch('description')

  // Update subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const subs = getSubcategories(selectedCategory)
      setSubcategories(subs)
      const currentSubcategory = watch('subcategory')
      if (currentSubcategory && !subs.includes(currentSubcategory)) {
        setValue('subcategory', undefined)
      }
    } else {
      setSubcategories([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory])

  // Focus the first invalid field after failed validation
  const focusFirstInvalidField = () => {
    requestAnimationFrame(() => {
      const firstError = document.querySelector<HTMLElement>('[aria-invalid="true"]')
      if (firstError) {
        firstError.focus()
        firstError.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    })
  }

  // Scroll input into view when keyboard opens on mobile
  const scrollInputIntoView = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if ('visualViewport' in window) {
      requestAnimationFrame(() => {
        e.target.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
    }
  }

  // Validate current step and go to next
  const handleNext = async () => {
    const fieldsToValidate = STEP_FIELDS[currentStep] ?? []
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate)
      if (!isValid) {
        focusFirstInvalidField()
        return
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToStep = async (step: number) => {
    // Only allow going to previous steps or current+1 if current is valid
    if (step < currentStep) {
      setCurrentStep(step)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    // Validate all steps before the target
    for (let s = currentStep; s < step; s++) {
      const fields = STEP_FIELDS[s] ?? []
      if (fields.length > 0) {
        const isValid = await trigger(fields)
        if (!isValid) {
          setCurrentStep(s)
          focusFirstInvalidField()
          return
        }
      }
    }
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSubmit = async (data: ProductInput) => {
    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === 'create') {
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

        showToast('¡Producto publicado exitosamente!', 'success')
        router.push(`/productos/${product.id}`)
      } else if (mode === 'edit' && productId) {
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
          .eq('user_id', userId)

        if (updateError) throw updateError

        showToast('¡Producto actualizado exitosamente!', 'success')
        router.push(`/productos/${productId}`)
      }
    } catch (err) {
      console.error('Error saving product:', err)
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar el producto'
      setError(errorMsg)
      showToast('Error al guardar el producto', 'error')
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[role="alert"]')?.focus()
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper: get category label
  const getCategoryLabel = (id: string) => {
    const cat = CATEGORIES.find((c) => c.id === id)
    return cat?.name || id
  }

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <nav aria-label="Progreso del formulario">
        {/* Desktop stepper */}
        <ol className="hidden sm:flex items-center w-full">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon
            const isCompleted = currentStep > step.id
            const isCurrent = currentStep === step.id

            return (
              <li
                key={step.id}
                className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => goToStep(step.id)}
                  className={`flex items-center gap-3 group ${
                    isCompleted || isCurrent ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Paso ${step.id}: ${step.title} - ${step.description}${isCompleted ? ' (completado)' : isCurrent ? ' (actual)' : ''}`}
                >
                  <span
                    className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors ${
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isCurrent
                          ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" aria-hidden />
                    ) : (
                      <StepIcon className="h-5 w-5" aria-hidden />
                    )}
                  </span>
                  <span className="hidden lg:block">
                    <span
                      className={`block text-sm font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {step.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">{step.description}</span>
                  </span>
                </button>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 transition-colors ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>

        {/* Mobile stepper */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">
              Paso {currentStep} de {STEPS.length}
            </span>
            <span className="text-sm text-muted-foreground">{STEPS[currentStep - 1]?.title}</span>
          </div>
          {/* Progress bar */}
          <div
            className="w-full bg-muted rounded-full h-2"
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={4}
            aria-valuetext={`Paso ${currentStep} de ${STEPS.length}: ${STEPS[currentStep - 1]?.title}`}
          >
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500 motion-reduce:transition-none"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-2">
            {STEPS.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(step.id)}
                className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center text-xs font-medium transition-colors touch-manipulation ${
                  currentStep > step.id
                    ? 'bg-primary text-primary-foreground'
                    : currentStep === step.id
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                      : 'bg-muted text-muted-foreground'
                }`}
                aria-label={`Ir al paso ${step.id}: ${step.title}`}
              >
                {currentStep > step.id ? <Check className="h-3.5 w-3.5" aria-hidden /> : step.id}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          tabIndex={-1}
          className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4 flex items-start gap-3 outline-none focus-visible:ring-2 focus-visible:ring-destructive"
        >
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Error al guardar</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        {/* Step 1: Images */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300 motion-reduce:animate-none">
            <div className="mb-2">
              <h2 className="text-xl font-semibold text-balance">Fotos del Producto</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Subí fotos claras y bien iluminadas. La primera imagen será la portada.
              </p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium">Tips para buenas fotos:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Usá buena iluminación natural</li>
                <li>Mostrá el producto desde varios ángulos</li>
                <li>Incluí fotos de detalles o imperfecciones</li>
                <li>La primera imagen será la portada del anuncio</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label id="images-label">
                Imágenes del Producto{' '}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(requerido)</span>
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
          </div>
        )}

        {/* Step 2: Basic Information */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300 motion-reduce:animate-none">
            <div className="mb-2">
              <h2 className="text-xl font-semibold text-balance">Información Básica</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Describí tu producto para que los compradores lo encuentren fácilmente
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Título del Producto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Ej: iPhone 13 Pro Max 256GB"
                className="min-h-[44px] sm:min-h-0"
                aria-required="true"
                aria-invalid={errors.title ? 'true' : 'false'}
                aria-describedby={errors.title ? 'title-error' : 'title-help'}
                onFocus={scrollInputIntoView}
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
                placeholder="Describe tu producto en detalle: estado, características, qué incluye..."
                rows={5}
                className="min-h-[100px] sm:min-h-[120px]"
                aria-required="true"
                aria-invalid={errors.description ? 'true' : 'false'}
                aria-describedby={errors.description ? 'description-error' : 'description-help'}
                onFocus={scrollInputIntoView}
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

            {/* Category */}
            <div className="space-y-2">
              <Label>
                Categoría <span className="text-destructive">*</span>
              </Label>
              <CategoryGrid
                value={selectedCategory}
                onChange={(value) => setValue('category', value as ProductInput['category'])}
                error={!!errors.category}
              />
              {errors.category && (
                <p id="category-error" className="text-sm text-destructive" role="alert">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Subcategory */}
            {selectedCategory && subcategories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategoría (Opcional)</Label>
                <Select
                  value={watch('subcategory') || ''}
                  onValueChange={(value) => setValue('subcategory', value || undefined)}
                >
                  <SelectTrigger id="subcategory" className="w-full">
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
            )}
          </div>
        )}

        {/* Step 3: Details */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300 motion-reduce:animate-none">
            <div className="mb-2">
              <h2 className="text-xl font-semibold text-balance">Detalles del Producto</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Indicá el precio, estado y ubicación
              </p>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">
                Precio (BOB) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  Bs
                </span>
                <Input
                  id="price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="1"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="5000"
                  className="pl-10 min-h-[44px] sm:min-h-0"
                  aria-required="true"
                  aria-invalid={errors.price ? 'true' : 'false'}
                  aria-describedby={errors.price ? 'price-error' : 'price-help'}
                  onFocus={scrollInputIntoView}
                />
              </div>
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
                value={watch('condition') ?? ''}
                onValueChange={(value) => setValue('condition', value as ProductInput['condition'])}
                aria-required="true"
                aria-invalid={errors.condition ? 'true' : 'false'}
                aria-describedby={errors.condition ? 'condition-error' : undefined}
                className="grid gap-3"
              >
                {PRODUCT_CONDITIONS.map((condition) => (
                  <label
                    key={condition}
                    htmlFor={`condition-${condition}`}
                    className={`flex items-start space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                      watch('condition') === condition
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <RadioGroupItem
                      value={condition}
                      id={`condition-${condition}`}
                      className="mt-0.5 size-5 sm:size-4 shrink-0"
                    />
                    <div className="space-y-1 leading-none">
                      <span className="font-medium">{CONDITION_LABELS[condition]}</span>
                      <p className="text-sm text-muted-foreground">
                        {CONDITION_DESCRIPTIONS[condition]}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
              {errors.condition && (
                <p id="condition-error" className="text-sm text-destructive">
                  {errors.condition.message}
                </p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" aria-hidden />
                Ubicación
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location_department">
                    Departamento <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watch('location_department') ?? ''}
                    onValueChange={(value) =>
                      setValue('location_department', value as ProductInput['location_department'])
                    }
                  >
                    <SelectTrigger
                      id="location_department"
                      className="w-full"
                      aria-required="true"
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

                <div className="space-y-2">
                  <Label htmlFor="location_city">
                    Ciudad <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location_city"
                    {...register('location_city')}
                    placeholder="Ej: La Paz"
                    className="min-h-[44px] sm:min-h-0"
                    autoComplete="address-level2"
                    aria-required="true"
                    aria-invalid={errors.location_city ? 'true' : 'false'}
                    aria-describedby={errors.location_city ? 'city-error' : undefined}
                    onFocus={scrollInputIntoView}
                  />
                  {errors.location_city && (
                    <p id="city-error" className="text-sm text-destructive">
                      {errors.location_city.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300 motion-reduce:animate-none">
            <div className="mb-2">
              <h2 className="text-xl font-semibold text-balance">Revisar y Publicar</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Verificá que toda la información sea correcta antes de publicar
              </p>
            </div>

            {/* Preview Card */}
            <div className="border rounded-lg overflow-hidden">
              {/* Image Preview */}
              <div className="relative aspect-video bg-muted">
                {watchAll.images && watchAll.images.length > 0 ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={watchAll.images[0]}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                    {watchAll.images.length > 1 && (
                      <span className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                        +{watchAll.images.length - 1} foto{watchAll.images.length > 2 ? 's' : ''}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <Camera className="h-8 w-8 mb-2" aria-hidden />
                    <span className="text-sm">Sin imagenes</span>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-4">
                {/* Title & Price */}
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold">{watchAll.title || 'Sin título'}</h3>
                  <span className="text-xl font-bold text-primary whitespace-nowrap">
                    Bs {watchAll.price ? watchAll.price.toLocaleString() : '0'}
                  </span>
                </div>

                {/* Category */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {(() => {
                    const CatIcon = watchAll.category ? CATEGORY_ICONS[watchAll.category] : null
                    return CatIcon ? (
                      <CatIcon className="h-4 w-4" aria-hidden />
                    ) : (
                      <Package className="h-4 w-4" aria-hidden />
                    )
                  })()}
                  <span>
                    {watchAll.category ? getCategoryLabel(watchAll.category) : 'Sin categoría'}
                    {watchAll.subcategory && ` › ${watchAll.subcategory}`}
                  </span>
                </div>

                {/* Condition */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" aria-hidden />
                  <span>
                    {watchAll.condition
                      ? CONDITION_LABELS[watchAll.condition as keyof typeof CONDITION_LABELS]
                      : 'Sin estado'}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" aria-hidden />
                  <span>
                    {watchAll.location_city && watchAll.location_department
                      ? `${watchAll.location_city}, ${watchAll.location_department}`
                      : 'Sin ubicación'}
                  </span>
                </div>

                {/* Description */}
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-medium mb-2">Descripción</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">
                    {watchAll.description || 'Sin descripción'}
                  </p>
                </div>

                {/* Images count */}
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-medium mb-2">Fotos</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {(watchAll.images || []).map((img, i) => (
                      <div key={i} className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Edit hints */}
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium">¿Algo no está bien?</p>
              <p className="text-muted-foreground">
                <span className="sm:hidden">
                  Tocá los números de arriba para volver a un paso anterior y corregir la
                  información.
                </span>
                <span className="hidden sm:inline">
                  Podés volver a cualquier paso haciendo click en los círculos de arriba para
                  corregir la información.
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 pt-6 border-t mt-8 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] -mx-1 px-1 sm:static sm:bg-transparent sm:backdrop-blur-none sm:py-0 sm:mx-0 sm:px-0 sm:pt-8 sm:pb-0">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? () => router.back() : handleBack}
            disabled={isSubmitting}
            className="gap-2 min-h-[44px] touch-manipulation sm:min-h-0"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {currentStep === 1 ? 'Cancelar' : 'Anterior'}
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="gap-2 min-h-[44px] touch-manipulation sm:min-h-0"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
              className="gap-2 min-w-[180px] min-h-[44px] touch-manipulation sm:min-h-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Publicando...
                </>
              ) : mode === 'create' ? (
                <>
                  <Check className="h-4 w-4" aria-hidden />
                  Publicar Producto
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" aria-hidden />
                  Guardar Cambios
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
