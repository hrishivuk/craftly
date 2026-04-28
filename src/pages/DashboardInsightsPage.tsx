import { useMemo } from 'react'
import { DashboardSectionHeader } from '../components/dashboard/DashboardSectionHeader'
import { InsightStatCard } from '../components/dashboard/InsightStatCard'
import { useArtisanProfile } from '../hooks/useArtisanProfile'

export function DashboardInsightsPage() {
  const { profile, isLoading } = useArtisanProfile()

  const profileHealth = useMemo(() => {
    if (!profile) return '0%'
    const checks = [
      Boolean(profile.display_name),
      Boolean(profile.slug),
      Boolean(profile.bio),
      Boolean(profile.story),
    ]
    const score = Math.round((checks.filter(Boolean).length / checks.length) * 100)
    return `${score}%`
  }, [profile])

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

        {!profile ? (
          <p className="empty-state">Complete your profile to start collecting meaningful insights.</p>
        ) : (
          <>
            <div className="insight-grid">
              <InsightStatCard
                label="Profile health"
                value={profileHealth}
                hint="Based on bio, story, display name, and slug."
              />
              <InsightStatCard
                label="Estimated response trust"
                value="Medium"
                hint="Add trust note + fulfillment details in Storefront Studio."
              />
              <InsightStatCard
                label="Storefront readiness"
                value={profile.story ? 'Ready' : 'In progress'}
                hint={profile.story ? 'Story is present and discoverable.' : 'Add story for buyer trust.'}
              />
            </div>

            <div className="panel">
              <h3>What to improve next</h3>
              <ul className="checklist">
                <li>{profile.bio ? '✓' : '○'} Add a concise buyer-facing bio</li>
                <li>{profile.story ? '✓' : '○'} Add your maker story and process</li>
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
