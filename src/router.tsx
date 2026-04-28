import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardLayout } from './layouts/DashboardLayout'
import { DashboardInsightsPage } from './pages/DashboardInsightsPage'
import { DashboardInquiriesPage } from './pages/DashboardInquiriesPage'
import { DashboardOverviewPage } from './pages/DashboardOverviewPage'
import { PublicLayout } from './layouts/PublicLayout'
import { ArtisanShopPage } from './pages/ArtisanShopPage'
import { DashboardProfilePage } from './pages/DashboardProfilePage'
import { DashboardProductsPage } from './pages/DashboardProductsPage'
import { DashboardStorefrontStudioPage } from './pages/DashboardStorefrontStudioPage'
import { HomePage } from './pages/HomePage'
import { JoinArtisanPage } from './pages/JoinArtisanPage'
import { useAuth } from './auth/useAuth'

function HomeEntryRoute() {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return <p className="auth-state">Checking your account...</p>
  }

  if (user) {
    return <Navigate to="/dashboard/overview" replace />
  }

  return <HomePage />
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomeEntryRoute />} />
        <Route path="/join" element={<JoinArtisanPage />} />
        <Route path="/a/:slug" element={<ArtisanShopPage />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<DashboardOverviewPage />} />
        <Route path="studio" element={<DashboardStorefrontStudioPage />} />
        <Route path="profile" element={<DashboardProfilePage />} />
        <Route path="products" element={<DashboardProductsPage />} />
        <Route path="inquiries" element={<DashboardInquiriesPage />} />
        <Route path="insights" element={<DashboardInsightsPage />} />
      </Route>

      <Route path="/404" element={<p className="not-found">Page not found</p>} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
