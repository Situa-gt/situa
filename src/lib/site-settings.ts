import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'

const leadEmailSettingsKey = 'lead_email_settings'

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
