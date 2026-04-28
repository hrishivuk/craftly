type InsightStatCardProps = {
  label: string
  value: string
  hint?: string
}

export function InsightStatCard({ label, value, hint }: InsightStatCardProps) {
  return (
    <article className="insight-card">
      <p className="insight-label">{label}</p>
      <p className="insight-value">{value}</p>
      {hint ? <p className="insight-hint">{hint}</p> : null}
    </article>
  )
}
