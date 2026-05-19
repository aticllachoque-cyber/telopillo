'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { removeStorageImageByPublicUrl, resolveDemandImageUrl } from '@/lib/utils/image'
import { demandPostSchema, type DemandPostInput } from '@/lib/validations/demand'
import { getSubcategories } from '@/lib/data/categories'
import { CATEGORY_LABELS } from '@/lib/validations/product'
import { LocationSelector } from '@/components/profile/LocationSelector'
import { DemandImageUpload } from '@/components/demand/DemandImageUpload'
import { DemandImageFrame } from '@/components/demand/DemandImageFrame'
import { CategoryGrid } from '@/components/products/CategoryGrid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSnackbar } from '@/components/ui/snackbar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSupabaseErrorMessage } from '@/lib/utils'
import { productPresentation } from '@/lib/constants/productPresentation'
import { isPlaceholderDescription } from '@/lib/utils/demand'
import { getDemandPath } from '@/lib/utils/publicRoutes'
import { clearDraft, loadDraft, saveDraft } from '@/lib/offline/drafts'

interface DemandPostFormProps {
  userId: string
  demandPostId?: string
  mode?: 'create' | 'edit'
  defaultValues?: Partial<DemandPostInput>
}

const STEPS = [
  { id: 1, title: 'Referencia', description: 'Categoría e imagen', icon: Search },
  { id: 2, title: 'Descripción', description: 'Qué necesitás', icon: FileText },
  { id: 3, title: 'Detalles', description: 'Ubicación y presupuesto', icon: MapPin },
  { id: 4, title: 'Revisar', description: 'Confirmar solicitud', icon: Eye },
] as const

const STEP_FIELDS: Record<number, (keyof DemandPostInput)[]> = {
  1: ['title', 'category', 'image_url'],
  2: ['description', 'subcategory'],
  3: ['location_department', 'location_city', 'price_min', 'price_max'],
  4: [],
}

const DEMAND_FORM_DRAFT_VERSION = 1

interface DemandPostFormDraftData {
  currentStep: number
  values: Partial<DemandPostInput>
}

function formatPriceRange(
  min: number | null | undefined,
  max: number | null | undefined
): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null)
    return `Bs ${min.toLocaleString('es-BO')} - Bs ${max.toLocaleString('es-BO')}`
  if (min != null) return `Desde Bs ${min.toLocaleString('es-BO')}`
  return `Hasta Bs ${max!.toLocaleString('es-BO')}`
}

export function DemandPostForm({
  userId,
  demandPostId,
  mode = 'create',
  defaultValues,
}: DemandPostFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showSnackbar } = useSnackbar()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saved' | 'restored' | 'error'>('idle')
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(null)
  const [pendingDraft, setPendingDraft] = useState<DemandPostFormDraftData | null>(null)
  const formDefaultValues: Partial<DemandPostInput> = defaultValues || {
    title: '',
    description: '',
    category: undefined,
    subcategory: undefined,
    location_department: undefined,
    location_city: '',
    price_min: undefined,
    price_max: undefined,
    image_url: null,
  }
  const draftKey =
    mode === 'create' ? `draft:demand:create:${userId}` : `draft:demand:edit:${demandPostId}`
  const hydrateCompleteRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedSnapshotRef = useRef<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<DemandPostInput>({
    resolver: zodResolver(demandPostSchema),
    mode: 'onTouched',
    defaultValues: formDefaultValues,
  })

  const selectedCategory = watch('category')
  const selectedDepartment = watch('location_department')
  const selectedCity = watch('location_city')
  const originalImageUrl = defaultValues?.image_url ?? null
  const watchAll = watch()
  const previewImageUrl = resolveDemandImageUrl(watchAll.image_url)
  const categoryLabel = selectedCategory
    ? CATEGORY_LABELS[selectedCategory as keyof typeof CATEGORY_LABELS] || selectedCategory
    : null
  const priceRange = formatPriceRange(watchAll.price_min, watchAll.price_max)
  const draftBaselineSnapshot = JSON.stringify({
    currentStep: 1,
    values: formDefaultValues,
  })

  useEffect(() => {
    if (selectedCategory) {
      const nextSubcategories = getSubcategories(selectedCategory)
      setSubcategories(nextSubcategories)
      const currentSubcategory = watch('subcategory')
      if (currentSubcategory && !nextSubcategories.includes(currentSubcategory)) {
        setValue('subcategory', undefined)
      }
    } else {
      setSubcategories([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory])

  useEffect(() => {
    const draft = loadDraft<DemandPostFormDraftData>(draftKey, DEMAND_FORM_DRAFT_VERSION)
    const snapshot = draft ? JSON.stringify(draft.data) : null

    if (!draft || !snapshot || snapshot === draftBaselineSnapshot) {
      if (snapshot === draftBaselineSnapshot) {
        clearDraft(draftKey)
      }
      hydrateCompleteRef.current = true
      lastSavedSnapshotRef.current = draftBaselineSnapshot
      return
    }

    setPendingDraft(draft.data)
    setDraftUpdatedAt(draft.updatedAt)
    lastSavedSnapshotRef.current = snapshot
    hydrateCompleteRef.current = true
  }, [draftBaselineSnapshot, draftKey])

  useEffect(() => {
    if (!hydrateCompleteRef.current || pendingDraft) return

    const snapshot = JSON.stringify({
      currentStep,
      values: watchAll,
    })

    if (snapshot === draftBaselineSnapshot) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      clearDraft(draftKey)
      lastSavedSnapshotRef.current = draftBaselineSnapshot
      setDraftStatus('idle')
      setDraftUpdatedAt(null)
      return
    }

    if (snapshot === lastSavedSnapshotRef.current) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const saved = saveDraft<DemandPostFormDraftData>(
        draftKey,
        {
          currentStep,
          values: watchAll,
        },
        DEMAND_FORM_DRAFT_VERSION
      )

      if (saved) {
        lastSavedSnapshotRef.current = snapshot
        setDraftUpdatedAt(new Date().toISOString())
        setDraftStatus('saved')
      } else {
        setDraftStatus('error')
      }
    }, 800)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [currentStep, draftBaselineSnapshot, draftKey, pendingDraft, watchAll])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const focusFirstInvalidField = () => {
    requestAnimationFrame(() => {
      const firstError = document.querySelector<HTMLElement>('[aria-invalid="true"]')
      if (firstError) {
        if (firstError.getAttribute('role') === 'radiogroup') {
          const firstRadio =
            firstError.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]') ??
            firstError.querySelector<HTMLElement>('[role="radio"]')

          if (firstRadio) {
            firstRadio.focus()
            firstRadio.scrollIntoView({ block: 'center', behavior: 'smooth' })
            return
          }
        }

        firstError.focus()
        firstError.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    })
  }

  const handleNext = async () => {
    const fieldsToValidate = STEP_FIELDS[currentStep] ?? []
    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate)
      if (!isValid) {
        focusFirstInvalidField()
        return
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToStep = async (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    for (let s = currentStep; s < step; s++) {
      const fields = STEP_FIELDS[s] ?? []
      if (fields.length === 0) continue

      const isValid = await trigger(fields)
      if (!isValid) {
        setCurrentStep(s)
        focusFirstInvalidField()
        return
      }
    }

    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmitError = (fieldErrors: FieldErrors<DemandPostInput>) => {
    const errorFields = Object.keys(fieldErrors) as (keyof DemandPostInput)[]
    for (let s = 1; s <= 3; s++) {
      const fields = STEP_FIELDS[s] ?? []
      if (fields.some((field) => errorFields.includes(field))) {
        setCurrentStep(s)
        requestAnimationFrame(focusFirstInvalidField)
        break
      }
    }
    setSubmitError('Por favor corregí los errores marcados antes de publicar.')
  }

  const onSubmit = async (data: DemandPostInput) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory || null,
        location_department: data.location_department,
        location_city: data.location_city,
        price_min: data.price_min ?? null,
        price_max: data.price_max ?? null,
        image_url: data.image_url ?? null,
      }

      const query =
        mode === 'create'
          ? supabase.from('demand_posts').insert({
              user_id: userId,
              ...payload,
            })
          : supabase
              .from('demand_posts')
              .update(payload)
              .eq('id', demandPostId!)
              .eq('user_id', userId)

      const { data: post, error } = await query.select('id, title').single()

      if (error) throw error

      if (mode === 'edit' && originalImageUrl && originalImageUrl !== payload.image_url) {
        try {
          await removeStorageImageByPublicUrl(supabase.storage, 'demand-images', originalImageUrl)
        } catch (cleanupError) {
          console.error('Error deleting replaced demand image:', cleanupError)
        }
      }

      clearDraft(draftKey)
      router.push(getDemandPath(post.id, post.title))
    } catch (error) {
      console.error('Error creating demand post:', error)
      setSubmitError(
        getSupabaseErrorMessage(
          error,
          mode === 'create'
            ? 'No se pudo publicar tu solicitud. Intentá de nuevo.'
            : 'No se pudieron guardar los cambios. Intentá de nuevo.'
        )
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRestoreDraft = () => {
    if (!pendingDraft) return

    reset({
      ...formDefaultValues,
      ...pendingDraft.values,
      image_url: pendingDraft.values.image_url ?? formDefaultValues.image_url ?? null,
    })
    setCurrentStep(Math.min(Math.max(pendingDraft.currentStep || 1, 1), STEPS.length))
    setDraftStatus('restored')
    showSnackbar('Borrador recuperado.', { variant: 'success' })
    setPendingDraft(null)
  }

  const handleDiscardDraft = () => {
    clearDraft(draftKey)
    setPendingDraft(null)
    setDraftStatus('idle')
    setDraftUpdatedAt(null)
    lastSavedSnapshotRef.current = draftBaselineSnapshot
    showSnackbar('Borrador descartado.', { variant: 'success' })
  }

  return (
    <div className="space-y-8">
      {pendingDraft && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-medium text-foreground">Encontramos un borrador guardado</p>
              <p className="text-sm text-muted-foreground">
                {draftUpdatedAt
                  ? `Guardado por última vez el ${new Date(draftUpdatedAt).toLocaleString('es-BO')}.`
                  : 'Podés restaurarlo o descartarlo.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={handleDiscardDraft}>
                Descartar
              </Button>
              <Button type="button" onClick={handleRestoreDraft}>
                Restaurar borrador
              </Button>
            </div>
          </div>
        </div>
      )}

      {!pendingDraft && draftStatus !== 'idle' && (
        <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {draftStatus === 'saved' && 'Borrador guardado localmente.'}
          {draftStatus === 'restored' && 'Estás trabajando sobre un borrador recuperado.'}
          {draftStatus === 'error' &&
            'No pudimos guardar el borrador localmente en este dispositivo.'}
        </div>
      )}

      <nav aria-label="Progreso del formulario">
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
                  aria-label={`Paso ${step.id}: ${step.title}`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
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

                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-4 h-0.5 flex-1 transition-colors ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>

        <div className="sm:hidden">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Paso {currentStep} de {STEPS.length}
            </span>
            <span className="text-sm text-muted-foreground">{STEPS[currentStep - 1]?.title}</span>
          </div>
          <div
            className="h-2 w-full rounded-full bg-muted"
            role="progressbar"
            aria-label="Progreso del formulario"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
          >
            <div
              className="h-2 rounded-full bg-primary transition-all duration-500 motion-reduce:transition-none"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </nav>

      {submitError && (
        <div
          role="alert"
          tabIndex={-1}
          className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">
                {mode === 'create' ? 'No se pudo publicar' : 'No se pudo actualizar'}
              </p>
              <p className="mt-1 text-sm">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} noValidate>
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300 motion-reduce:animate-none">
            <div className="mb-2">
              <h2 className="text-xl font-semibold text-balance">Referencia de la Solicitud</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Explica rápido qué estás buscando y agrega una imagen opcional para orientar mejor a
                los vendedores.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                ¿Qué estás buscando? <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Ej: iPhone 13 128GB en buen estado"
                className="min-h-[44px]"
                maxLength={100}
                aria-invalid={errors.title ? 'true' : 'false'}
                aria-describedby={errors.title ? 'title-error' : 'title-help'}
                {...register('title')}
              />
              <div className="flex items-center justify-between gap-3">
                <p id="title-help" className="text-xs text-muted-foreground">
                  <span className="sm:hidden">Sé claro y específico</span>
                  <span className="hidden sm:inline">
                    Incluí marca, modelo o referencia para que te encuentren más rápido.
                  </span>
                </p>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {watchAll.title?.length || 0}/100
                </p>
              </div>
              {errors.title && (
                <p id="title-error" className="text-sm text-destructive" role="alert">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Categoría <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground sm:hidden">
                Elegí la categoría principal de lo que buscás.
              </p>
              <CategoryGrid
                value={selectedCategory}
                onChange={(val) => {
                  setValue('category', val as DemandPostInput['category'], {
                    shouldValidate: true,
                  })
                  setValue('subcategory', undefined)
                }}
                error={!!errors.category}
                ariaLabel="Categoría de la solicitud"
              />
              {!errors.category && (
                <p id="category-help" className="text-xs text-muted-foreground">
                  Si no ves una categoría perfecta, elige la más cercana y acláralo en la
                  descripción.
                </p>
              )}
              {errors.category && (
                <p id="category-error" className="text-sm text-destructive" role="alert">
                  {errors.category.message}
                </p>
              )}
            </div>

            <DemandImageUpload
              userId={userId}
              value={watchAll.image_url ?? null}
              onChange={(url) => setValue('image_url', url, { shouldValidate: true })}
              disabled={isSubmitting}
              error={errors.image_url?.message}
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300 motion-reduce:animate-none">
            <div className="mb-2">
              <h2 className="text-xl font-semibold text-balance">Describe lo que Necesitas</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Dale suficiente contexto a los vendedores para que puedan ofrecerte algo útil.
              </p>
            </div>

            {subcategories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategoría</Label>
                <Select
                  value={watchAll.subcategory || ''}
                  onValueChange={(val) =>
                    setValue('subcategory', val || undefined, { shouldValidate: true })
                  }
                >
                  <SelectTrigger id="subcategory" className="min-h-[44px]">
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

            <div className="space-y-2">
              <Label htmlFor="description">
                Describe lo que necesitas <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Ej: Busco iPhone nuevo o usado, en buen estado, preferiblemente con batería sana y sin la pantalla rota."
                className="min-h-[140px] resize-y"
                maxLength={1000}
                aria-invalid={errors.description ? 'true' : 'false'}
                aria-describedby={errors.description ? 'description-error' : 'description-help'}
                {...register('description')}
              />
              <div className="flex items-center justify-between gap-3">
                <p id="description-help" className="text-xs text-muted-foreground">
                  Menciona estado, marca, modelo, urgencia o cualquier detalle importante.
                </p>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {watchAll.description?.length || 0}/1000
                </p>
              </div>
              {errors.description && (
                <p id="description-error" className="text-sm text-destructive" role="alert">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300 motion-reduce:animate-none">
            <div className="mb-2">
              <h2 className="text-xl font-semibold text-balance">Ubicación y Presupuesto</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Indica dónde estás y, si quieres, el rango que estás dispuesto a pagar.
              </p>
            </div>

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

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Presupuesto</legend>
              <p className="text-xs text-muted-foreground">
                Puedes dejarlo vacío si prefieres recibir propuestas primero.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price_min">Desde Bs.</Label>
                  <Input
                    id="price_min"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    className="min-h-[44px]"
                    aria-invalid={errors.price_min ? 'true' : 'false'}
                    aria-describedby={errors.price_min ? 'price-min-error' : undefined}
                    value={watchAll.price_min ?? ''}
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
                    className="min-h-[44px]"
                    aria-invalid={errors.price_max ? 'true' : 'false'}
                    aria-describedby={errors.price_max ? 'price-max-error' : undefined}
                    value={watchAll.price_max ?? ''}
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
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300 motion-reduce:animate-none">
            <div className="mb-2">
              <h2 className="text-xl font-semibold text-balance">Revisa tu Solicitud</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Asegúrate de que la información sea clara antes de publicarla.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <DemandImageFrame
                  imageUrl={previewImageUrl}
                  category={watchAll.category || 'electronics'}
                  title={watchAll.title || 'Vista previa de tu solicitud'}
                  aspectClassName="aspect-[16/9] sm:aspect-[2/1]"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />

                <div className="rounded-lg border border-border/70 bg-card shadow-sm">
                  <div className="space-y-4 p-4 sm:p-6">
                    <div>
                      <h3 className={productPresentation.detailTitle}>
                        {watchAll.title || 'Sin título todavía'}
                      </h3>
                      {categoryLabel && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {categoryLabel}
                          {watchAll.subcategory ? ` · ${watchAll.subcategory}` : ''}
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h4 className={cn(productPresentation.sectionHeading, 'mb-2')}>
                        Descripción
                      </h4>
                      {isPlaceholderDescription(watchAll.description || '') ? (
                        <p className="italic text-muted-foreground">
                          Agrega más detalles para que los vendedores entiendan mejor tu búsqueda.
                        </p>
                      ) : (
                        <p className={productPresentation.sectionBody}>
                          {watchAll.description || 'Sin descripción todavía'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-border/70 bg-card p-4 shadow-sm sm:p-5">
                  <h4 className="font-semibold">Resumen</h4>
                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ubicación</p>
                      <p className="font-medium">
                        {watchAll.location_city && watchAll.location_department
                          ? `${watchAll.location_city}, ${watchAll.location_department}`
                          : 'Completa tu ubicación'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Presupuesto</p>
                      <p className="font-medium">{priceRange || 'Sin presupuesto especificado'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Imagen</p>
                      <p className="font-medium">
                        {previewImageUrl ? 'Incluida' : 'Se mostrará una imagen por categoría'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                  <p className="font-medium">Antes de publicar:</p>
                  <ul className="mt-2 space-y-1 text-foreground/80">
                    <li>Describe bien qué buscas para recibir mejores ofertas.</li>
                    <li>Incluye una imagen si ayuda a identificar el producto.</li>
                    <li>Revisa ubicación y presupuesto antes de confirmar.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className={cn('min-h-[44px]', currentStep === 1 && 'invisible')}
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Atrás
          </Button>

          {currentStep < STEPS.length ? (
            <Button type="button" className="min-h-[44px]" onClick={handleNext}>
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Button
              type="button"
              className="min-h-[44px]"
              onClick={handleSubmit(onSubmit, handleSubmitError)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {mode === 'create' ? 'Publicando...' : 'Guardando...'}
                </>
              ) : mode === 'create' ? (
                'Publicar solicitud'
              ) : (
                'Guardar cambios'
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
