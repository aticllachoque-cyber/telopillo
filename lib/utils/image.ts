/**
 * Image utilities shared by product and demand uploads.
 * Handles validation, compression, storage upload, and preview lifecycle.
 */

import imageCompression from 'browser-image-compression'

type Heic2AnyConverter = (options: {
  blob: Blob
  toType: string
  quality?: number
}) => Promise<Blob | Blob[]>

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
const MAX_STANDARD_UPLOAD_BYTES = 5 * 1024 * 1024
const MAX_HEIC_UPLOAD_BYTES = 25 * 1024 * 1024

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

export function isHeicLikeImage(file: File): boolean {
  const lowerType = file.type.toLowerCase()
  const lowerName = (file.name || '').toLowerCase()

  return (
    lowerType === 'image/heic' ||
    lowerType === 'image/heic-sequence' ||
    lowerType === 'image/heif' ||
    lowerType === 'image/heif-sequence' ||
    lowerName.endsWith('.heic') ||
    lowerName.endsWith('.heif')
  )
}

/**
 * Validate image file type, size, and dimensions
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo' }
  }

  const isHeic = isHeicLikeImage(file)

  // Check file type
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heic-sequence',
    'image/heif',
    'image/heif-sequence',
  ]
  const hasRecognizedMimeType = validTypes.includes(file.type)
  const hasRecognizedExtension = isHeic || /\.(jpe?g|png|webp)$/i.test(file.name || '')

  if (!hasRecognizedMimeType && !hasRecognizedExtension) {
    return {
      valid: false,
      error: 'Formato inválido. Solo se permiten JPG, PNG, WebP o HEIC/HEIF',
    }
  }

  const maxSizeBytes = isHeic ? MAX_HEIC_UPLOAD_BYTES : MAX_STANDARD_UPLOAD_BYTES
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: isHeic ? 'La foto HEIC debe ser menor a 25MB' : 'La imagen debe ser menor a 5MB',
    }
  }

  return { valid: true }
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2AnyModule = (await import('heic2any')) as { default: Heic2AnyConverter }
  const converted = await heic2AnyModule.default({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.9,
  })
  const convertedBlob = Array.isArray(converted) ? converted[0] : converted

  if (!convertedBlob) {
    throw new Error('No se pudo convertir la foto HEIC. Intentá de nuevo con otra imagen.')
  }

  const filename = (file.name || 'image').replace(/\.(heic|heif)$/i, '.jpg')
  return new File([convertedBlob], filename, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

export async function normalizeImageFileForUpload(file: File): Promise<File> {
  if (!isHeicLikeImage(file)) return file

  try {
    return await convertHeicToJpeg(file)
  } catch (error) {
    console.error('[normalizeImageFileForUpload] HEIC conversion failed', error)
    throw new Error(
      'No pudimos procesar esta foto HEIC del iPhone. Intentá otra vez o elegí otra imagen.'
    )
  }
}

/**
 * Compress image file to WebP format
 * Reduces file size while maintaining quality
 */
export async function compressImage(file: File): Promise<Blob> {
  const normalizedFile = await normalizeImageFileForUpload(file)
  const start = Date.now()
  console.log('[compressImage] start', {
    name: normalizedFile.name,
    type: normalizedFile.type,
    sizeKB: Math.round(normalizedFile.size / 1024),
  })
  try {
    const compressedFile = await imageCompression(normalizedFile, COMPRESSION_OPTIONS)
    const ms = Date.now() - start
    console.log('[compressImage] done', {
      ms,
      outputSizeKB: Math.round(compressedFile.size / 1024),
    })
    return compressedFile
  } catch (error) {
    console.error('[compressImage] error', { ms: Date.now() - start, error })
    // Fallback: return normalized file if compression fails
    return normalizedFile
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

interface UploadStorageImageWithRetryOptions extends UploadStorageImageOptions {
  retries?: number
  retryDelayMs?: number
  retryExistingPath?: boolean
}

export async function uploadStorageImageWithRetry({
  retries = 1,
  retryDelayMs = 700,
  retryExistingPath = false,
  ...options
}: UploadStorageImageWithRetryOptions): Promise<{ path: string; publicUrl: string }> {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await uploadStorageImage({
        ...options,
        upsert: retryExistingPath || attempt > 0 ? true : options.upsert,
      })
    } catch (error) {
      lastError = error
      if (attempt === retries || !isRecoverableUploadError(error)) {
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)))
    }
  }

  throw lastError instanceof Error ? lastError : new Error('No se pudo subir la imagen')
}

export function isRecoverableUploadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const lower = error.message.toLowerCase()
  return (
    lower.includes('tardó demasiado') ||
    lower.includes('timeout') ||
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('failed') ||
    lower.includes('temporarily') ||
    lower.includes('503') ||
    lower.includes('502')
  )
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

function getSupabaseStoragePublicBase(): string | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!rawUrl) return null

  try {
    const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
    return `${new URL(url).origin}/storage/v1/object/public`
  } catch {
    return null
  }
}

/**
 * Normalizes a persisted image value into a displayable URL.
 * Supports full public URLs, local paths, and legacy Supabase storage object paths.
 */
export function resolveStorageImageUrl(
  bucket: string,
  value: string | null | undefined
): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed
  }

  const publicBase = getSupabaseStoragePublicBase()
  if (!publicBase) return null

  return `${publicBase}/${bucket}/${trimmed.replace(/^\/+/, '')}`
}

export function resolveStorageImageUrls(
  bucket: string,
  values: string[] | null | undefined
): string[] {
  if (!values || values.length === 0) return []

  return values
    .map((value) => resolveStorageImageUrl(bucket, value))
    .filter((value): value is string => Boolean(value))
}

export function shouldBypassNextImageOptimization(value: string | null | undefined): boolean {
  const trimmed = value?.trim()
  if (!trimmed) return false

  try {
    const parsed = new URL(trimmed)
    const isLocalSupabaseHost =
      (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') &&
      parsed.port === '54321'

    return isLocalSupabaseHost && parsed.pathname.includes('/storage/v1/object/public/')
  } catch {
    return false
  }
}

export function resolveAvatarUrl(value: string | null | undefined): string | null {
  return resolveStorageImageUrl('avatars', value)
}

export function resolveBusinessLogoUrl(value: string | null | undefined): string | null {
  return resolveStorageImageUrl('business-logos', value)
}

export function resolveProductImageUrl(value: string | null | undefined): string | null {
  return resolveStorageImageUrl('product-images', value)
}

export function resolveProductImageUrls(values: string[] | null | undefined): string[] {
  return resolveStorageImageUrls('product-images', values)
}

export function resolveDemandImageUrl(value: string | null | undefined): string | null {
  return resolveStorageImageUrl('demand-images', value)
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
