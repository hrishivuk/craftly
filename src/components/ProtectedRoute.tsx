import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useShop } from '../hooks/useShop'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation()
  const { isLoading, user } = useAuth()
  const { isLoading: isLoadingShop, isOnboardingComplete } = useShop()

  if (isLoading || (user && isLoadingShop)) {
    return <p className="auth-state">Checking your account...</p>
  }

  if (!user) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/join?next=${encodeURIComponent(next)}`} replace />
  }

  const localCompletionKey = `craftly:onboarding-complete:${user.id}`
  const hasLocalCompletion = typeof window !== 'undefined' && localStorage.getItem(localCompletionKey) === '1'
  const onboardingDone = isOnboardingComplete || hasLocalCompletion

  const isOnboardingRoute = location.pathname.startsWith('/onboarding')
  if (!onboardingDone && !isOnboardingRoute) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/onboarding?next=${encodeURIComponent(next)}`} replace />
  }

  return <>{children}</>
}
