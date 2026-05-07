/**
 * Image utilities shared by product and demand uploads.
 * Handles validation, compression, storage upload, and preview lifecycle.
 */

import imageCompression from 'browser-image-compression'

/**
 * Validation result for image files
 */
export interface ImageValidationResult {
  valid: boolean
  error?: string
}

interface StorageUploadResult {
  data: { path: string } | null
  error: { message?: string } | null
}

interface StorageRemoveResult {
  error: { message?: string } | null
}

interface StorageBucketLike {
  upload: (
    path: string,
    fileBody: Blob,
    options: { contentType: string; upsert: boolean }
  ) => Promise<StorageUploadResult>
  getPublicUrl: (path: string) => { data: { publicUrl: string } }
  remove: (paths: string[]) => Promise<StorageRemoveResult>
}

interface StorageLike {
  from: (bucket: string) => StorageBucketLike
}

interface UploadStorageImageOptions {
  storage: StorageLike
  bucket: string
  path: string
  file: File
  compressionTimeoutMs?: number
  uploadTimeoutMs?: number
  upsert?: boolean
}

const DEFAULT_COMPRESS_TIMEOUT_MS = 30_000
const DEFAULT_UPLOAD_TIMEOUT_MS = 60_000

/**
 * Compression options for product images.
 * Balanced for speed: 1600px and 0.82 quality keep uploads fast while looking good.
 */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1600, // Slightly lower than 1920 for faster encode; still good for product photos
  useWebWorker: true,
  fileType: 'image/webp',
  initialQuality: 0.82,
}

/**
 * Validate image file type, size, and dimensions
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo' }
  }

  // Reject HEIC (common from iOS camera); most browsers can't compress it and it can hang
  const lowerType = file.type.toLowerCase()
  const lowerName = (file.name || '').toLowerCase()
  if (
    lowerType === 'image/heic' ||
    lowerType === 'image/heic-sequence' ||
    lowerName.endsWith('.heic')
  ) {
    return {
      valid: false,
      error:
        'Formato HEIC no soportado. Usá JPG o PNG (en Ajustes de cámara podés cambiar el formato).',
    }
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato inválido. Solo se permiten JPG, PNG o WebP',
    }
  }

  // Check file size (max 5MB before compression)
  const maxSizeBytes = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: 'La imagen debe ser menor a 5MB',
    }
  }

  return { valid: true }
}

/**
 * Compress image file to WebP format
 * Reduces file size while maintaining quality
 */
export async function compressImage(file: File): Promise<Blob> {
  const start = Date.now()
  console.log('[compressImage] start', {
    name: file.name,
    type: file.type,
    sizeKB: Math.round(file.size / 1024),
  })
  try {
    const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS)
    const ms = Date.now() - start
    console.log('[compressImage] done', {
      ms,
      outputSizeKB: Math.round(compressedFile.size / 1024),
    })
    return compressedFile
  } catch (error) {
    console.error('[compressImage] error', { ms: Date.now() - start, error })
    // Fallback: return original file if compression fails
    return file
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

/**
 * Generate unique filename for an uploaded image
 * Format: {timestamp}-{index}.webp
 */
export function generateImageFilename(index: number): string {
  const timestamp = Date.now()
  return `${timestamp}-${index}.webp`
}

/**
 * Get storage path for an image in the user's folder
 */
export function getUserImagePath(userId: string, index: number): string {
  const filename = generateImageFilename(index)
  return `${userId}/${filename}`
}

/**
 * Backwards-compatible helper for product image paths.
 */
export function getProductImagePath(userId: string, index: number): string {
  return getUserImagePath(userId, index)
}

/**
 * Single-image demand path helper.
 */
export function getDemandImagePath(userId: string): string {
  return getUserImagePath(userId, 0)
}

/**
 * Uploads an image after compression and returns both storage path and public URL.
 */
export async function uploadStorageImage({
  storage,
  bucket,
  path,
  file,
  compressionTimeoutMs = DEFAULT_COMPRESS_TIMEOUT_MS,
  uploadTimeoutMs = DEFAULT_UPLOAD_TIMEOUT_MS,
  upsert = false,
}: UploadStorageImageOptions): Promise<{ path: string; publicUrl: string }> {
  const compressedBlob = await withTimeout(
    compressImage(file),
    compressionTimeoutMs,
    'La compresión tardó demasiado. Probá con otra foto o formato JPG/PNG.'
  )

  const { data, error } = await withTimeout(
    storage.from(bucket).upload(path, compressedBlob, {
      contentType: 'image/webp',
      upsert,
    }),
    uploadTimeoutMs,
    'La subida tardó demasiado. Revisá tu conexión e intentá de nuevo.'
  )

  if (error || !data?.path) {
    throw new Error(error?.message || 'Error al subir imagen')
  }

  const {
    data: { publicUrl },
  } = storage.from(bucket).getPublicUrl(data.path)

  return {
    path: data.path,
    publicUrl,
  }
}

export function getStoragePathFromPublicUrl(bucket: string, publicUrl: string): string | null {
  const bucketMarker = `/${bucket}/`
  const parts = publicUrl.split(bucketMarker)
  if (parts.length < 2) return null
  return parts[1]?.split('?')[0] || null
}

export async function removeStorageImageByPublicUrl(
  storage: StorageLike,
  bucket: string,
  publicUrl: string
): Promise<void> {
  const path = getStoragePathFromPublicUrl(bucket, publicUrl)
  if (!path) return

  const { error } = await storage.from(bucket).remove([path])
  if (error) {
    throw new Error(error.message || 'No se pudo eliminar la imagen')
  }
}

/**
 * Validate multiple image files
 * Returns validation results for each file
 */
export function validateImageFiles(files: File[]): { valid: boolean; errors: string[] } {
  if (files.length === 0) {
    return { valid: false, errors: ['Debes subir al menos 1 imagen'] }
  }

  if (files.length > 5) {
    return { valid: false, errors: ['Máximo 5 imágenes permitidas'] }
  }

  const errors: string[] = []

  files.forEach((file, index) => {
    const result = validateImageFile(file)
    if (!result.valid && result.error) {
      errors.push(`Imagen ${index + 1}: ${result.error}`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Create object URL for image preview
 * Remember to revoke when component unmounts
 */
export function createImagePreview(file: File | Blob): string {
  return URL.createObjectURL(file)
}

/**
 * Revoke object URL to free memory
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url)
}
