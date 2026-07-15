type EventType =
  | 'project_view'
  | 'model_view'
  | 'search'
  | 'contact_form_start'
  | 'contact_form_submit'
  | 'suggested_project_impression'
  | 'suggested_project_click'
  | 'calculator_submit'

interface TrackPayload {
  event_type: EventType
  project_id?: string
  model_id?: string
  filters?: Record<string, unknown>
}

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const

function getSessionId(): string {
  const key = 'situa_sid'
  let sid = sessionStorage.getItem(key)
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem(key, sid)
  }
  return sid
}

function getContext() {
  const url = new URL(window.location.href)
  const utms: Record<string, string> = {}
  for (const key of UTM_KEYS) {
    const value = url.searchParams.get(key)
    if (value) utms[key] = value
  }

  return {
    session_id: getSessionId(),
    page_path: `${url.pathname}${url.search}`,
    referrer: document.referrer || undefined,
    ...utms,
  }
}

export function trackEvent(payload: TrackPayload): void {
  if (typeof window === 'undefined') return
  try {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, ...getContext() }),
    }).catch(() => {})
  } catch {
    // never throw for analytics
  }
}
