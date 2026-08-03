export const MAX_IMAGE_BYTES = 12 * 1024 * 1024

export function validateImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Only image files are allowed'
  if (file.type === 'image/svg+xml') return 'SVG images are not allowed'
  if (file.size > MAX_IMAGE_BYTES) return 'File is over 12 MB'
  return null
}

export function buildKey(prefix: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${prefix}/${Date.now()}_${safe}`
}
