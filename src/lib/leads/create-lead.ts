import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/email/send-email'
import { redactEmails, resolveContactRecipients } from '@/lib/email/recipients'
import { getLeadBccEmails } from '@/lib/site-settings'
import { notifyWebhook } from '@/lib/webhook'
import type { Database } from '@/lib/database.types'
import type { BotLeadInput } from './bot-schema'
import { botLeadEmail } from './bot-email'
import { formLeadEmail } from './form-email'

type LeadInput = Omit<Database['public']['Tables']['contact_leads']['Insert'], 'channel' | 'ip_address' | 'user_agent'>
type Options = {
  channel: 'form' | 'bot'
  ip: string | null
  ua: string | null
  project: { id: string; name: string; developer_id: string }
  modelName?: string | null
}
const defaultDeps = { createServiceClient, sendEmail, getLeadBccEmails, notifyWebhook }
export async function createLead(input: LeadInput, options: Options, deps = defaultDeps) {
  const { channel, ip, ua, project, modelName = null } = options
  const service = deps.createServiceClient()
  const [{ data: developer, error: developerErr }, { data: projectContacts, error: contactsErr }] =
    await Promise.all([
      service
        .from('developers')
        .select('contact_email, notification_emails')
        .eq('id', project.developer_id)
        .maybeSingle(),
      service
        .from('project_contacts')
        .select('email')
        .eq('project_id', project.id),
    ])

  if (developerErr) console.error('[contact] developer recipient lookup failed', redactEmails(developerErr.message))
  if (contactsErr) console.error('[contact] project recipient lookup failed', redactEmails(contactsErr.message))

  const { data: lead, error } = await service
    .from('contact_leads')
    .insert({
      ...input,
      channel,
      ip_address: ip,
      user_agent: ua,
    })
    .select('id, blocked_at')
    .single()

  if (error) {
    console.error('[contact] insert failed', redactEmails(error.message))
    return { error: 'Error al enviar. Intenta de nuevo.', code: error.code }
  }

  // A person on Sitúa's blocklist (lead_blocklist): the insert trigger already marked the lead.
  // It is kept for Sitúa, flagged, and never reaches the developer, by email or webhook.
  const blocked = Boolean(lead.blocked_at)

  if (channel === 'form' && !blocked) void deps.notifyWebhook({
    form: 'contact',
    full_name: input.full_name,
    email: input.email,
    phone: input.phone || null,
    project_id: input.project_id,
    project_name: project.name,
    model_id: input.model_id ?? null,
    message: input.message ?? null,
    utm_source: input.utm_source ?? null,
    utm_medium: input.utm_medium ?? null,
    utm_campaign: input.utm_campaign ?? null,
    utm_term: input.utm_term ?? null,
    utm_content: input.utm_content ?? null,
    ip: ip,
  })

  const baseTemplate = channel === 'bot'
    ? botLeadEmail(input as BotLeadInput, lead.id, project.name)
    : formLeadEmail(input, project.name, modelName)
  const template = blocked ? blockedLeadEmail(baseTemplate) : baseTemplate

  const situaBccEmails = await deps.getLeadBccEmails(process.env.SITUA_ADMIN_EMAIL ?? '')
  const recipients = blocked ? [] : resolveContactRecipients({
    developerEmails: [
      developer?.contact_email,
      ...((developer?.notification_emails as string[] | null) ?? []),
    ],
    projectEmails: (projectContacts ?? []).map((contact) => contact.email),
    excludedEmails: situaBccEmails,
  })

  const attemptedAt = new Date().toISOString()

  let email: 'sent' | 'failed' | 'skipped' = 'sent'
  try {
    if (!recipients.length && !situaBccEmails.length) throw new Error('No contact email recipient configured')
    const to = recipients.length ? recipients : situaBccEmails
    const bcc = recipients.length ? situaBccEmails : []
    await deps.sendEmail({
      ...template,
      to,
      bcc: bcc.length ? bcc : undefined,
      replyTo: input.email || undefined,
    })
    const { error: trackingError } = await service
      .from('contact_leads')
      .update({ email_attempted_at: attemptedAt, email_sent_at: new Date().toISOString(), email_error: null })
      .eq('id', lead.id)
    if (trackingError) console.error('[contact] email success tracking failed', redactEmails(trackingError.message))
  } catch (err) {
    email = !recipients.length && !situaBccEmails.length ? 'skipped' : 'failed'
    const rawMessage = err instanceof Error ? err.message : String(err)
    const safeMessage = redactEmails(rawMessage).slice(0, 2000)
    console.error('[contact] email failed', safeMessage)
    const { error: trackingError } = await service
      .from('contact_leads')
      .update({ email_attempted_at: attemptedAt, email_sent_at: null, email_error: safeMessage })
      .eq('id', lead.id)
    if (trackingError) console.error('[contact] email failure tracking failed', redactEmails(trackingError.message))
  }

  return { lead_id: lead.id, email }
}

/** Sitúa-only copy of a blocklisted person's lead: flagged in the subject and at the top. */
function blockedLeadEmail(template: { subject: string; html: string }) {
  const notice =
    '<p style="margin:0 0 16px;padding:12px 14px;border-radius:8px;background:#fff3ed;color:#b42318;font-family:Arial,sans-serif;font-size:14px">' +
    '<strong>Contacto en lista negra.</strong> No se envió a la desarrolladora. ' +
    'Está en el admin, en Contactos → Bloqueados.</p>'
  return { subject: `[Lista negra] ${template.subject}`, html: notice + template.html }
}
