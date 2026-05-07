import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

export const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'project-media'

export async function uploadFile(
  storagePath: string,
  buffer: Buffer,
  contentType = 'image/webp',
): Promise<string> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true })

  if (error) throw new Error(`Storage upload failed [${storagePath}]: ${error.message}`)

  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
}
