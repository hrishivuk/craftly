import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function JoinArtisanPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null)

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('next') || '/dashboard/profile'
  }, [location.search])

  const submitLabel = mode === 'signin' ? 'Log in to dashboard' : 'Create account'

  const handleContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setNoticeMessage(null)

    if (!email || !password) {
      setErrorMessage('Email and password are required.')
      return
    }

    if (mode === 'signup' && !displayName.trim()) {
      setErrorMessage('Display name is required for new artisans.')
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'signup') {
        const session = await signUp(email.trim(), password)
        if (!session) {
          setNoticeMessage('Check your email to confirm your account, then log in.')
          return
        }
      } else {
        await signIn(email.trim(), password)
      }

      navigate(nextPath)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to continue right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <article className="page page-onboarding">
      <section className="split-layout">
        <div className="auth-column">
          <p className="eyebrow">Create account</p>
          <h2>Start your Artisan profile</h2>
          <p className="lead-small">
            Setup takes a few minutes. Pick your profile URL and add your first product.
          </p>
          <div className="mode-switch" role="tablist" aria-label="Account mode">
            <button
              className={`btn btn-soft ${mode === 'signup' ? 'mode-active' : ''}`}
              onClick={() => setMode('signup')}
              type="button"
            >
              New Artisan
            </button>
            <button
              className={`btn btn-soft ${mode === 'signin' ? 'mode-active' : ''}`}
              onClick={() => setMode('signin')}
              type="button"
            >
              Returning Artisan
            </button>
          </div>

          <div className="steps">
            <span className="step active">1 Account</span>
            <span className="step">2 Shop details</span>
            <span className="step">3 First product</span>
          </div>

          <form className="form-card" onSubmit={handleContinue}>
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
            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
            {noticeMessage ? <p className="form-success">{noticeMessage}</p> : null}
            <button className="btn btn-primary full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : submitLabel}
            </button>
          </form>
        </div>

        <aside className="info-column">
          <h3>Why join as an Artisan?</h3>
          <ul>
            <li>Get your own branded storefront URL</li>
            <li>Show products without managing checkout in phase one</li>
            <li>Discuss custom requests directly with buyers</li>
            <li>Manage listings from a simple admin panel</li>
          </ul>
        </aside>
      </section>
    </article>
  )
}
