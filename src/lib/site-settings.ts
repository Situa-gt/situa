import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'
import { uniqueEmails } from '@/lib/email/recipients'

const leadEmailSettingsKey = 'lead_email_settings'
const botSettingsKey = 'bot_settings'

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

/**
 * Bot test mode, set in the admin (Ajustes → Asistente virtual). While it is on, bot leads go only
 * to the test addresses. On a read error the bot keeps working in normal mode.
 */
export async function getBotTestSettings(): Promise<{ testMode: boolean; testEmails: string[] }> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await (supabase as any)
      .from('app_settings')
      .select('value')
      .eq('key', botSettingsKey)
      .maybeSingle()
    if (error) {
      if (!isMissingSettingsTable(error)) console.error('[settings] bot settings failed', error)
      return { testMode: false, testEmails: [] }
    }
    const value = (data?.value ?? {}) as { test_mode?: unknown; test_emails?: unknown }
    return {
      testMode: value.test_mode === true,
      testEmails: Array.isArray(value.test_emails) ? uniqueEmails(value.test_emails.map((email) => String(email))) : [],
    }
  } catch (error) {
    console.error('[settings] bot settings failed', error)
    return { testMode: false, testEmails: [] }
  }
}
