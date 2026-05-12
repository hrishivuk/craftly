import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardSectionHeader } from '../components/dashboard/DashboardSectionHeader'
import { InsightStatCard } from '../components/dashboard/InsightStatCard'
import { useShop } from '../hooks/useShop'
import { fetchCustomRequestsByShopId, fetchProductsByShopId } from '../lib/craftlyApi'
import { toErrorMessage } from '../lib/errors'
import type { CustomRequestRow, ProductRow } from '../types/database'

export function DashboardOverviewPage() {
  const { shop, isLoading: isShopLoading, errorMessage: shopError } = useShop()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [requests, setRequests] = useState<CustomRequestRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
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
        const [productRows, requestRows] = await Promise.all([
          fetchProductsByShopId(shop.id),
          fetchCustomRequestsByShopId(shop.id),
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
  }, [shop])

  const publishedCount = useMemo(
    () => products.filter((item) => item.status === 'published').length,
    [products],
  )

  const draftCount = products.length - publishedCount
  const newRequestCount = requests.filter((item) => item.status === 'new').length
  const hasDescription = Boolean(shop?.description?.trim())
  const hasBanner = Boolean(shop?.shop_banner_url?.trim())
  const hasPublishedProduct = publishedCount > 0
  const checklistCompleted = [hasDescription, hasBanner, hasPublishedProduct].filter(Boolean).length

  if (isShopLoading) {
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
          title="Launch checklist"
          description="Finish the essentials and start collecting buyer requests."
          actions={
            <Link className="btn btn-primary nav-link-btn" to="/dashboard/products/new">
              Add first product
            </Link>
          }
        />

        {!shop ? (
          <div className="panel">
            <p className="empty-state">
              Finish onboarding to set up your shop. Then this overview will show products, requests,
              and conversion signals.
            </p>
            <Link className="btn btn-soft nav-link-btn" to="/onboarding">
              Continue onboarding
            </Link>
          </div>
        ) : (
          <>
            {shopError ? <p className="form-error">{shopError}</p> : null}
            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
            {Boolean(shop) && isLoading ? (
              <p className="auth-state">Loading overview metrics...</p>
            ) : null}

            {!isLoading ? (
              <>
                <div className="insight-grid">
                  <InsightStatCard
                    label="Setup progress"
                    value={`${checklistCompleted}/3`}
                    hint={checklistCompleted === 3 ? 'Your shop basics are ready.' : 'Complete the checklist below.'}
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
                    <h3>What to do next</h3>
                    <div className="rows">
                      <Link className="btn btn-soft nav-link-btn" to="/dashboard/shop">
                        Complete shop basics
                      </Link>
                      <Link className="btn btn-soft nav-link-btn" to="/dashboard/products/new">
                        Add your first product
                      </Link>
                      <Link className="btn btn-soft nav-link-btn" to="/dashboard/inquiries">
                        Check incoming requests
                      </Link>
                      <Link className="btn btn-soft nav-link-btn" to="/dashboard/studio">
                        Customize shop look (optional)
                      </Link>
                    </div>
                  </div>

                  <div className="panel">
                    <h3>Simple launch checklist</h3>
                    <ul className="checklist">
                      <li>{hasDescription ? '✓' : '○'} Add a short shop description</li>
                      <li>{hasBanner ? '✓' : '○'} Upload a shop banner</li>
                      <li>{hasPublishedProduct ? '✓' : '○'} Publish at least one product</li>
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
