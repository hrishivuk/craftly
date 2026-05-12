import { useMemo } from 'react'
import { DashboardSectionHeader } from '../components/dashboard/DashboardSectionHeader'
import { InsightStatCard } from '../components/dashboard/InsightStatCard'
import { useShop } from '../hooks/useShop'

export function DashboardInsightsPage() {
  const { shop, isLoading } = useShop()

  const shopHealth = useMemo(() => {
    if (!shop) return '0%'
    const checks = [
      Boolean(shop.name),
      Boolean(shop.slug),
      Boolean(shop.description),
      Boolean(shop.shop_banner_url),
    ]
    const score = Math.round((checks.filter(Boolean).length / checks.length) * 100)
    return `${score}%`
  }, [shop])

  if (isLoading) {
    return (
      <article className="page page-admin-content">
        <section className="admin-main">
          <p className="auth-state">Loading insights...</p>
        </section>
      </article>
    )
  }

  return (
    <article className="page page-admin-content">
      <section className="admin-main">
        <DashboardSectionHeader
          title="Insights"
          description="Simple conversion signals to improve first-look buyer confidence."
        />

        {!shop ? (
          <p className="empty-state">Complete your shop setup to start collecting meaningful insights.</p>
        ) : (
          <>
            <div className="insight-grid">
              <InsightStatCard
                label="Shop health"
                value={shopHealth}
                hint="Based on shop name, slug, description, and banner."
              />
              <InsightStatCard
                label="Estimated response trust"
                value="Medium"
                hint="Add trust note + fulfillment details in Storefront Studio."
              />
              <InsightStatCard
                label="Storefront readiness"
                value={shop.shop_banner_url ? 'Ready' : 'In progress'}
                hint={shop.shop_banner_url ? 'Banner is present and discoverable.' : 'Add banner for buyer trust.'}
              />
            </div>

            <div className="panel">
              <h3>What to improve next</h3>
              <ul className="checklist">
                <li>{shop.description ? '✓' : '○'} Add a concise buyer-facing description</li>
                <li>{shop.shop_banner_url ? '✓' : '○'} Add a banner for storefront trust</li>
                <li>○ Keep 3-5 products published at all times</li>
                <li>○ Use clear budget ranges in request conversations</li>
              </ul>
            </div>
          </>
        )}
      </section>
    </article>
  )
}
