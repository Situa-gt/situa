import sgMail from '@sendgrid/mail'

const apiKey = process.env.SENDGRID_API_KEY
const adminEmail = process.env.SITUA_ADMIN_EMAIL

if (!apiKey) throw new Error('Missing env: SENDGRID_API_KEY')
if (!adminEmail) throw new Error('Missing env: SITUA_ADMIN_EMAIL')

sgMail.setApiKey(apiKey)

interface SendEmailOptions {
  subject: string
  html: string
  to: string
  cc?: string[]
  replyTo?: string
}

export async function sendEmail({ subject, html, to, cc, replyTo }: SendEmailOptions): Promise<void> {
  await sgMail.send({
    to,
    from: adminEmail!,
    ...(cc?.length ? { cc } : {}),
    ...(replyTo ? { replyTo } : {}),
    subject,
    html,
  })
}
