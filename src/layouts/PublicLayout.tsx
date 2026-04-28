import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from '../components/Navbar'

export function PublicLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isArtisanShop = location.pathname.startsWith('/a/')

  return (
    <main className={`site-shell ${isHome ? 'site-shell-home' : ''}`}>
      {!isArtisanShop ? <Navbar /> : null}
      <Outlet />
    </main>
  )
}
