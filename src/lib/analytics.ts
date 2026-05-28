type EventType = 'project_view' | 'model_view' | 'search'

interface TrackPayload {
  event_type: EventType
  project_id?: string
  model_id?: string
  filters?: Record<string, unknown>
}

function getSessionId(): string {
  const key = 'situa_sid'
  let sid = sessionStorage.getItem(key)
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem(key, sid)
  }
  return sid
}

export function trackEvent(payload: TrackPayload): void {
  if (typeof window === 'undefined') return
  try {
    const session_id = getSessionId()
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, session_id }),
    }).catch(() => {})
  } catch {
    // never throw for analytics
  }
}
