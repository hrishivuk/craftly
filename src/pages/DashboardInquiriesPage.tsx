import { useEffect, useMemo, useState } from 'react'
import { DashboardSectionHeader } from '../components/dashboard/DashboardSectionHeader'
import { useArtisanProfile } from '../hooks/useArtisanProfile'
import { fetchCustomRequestsByArtisanId } from '../lib/craftlyApi'
import { toErrorMessage } from '../lib/errors'
import type { CustomRequestRow } from '../types/database'

const statusLabel: Record<CustomRequestRow['status'], string> = {
  new: 'New',
  reviewed: 'In Discussion',
  closed: 'Closed',
}

export function DashboardInquiriesPage() {
  const { profile, isLoading: isProfileLoading } = useArtisanProfile()
  const [activeFilter, setActiveFilter] = useState<CustomRequestRow['status'] | 'all'>('all')
  const [requests, setRequests] = useState<CustomRequestRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) {
      return
    }

    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const rows = await fetchCustomRequestsByArtisanId(profile.id)
        if (!isMounted) return
        setRequests(rows)
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(toErrorMessage(error, 'Failed to load inquiries.'))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [profile])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return requests
    return requests.filter((item) => item.status === activeFilter)
  }, [activeFilter, requests])

  return (
    <article className="page page-admin-content">
      <section className="admin-main">
        <DashboardSectionHeader
          title="Buyer Requests"
          description="Review inquiries and prioritize high-intent buyer conversations."
          actions={
            <div className="inquiry-filters">
              {(['all', 'new', 'reviewed', 'closed'] as const).map((status) => (
                <button
                  key={status}
                  className={`btn btn-soft ${activeFilter === status ? 'mode-active' : ''}`}
                  onClick={() => setActiveFilter(status)}
                  type="button"
                >
                  {status === 'all' ? 'All' : statusLabel[status]}
                </button>
              ))}
            </div>
          }
        />

        {isProfileLoading || (Boolean(profile) && isLoading) ? (
          <p className="auth-state">Loading inquiries...</p>
        ) : null}
        {!profile && !isProfileLoading ? (
          <p className="empty-state">Create your profile first to start receiving inquiries.</p>
        ) : null}
        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        {!isProfileLoading && !(Boolean(profile) && isLoading) && !errorMessage && profile ? (
          filtered.length === 0 ? (
            <p className="empty-state">No inquiries in this status yet.</p>
          ) : (
            <div className="rows inquiry-rows">
              {filtered.map((item) => (
                <article className="inquiry-card" key={item.id}>
                  <div className="inquiry-card-head">
                    <p>{item.buyer_name}</p>
                    <span className={`status-chip status-${item.status}`}>{statusLabel[item.status]}</span>
                  </div>
                  <p className="inquiry-meta">{item.buyer_email}</p>
                  {item.occasion ? <p className="inquiry-meta">Occasion: {item.occasion}</p> : null}
                  {item.budget_range ? <p className="inquiry-meta">Budget: {item.budget_range}</p> : null}
                  <p>{item.details}</p>
                </article>
              ))}
            </div>
          )
        ) : null}
      </section>
    </article>
  )
}
