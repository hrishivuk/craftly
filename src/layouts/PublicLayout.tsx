import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/Navbar'

export function PublicLayout() {
  return (
    <main className="site-shell">
      <Navbar actionLabel="Log in" actionTo="/join" />
      <Outlet />
    </main>
  )
}
