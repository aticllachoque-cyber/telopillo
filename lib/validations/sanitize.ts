/**
 * Strips HTML tags and dangerous characters from user input.
 * Used as a Zod `.transform()` to sanitize text fields before storage.
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove stray angle brackets
    .trim()
}
