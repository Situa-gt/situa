import sharp from 'sharp'
import { uploadFile } from './supabase-client'

export interface ImageResult {
  url: string
  url_md: string
  url_sm: string
  blur_data_url: string
  width: number
  height: number
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Image download failed [${url}]: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function lqip(input: Buffer): Promise<string> {
  const buf = await sharp(input)
    .resize(20, undefined, { withoutEnlargement: true })
    .webp({ quality: 20 })
    .toBuffer()
  return `data:image/webp;base64,${buf.toString('base64')}`
}

// basePath: storage path WITHOUT extension, e.g. "zona-10/apartamentos/zima/cover/cover"
// Produces: {basePath}.webp (1600w), {basePath}-md.webp (800w), {basePath}-sm.webp (400w)
export async function processAndUpload(
  imageUrl: string,
  basePath: string,
): Promise<ImageResult> {
  const input = await download(imageUrl)
  const meta = await sharp(input).metadata()

  const [lg, md, sm, blurDataUrl] = await Promise.all([
    sharp(input).resize(1600, undefined, { withoutEnlargement: true }).webp({ quality: 85 }).toBuffer(),
    sharp(input).resize(800, undefined, { withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
    sharp(input).resize(400, undefined, { withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
    lqip(input),
  ])

  const [url, url_md, url_sm] = await Promise.all([
    uploadFile(`${basePath}.webp`, lg),
    uploadFile(`${basePath}-md.webp`, md),
    uploadFile(`${basePath}-sm.webp`, sm),
  ])

  return {
    url,
    url_md,
    url_sm,
    blur_data_url: blurDataUrl,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
  }
}

// Run fn on items with at most `concurrency` in-flight at once
export async function withPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      await fn(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
}
