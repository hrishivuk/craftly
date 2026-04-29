import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Navbar } from '../components/Navbar'

export function DashboardLayout() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Failed to log out', error)
    }
  }

  return (
    <main className="site-shell dashboard-shell">
      <aside className="admin-sidebar">
        <p className="admin-brand">Craftly Studio</p>
        <NavLink to="/dashboard/studio">Storefront Studio</NavLink>
        <NavLink to="/dashboard/profile">Profile</NavLink>
        <NavLink to="/dashboard/products">Products</NavLink>
        <NavLink to="/dashboard/inquiries">Buyer inquiries</NavLink>
      </aside>

      <section className="dashboard-stage">
        <Navbar onActionClick={handleLogout} />
        <Outlet />
      </section>
    </main>
  )
}
