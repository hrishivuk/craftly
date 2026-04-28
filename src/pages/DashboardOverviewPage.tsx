import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardSectionHeader } from '../components/dashboard/DashboardSectionHeader'
import { InsightStatCard } from '../components/dashboard/InsightStatCard'
import { useArtisanProfile } from '../hooks/useArtisanProfile'
import { fetchCustomRequestsByArtisanId, fetchProductsByArtisanId } from '../lib/craftlyApi'
import { toErrorMessage } from '../lib/errors'
import type { CustomRequestRow, ProductRow } from '../types/database'

export function DashboardOverviewPage() {
  const { profile, isLoading: isProfileLoading, errorMessage: profileError } = useArtisanProfile()
  const [products, setProducts] = useState<ProductRow[]>([])
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
        const [productRows, requestRows] = await Promise.all([
          fetchProductsByArtisanId(profile.id),
          fetchCustomRequestsByArtisanId(profile.id),
        ])
        if (!isMounted) return
        setProducts(productRows)
        setRequests(requestRows)
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(toErrorMessage(error, 'Unable to load overview insights.'))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [profile])

  const publishedCount = useMemo(
    () => products.filter((item) => item.status === 'published').length,
    [products],
  )

  const draftCount = products.length - publishedCount
  const newRequestCount = requests.filter((item) => item.status === 'new').length

  if (isProfileLoading) {
    return (
      <article className="page page-admin-content">
        <section className="admin-main">
          <p className="auth-state">Loading dashboard...</p>
        </section>
      </article>
    )
  }

  return (
    <article className="page page-admin-content">
      <section className="admin-main">
        <DashboardSectionHeader
          title="Overview"
          description="Track storefront readiness and buyer conversion signals."
          actions={
            <Link className="btn btn-primary nav-link-btn" to="/dashboard/studio">
              Open Storefront Studio
            </Link>
          }
        />

        {!profile ? (
          <div className="panel">
            <p className="empty-state">
              Create your artisan profile first. Then this overview will show products, requests, and
              conversion signals.
            </p>
            <Link className="btn btn-soft nav-link-btn" to="/dashboard/profile">
              Complete profile
            </Link>
          </div>
        ) : (
          <>
            {profileError ? <p className="form-error">{profileError}</p> : null}
            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
            {Boolean(profile) && isLoading ? (
              <p className="auth-state">Loading overview metrics...</p>
            ) : null}

            {!isLoading ? (
              <>
                <div className="insight-grid">
                  <InsightStatCard
                    label="Storefront completion"
                    value={profile.story ? '90%' : '70%'}
                    hint={profile.story ? 'Story section is complete.' : 'Add your story to improve trust.'}
                  />
                  <InsightStatCard
                    label="Published products"
                    value={`${publishedCount}`}
                    hint={draftCount > 0 ? `${draftCount} draft item(s) pending` : 'No drafts pending'}
                  />
                  <InsightStatCard
                    label="New buyer requests"
                    value={`${newRequestCount}`}
                    hint={requests.length > 0 ? `${requests.length} total request(s)` : 'No requests yet'}
                  />
                </div>

                <div className="admin-content-grid">
                  <div className="panel">
                    <h3>Quick actions</h3>
                    <div className="rows">
                      <Link className="btn btn-soft nav-link-btn" to="/dashboard/studio">
                        Customize hero and trust blocks
                      </Link>
                      <Link className="btn btn-soft nav-link-btn" to="/dashboard/products">
                        Add or publish products
                      </Link>
                      <Link className="btn btn-soft nav-link-btn" to="/dashboard/inquiries">
                        Review buyer requests
                      </Link>
                    </div>
                  </div>

                  <div className="panel">
                    <h3>Conversion checklist</h3>
                    <ul className="checklist">
                      <li>{profile.bio ? '✓' : '○'} Add a short bio</li>
                      <li>{profile.story ? '✓' : '○'} Add your maker story</li>
                      <li>{publishedCount > 0 ? '✓' : '○'} Publish at least one product</li>
                      <li>{requests.length > 0 ? '✓' : '○'} Receive your first buyer request</li>
                    </ul>
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </section>
    </article>
  )
}
