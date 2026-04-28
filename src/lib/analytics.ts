type AnalyticsEventName =
  | 'home_cta_clicked'
  | 'sample_shop_clicked'
  | 'join_step_completed'
  | 'join_auth_success'
  | 'inquiry_started'
  | 'inquiry_submitted'
  | 'product_saved'
  | 'product_published'

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

type AnalyticsEvent = {
  name: AnalyticsEventName
  payload: AnalyticsPayload
  at: string
}

const STORAGE_KEY = 'craftly.mock.analytics.events'

export function trackEvent(name: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  const event: AnalyticsEvent = {
    name,
    payload,
    at: new Date().toISOString(),
  }

  try {
    const current = localStorage.getItem(STORAGE_KEY)
    const parsed: AnalyticsEvent[] = current ? (JSON.parse(current) as AnalyticsEvent[]) : []
    parsed.push(event)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.slice(-200)))
  } catch {
    // Analytics is best-effort and should never block UX flows.
  }

  if (import.meta.env.DEV) {
    console.info('[analytics]', event)
  }
}
