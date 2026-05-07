export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const RESERVED = new Set([
  'apartamentos', 'casas', 'sobre-nosotros', 'politica-de-privacidad',
  'terminos-y-condiciones', 'api', 'sitemap', 'robots', '_next', 'assets', 'static',
])

export function isSafeSlug(slug: string): boolean {
  return slug.length >= 2 && slug.length <= 80 && !RESERVED.has(slug)
}

export function uniqueSlug(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base
  let i = 2
  while (existing.has(`${base}-${i}`)) i++
  return `${base}-${i}`
}
