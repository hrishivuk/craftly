import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { trackEvent } from '../lib/analytics'
import { toErrorMessage } from '../lib/errors'

export function JoinArtisanPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp, user } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null)

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('next') || '/dashboard/overview'
  }, [location.search])

  const submitLabel = mode === 'signin' ? 'Sign in' : 'Create account'

  const handleContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setNoticeMessage(null)

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required.')
      return
    }

    if (mode === 'signup' && !displayName.trim()) {
      setErrorMessage('Name, email, and password are required.')
      return
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'signup') {
        const session = await signUp(email.trim(), password.trim())
        if (!session) {
          setNoticeMessage('Check your email to confirm your account, then log in.')
          setMode('signin')
          return
        }
      } else {
        await signIn(email.trim(), password.trim())
      }

      trackEvent('join_auth_success', { mode })
      navigate(nextPath)
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Unable to continue right now.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user) {
    return <Navigate to={nextPath} replace />
  }

  return (
    <article className="page page-onboarding">
      <section className="join-auth-shell">
        <aside className="join-auth-visual">
          <img src="/login.jpg" alt="Gift wrapped in natural craft paper" className="join-auth-visual-image" />
          <div className="join-auth-visual-overlay">
            <p>You can easily</p>
            <h3>Launch your craft shop and start selling faster.</h3>
          </div>
        </aside>
        <div className="join-auth-right">
          <div className="auth-column join-auth-card">
            <h2>{mode === 'signin' ? 'Get Started Now' : 'Create your account'}</h2>
            <p className="lead-small">
              {mode === 'signin'
                ? 'Please login to your account to continue.'
                : 'Create your account to continue and complete onboarding next.'}
            </p>
            <div className="mode-switch join-mode-switch" role="tablist" aria-label="Account mode">
              <button
                className={`join-toggle-btn ${mode === 'signin' ? 'mode-active' : ''}`}
                onClick={() => {
                  setMode('signin')
                  setErrorMessage(null)
                  setNoticeMessage(null)
                }}
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
              >
                Sign in
              </button>
              <button
                className={`join-toggle-btn ${mode === 'signup' ? 'mode-active' : ''}`}
                onClick={() => {
                  setMode('signup')
                  setErrorMessage(null)
                  setNoticeMessage(null)
                }}
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
              >
                Sign up
              </button>
            </div>

            <form className="form-card join-auth-form" onSubmit={handleContinue}>
              {mode === 'signup' ? (
                <label>
                  <span>Display name</span>
                  <input
                    type="text"
                    placeholder="Terra Clay Studio"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                </label>
              ) : null}

              <label>
                <span>Email</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>

              {mode === 'signup' ? (
                <label>
                  <span>Confirm password</span>
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </label>
              ) : null}

              {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
              {noticeMessage ? <p className="form-success">{noticeMessage}</p> : null}
              <div className="step-actions">
                <button className="btn btn-primary full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </article>
  )
}
