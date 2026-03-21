export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .slice(0, 10000)
}

export function sanitizeShortText(input: string): string {
  return sanitizeText(input).slice(0, 500)
}

export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase().slice(0, 254)
}

export function sanitizeUrl(input: string): string {
  const trimmed = input.trim()

  if (!trimmed.startsWith('https://')) {
    throw new Error('Only HTTPS URLs are allowed.')
  }

  return trimmed.slice(0, 2048)
}
