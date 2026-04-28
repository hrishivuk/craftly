import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

type NavbarProps = {
  onActionClick?: () => void
}

export function Navbar({ onActionClick }: NavbarProps) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    if (onActionClick) {
      onActionClick()
      return
    }

    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Failed to log out', error)
    }
  }

  return (
    <header className="top-nav">
      <Link className="brand-link" to="/">
        craftly .
      </Link>

      <div />

      <div className="top-nav-actions">
        {user ? (
          <button className="btn btn-soft nav-action-btn" onClick={handleLogout} type="button">
            Log out
          </button>
        ) : (
          <Link className="btn btn-soft nav-link-btn nav-action-btn" to="/join">
            Log in
          </Link>
        )}
      </div>
    </header>
  )
}
