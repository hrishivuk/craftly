import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardLayout } from './layouts/DashboardLayout'
import { DashboardInquiriesPage } from './pages/DashboardInquiriesPage'
import { PublicLayout } from './layouts/PublicLayout'
import { ArtisanShopPage } from './pages/ArtisanShopPage'
import { DashboardProductEditorPage } from './pages/DashboardProductEditorPage'
import { DashboardProfilePage } from './pages/DashboardProfilePage'
import { DashboardProductsPage } from './pages/DashboardProductsPage'
import { DashboardStorefrontStudioPage } from './pages/DashboardStorefrontStudioPage'
import { HomePage } from './pages/HomePage'
import { JoinArtisanPage } from './pages/JoinArtisanPage'
import { ProductDetailsPage } from './pages/ProductDetailsPage'
import { useAuth } from './auth/useAuth'

function HomeEntryRoute() {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return <p className="auth-state">Checking your account...</p>
  }

  if (user) {
    return <Navigate to="/dashboard/studio" replace />
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
        <Route path="/a/:slug/p/:productId" element={<ProductDetailsPage />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="studio" replace />} />
        <Route path="studio" element={<DashboardStorefrontStudioPage />} />
        <Route path="profile" element={<DashboardProfilePage />} />
        <Route path="products" element={<DashboardProductsPage />} />
        <Route path="products/new" element={<DashboardProductEditorPage />} />
        <Route path="products/:productId" element={<DashboardProductEditorPage />} />
        <Route path="inquiries" element={<DashboardInquiriesPage />} />
      </Route>

      <Route path="/404" element={<p className="not-found">Page not found</p>} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
