import sgMail from '@sendgrid/mail'

const apiKey = process.env.SENDGRID_API_KEY
const adminEmail = process.env.SITUA_ADMIN_EMAIL

if (!apiKey) throw new Error('Missing env: SENDGRID_API_KEY')
if (!adminEmail) throw new Error('Missing env: SITUA_ADMIN_EMAIL')

sgMail.setApiKey(apiKey)

export async function sendEmail(subject: string, html: string): Promise<void> {
  await sgMail.send({
    to: adminEmail!,
    from: adminEmail!,
    subject,
    html,
  })
}
