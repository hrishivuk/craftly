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
        <NavLink to="/dashboard/profile">Profile</NavLink>
        <NavLink to="/dashboard/products">Products</NavLink>
        <span className="coming-soon-nav">Buyer requests</span>
        <span className="coming-soon-nav">Profile settings</span>
      </aside>

      <section className="dashboard-stage">
        <Navbar actionLabel="Log out" onActionClick={handleLogout} />
        <Outlet />
      </section>
    </main>
  )
}
