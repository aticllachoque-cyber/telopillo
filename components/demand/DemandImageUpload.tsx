'use client'

import { getDemandImagePath } from '@/lib/utils/image'
import { SingleImageUpload } from '@/components/shared/SingleImageUpload'

interface DemandImageUploadProps {
  userId: string
  value: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
  error?: string
}

export function DemandImageUpload({
  userId,
  value,
  onChange,
  disabled = false,
  error,
}: DemandImageUploadProps) {
  return (
    <SingleImageUpload
      userId={userId}
      bucket="demand-images"
      value={value}
      onChange={onChange}
      buildPath={getDemandImagePath}
      disabled={disabled}
      error={error}
      label="Imagen de referencia"
      helpText="Opcional. Si no subes una, mostraremos una imagen relacionada con la categoría."
      emptyStateLabel="Subir imagen de referencia"
    />
  )
}
