const url = process.env.LEADS_WEBHOOK_URL
const username = process.env.WEBHOOK_USERNAME
const password = process.env.WEBHOOK_PASSWORD

export async function notifyWebhook(payload: Record<string, unknown>): Promise<void> {
  if (!url || !username || !password) {
    console.warn('[webhook] missing env vars, skipping')
    return
  }

  const credentials = Buffer.from(`${username}:${password}`).toString('base64')

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.error('[webhook] non-OK response', res.status)
    }
  } catch (err) {
    console.error('[webhook] request failed', err)
  }
}
