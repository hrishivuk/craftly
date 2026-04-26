import { Link } from 'react-router-dom'

type NavbarProps = {
  actionLabel?: string
  actionTo?: string
  onActionClick?: () => void
}

export function Navbar({ actionLabel = 'Log in', actionTo = '/join', onActionClick }: NavbarProps) {
  return (
    <header className="top-nav">
      <Link className="brand-link" to="/">
        Craftly
      </Link>

      {onActionClick ? (
        <button className="btn btn-soft" onClick={onActionClick} type="button">
          {actionLabel}
        </button>
      ) : (
        <Link className="btn btn-soft nav-link-btn" to={actionTo}>
          {actionLabel}
        </Link>
      )}
    </header>
  )
}
