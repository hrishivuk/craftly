import { useEffect, useMemo, useState } from 'react'
import { DashboardSectionHeader } from '../components/dashboard/DashboardSectionHeader'
import { useShop } from '../hooks/useShop'
import { fetchCustomRequestsByShopId, updateCustomRequestStatus } from '../lib/craftlyApi'
import { toErrorMessage } from '../lib/errors'
import type { CustomRequestRow } from '../types/database'

const statusLabel: Record<CustomRequestRow['status'], string> = {
  new: 'New',
  reviewed: 'In Discussion',
  closed: 'Closed',
}

export function DashboardInquiriesPage() {
  const { shop, isLoading: isShopLoading } = useShop()
  const [activeFilter, setActiveFilter] = useState<CustomRequestRow['status'] | 'all'>('all')
  const [requests, setRequests] = useState<CustomRequestRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!shop) {
      return
    }

    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const rows = await fetchCustomRequestsByShopId(shop.id)
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
  }, [shop])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return requests
    return requests.filter((item) => item.status === activeFilter)
  }, [activeFilter, requests])

  const handleStatusUpdate = async (
    requestId: string,
    status: CustomRequestRow['status'],
  ) => {
    setErrorMessage(null)
    setUpdatingRequestId(requestId)
    try {
      const updated = await updateCustomRequestStatus(requestId, status)
      setRequests((prev) =>
        prev.map((row) => (row.id === requestId ? { ...row, status: updated.status } : row)),
      )
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Unable to update request status right now.'))
    } finally {
      setUpdatingRequestId(null)
    }
  }

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

        {isShopLoading || (Boolean(shop) && isLoading) ? (
          <p className="auth-state">Loading inquiries...</p>
        ) : null}
        {!shop && !isShopLoading ? (
          <p className="empty-state">Complete onboarding first to start receiving inquiries.</p>
        ) : null}
        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        {!isShopLoading && !(Boolean(shop) && isLoading) && !errorMessage && shop ? (
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
                  <div className="inline-actions">
                    {item.status !== 'new' ? (
                      <button
                        className="btn btn-soft"
                        type="button"
                        onClick={() => handleStatusUpdate(item.id, 'new')}
                        disabled={updatingRequestId === item.id}
                      >
                        Mark new
                      </button>
                    ) : null}
                    {item.status !== 'reviewed' ? (
                      <button
                        className="btn btn-soft"
                        type="button"
                        onClick={() => handleStatusUpdate(item.id, 'reviewed')}
                        disabled={updatingRequestId === item.id}
                      >
                        Mark in discussion
                      </button>
                    ) : null}
                    {item.status !== 'closed' ? (
                      <button
                        className="btn btn-soft"
                        type="button"
                        onClick={() => handleStatusUpdate(item.id, 'closed')}
                        disabled={updatingRequestId === item.id}
                      >
                        Close
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )
        ) : null}
      </section>
    </article>
  )
}
