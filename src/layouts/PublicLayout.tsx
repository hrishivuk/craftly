import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from '../components/Navbar'

export function PublicLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isJoin = location.pathname === '/join'
  const isArtisanShop = location.pathname.startsWith('/a/')
  const shouldHideNavbar = isArtisanShop || isJoin

  return (
    <main className={`site-shell ${isHome ? 'site-shell-home' : ''}`}>
      {!shouldHideNavbar ? <Navbar /> : null}
      <Outlet />
    </main>
  )
}
