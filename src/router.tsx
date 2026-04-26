import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardLayout } from './layouts/DashboardLayout'
import { PublicLayout } from './layouts/PublicLayout'
import { ArtisanShopPage } from './pages/ArtisanShopPage'
import { DashboardProfilePage } from './pages/DashboardProfilePage'
import { DashboardProductsPage } from './pages/DashboardProductsPage'
import { HomePage } from './pages/HomePage'
import { JoinArtisanPage } from './pages/JoinArtisanPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
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
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<DashboardProfilePage />} />
        <Route path="products" element={<DashboardProductsPage />} />
      </Route>

      <Route path="/404" element={<p className="not-found">Page not found</p>} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
