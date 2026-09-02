const apiKey = process.env.BREVO_API_KEY
const fromEmail = process.env.BREVO_FROM_EMAIL
const fromName = process.env.BREVO_FROM_NAME || 'Sitúa'

function requireEmailEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

interface SendEmailOptions {
  subject: string
  html: string
  to: string | string[]
  cc?: string[]
  bcc?: string[]
  replyTo?: string
}

interface BrevoRecipient {
  email: string
}

function recipient(email: string): BrevoRecipient {
  return { email }
}

export async function sendEmail({ subject, html, to, cc, bcc, replyTo }: SendEmailOptions): Promise<void> {
  const toEmails = Array.isArray(to) ? to : to ? [to] : []
  if (!toEmails.length) throw new Error('Brevo requires at least one recipient in the "to" field')
  const brevoApiKey = requireEmailEnv('BREVO_API_KEY', apiKey)
  const brevoFromEmail = requireEmailEnv('BREVO_FROM_EMAIL', fromEmail)
  const recipientCount = toEmails.length + (cc?.length ?? 0) + (bcc?.length ?? 0)
  if (recipientCount > 2000) throw new Error('Brevo recipient limit exceeded')

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': brevoApiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        email: brevoFromEmail,
        name: fromName,
      },
      to: toEmails.map(recipient),
      ...(cc?.length ? { cc: cc.map(recipient) } : {}),
      ...(bcc?.length ? { bcc: bcc.map(recipient) } : {}),
      ...(replyTo ? { replyTo: recipient(replyTo) } : {}),
      subject,
      htmlContent: html,
    }),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(`Brevo email failed: ${response.status} ${message}`)
  }
}
