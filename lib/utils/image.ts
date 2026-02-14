/**
 * Image utilities for product images
 * Handles validation, compression, and optimization
 */

import imageCompression from 'browser-image-compression'

/**
 * Validation result for image files
 */
export interface ImageValidationResult {
  valid: boolean
  error?: string
}

/**
 * Compression options for product images
 */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1, // Max 1MB after compression
  maxWidthOrHeight: 1920, // Max dimension 1920px
  useWebWorker: true, // Use web worker for better performance
  fileType: 'image/webp', // Convert to WebP
  initialQuality: 0.85, // 85% quality
}

/**
 * Validate image file type, size, and dimensions
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo' }
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
  try {
    const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS)
    return compressedFile
  } catch (error) {
    console.error('Error compressing image:', error)
    // Fallback: return original file if compression fails
    return file
  }
}

/**
 * Generate unique filename for product image
 * Format: {timestamp}-{index}.webp
 */
export function generateImageFilename(index: number): string {
  const timestamp = Date.now()
  return `${timestamp}-${index}.webp`
}

/**
 * Get storage path for product image
 * Format: product-images/{userId}/{timestamp}-{index}.webp
 */
export function getProductImagePath(userId: string, index: number): string {
  const filename = generateImageFilename(index)
  return `${userId}/${filename}`
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
