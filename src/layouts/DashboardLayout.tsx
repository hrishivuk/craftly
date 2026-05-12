import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Navbar } from '../components/Navbar'

export function DashboardLayout() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  useEffect(() => {
    document.body.classList.add('dashboard-route')

    return () => {
      document.body.classList.remove('dashboard-route')
    }
  }, [])

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
        <NavLink to="/dashboard/overview">Home</NavLink>
        <NavLink to="/dashboard/shop">Edit shop</NavLink>
        <NavLink to="/dashboard/studio">Design studio</NavLink>
        <NavLink to="/dashboard/products">Products</NavLink>
        <NavLink to="/dashboard/inquiries">Requests</NavLink>
      </aside>

      <section className="dashboard-stage">
        <Navbar onActionClick={handleLogout} />
        <Outlet />
      </section>
    </main>
  )
}
