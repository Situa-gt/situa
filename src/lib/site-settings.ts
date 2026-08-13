import 'server-only'
import { unstable_cache } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

const leadEmailSettingsKey = 'lead_email_settings'
const homeHeroSettingsKey = 'home_hero_settings'

export interface HomeHeroSettings {
  image_url: string | null
  image_alt: string | null
}

function uniqueEmails(emails: Array<string | null | undefined>) {
  return [...new Set(emails.map((email) => email?.trim().toLowerCase()).filter((email): email is string => Boolean(email)))]
}

function emailList(value: string | undefined) {
  return uniqueEmails(value?.split(/[,\n;]/) ?? [])
}

function normalizeLeadBccSettings(value: unknown) {
  if (!value || typeof value !== 'object') return []
  const rawEmails = (value as { bcc_emails?: unknown }).bcc_emails
  if (!Array.isArray(rawEmails)) return []
  return uniqueEmails(rawEmails.map((email) => String(email)))
}

function isMissingSettingsTable(error: { code?: string } | null) {
  return error?.code === '42P01' || error?.code === 'PGRST205'
}

export async function getLeadBccEmails(fallbackEmail: string) {
  try {
    const supabase = createServiceClient()
    const { data, error } = await (supabase as any)
      .from('app_settings')
      .select('value')
      .eq('key', leadEmailSettingsKey)
      .maybeSingle()

    if (error) {
      if (!isMissingSettingsTable(error)) console.error('[settings] lead email settings failed', error)
      return emailList(process.env.SITUA_BCC_EMAILS || fallbackEmail)
    }

    const configuredEmails = normalizeLeadBccSettings(data?.value)
    return configuredEmails.length ? configuredEmails : emailList(process.env.SITUA_BCC_EMAILS || fallbackEmail)
  } catch (error) {
    console.error('[settings] lead email settings failed', error)
    return emailList(process.env.SITUA_BCC_EMAILS || fallbackEmail)
  }
}

function normalizeHomeHeroSettings(value: unknown): HomeHeroSettings {
  if (!value || typeof value !== 'object') {
    return { image_url: null, image_alt: 'Vivienda nueva en Guatemala' }
  }

  const settings = value as Partial<HomeHeroSettings>
  return {
    image_url: typeof settings.image_url === 'string' && settings.image_url ? settings.image_url : null,
    image_alt:
      typeof settings.image_alt === 'string' && settings.image_alt
        ? settings.image_alt
        : 'Vivienda nueva en Guatemala',
  }
}

async function fetchHomeHeroSettings(): Promise<HomeHeroSettings> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await (supabase as any)
      .from('app_settings')
      .select('value')
      .eq('key', homeHeroSettingsKey)
      .maybeSingle()

    if (error) {
      if (!isMissingSettingsTable(error)) console.error('[settings] home hero settings failed', error)
      return { image_url: null, image_alt: 'Vivienda nueva en Guatemala' }
    }

    return normalizeHomeHeroSettings(data?.value)
  } catch (error) {
    console.error('[settings] home hero settings failed', error)
    return { image_url: null, image_alt: 'Vivienda nueva en Guatemala' }
  }
}

export const getHomeHeroSettings = unstable_cache(
  fetchHomeHeroSettings,
  ['home', 'hero-settings'],
  { tags: ['home:hero', 'app-settings'], revalidate: 3600 },
)
