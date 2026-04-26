import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation()
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return <p className="auth-state">Checking your account...</p>
  }

  if (!user) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/join?next=${encodeURIComponent(next)}`} replace />
  }

  return <>{children}</>
}
