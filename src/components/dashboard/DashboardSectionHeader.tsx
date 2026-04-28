import type { ReactNode } from 'react'

type DashboardSectionHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

export function DashboardSectionHeader({
  title,
  description,
  actions,
}: DashboardSectionHeaderProps) {
  return (
    <div className="admin-head dashboard-head">
      <div>
        <h2>{title}</h2>
        {description ? <p className="admin-subtitle">{description}</p> : null}
      </div>
      {actions ? <div className="head-actions">{actions}</div> : null}
    </div>
  )
}
