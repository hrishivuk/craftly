import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { trackEvent } from '../lib/analytics'
import { upsertProfile } from '../lib/craftlyApi'
import { toErrorMessage } from '../lib/errors'
import { normalizeSlug } from '../lib/slug'

type SignupStep = 1 | 2 | 3

export function JoinArtisanPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp, user } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [signupStep, setSignupStep] = useState<SignupStep>(1)
  const [displayName, setDisplayName] = useState('')
  const [slug, setSlug] = useState('')
  const [bio, setBio] = useState('')
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

  const goToNextStep = () => {
    if (signupStep === 1) {
      if (!displayName.trim() || !email.trim() || !password.trim()) {
        setErrorMessage('Display name, email, and password are required.')
        return
      }
      trackEvent('join_step_completed', { step: 1 })
      setSignupStep(2)
      return
    }

    if (signupStep === 2) {
      const cleanedSlug = normalizeSlug(slug)
      if (!cleanedSlug) {
        setErrorMessage('Please add a valid profile slug.')
        return
      }
      setSlug(cleanedSlug)
      trackEvent('join_step_completed', { step: 2 })
      setSignupStep(3)
    }
  }

  const goToPreviousStep = () => {
    setErrorMessage(null)
    setNoticeMessage(null)
    setSignupStep((prev) => (prev === 1 ? 1 : ((prev - 1) as SignupStep)))
  }

  const handleContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setNoticeMessage(null)

    if (!email || !password) {
      setErrorMessage('Email and password are required.')
      return
    }

    if (mode === 'signup' && signupStep < 3) {
      goToNextStep()
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

        const effectiveUser = session.user ?? user
        if (effectiveUser) {
          await upsertProfile(effectiveUser, {
            slug: normalizeSlug(slug),
            display_name: displayName.trim(),
            bio: bio.trim(),
            story: '',
          })
        }
      } else {
        await signIn(email.trim(), password)
      }

      trackEvent('join_auth_success', { mode, step: signupStep })
      navigate(nextPath)
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Unable to continue right now.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSignin = mode === 'signin'
  const isFinalSignupStep = signupStep === 3

  if (user && isSignin) {
    return <Navigate to={nextPath} replace />
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
              onClick={() => {
                setMode('signup')
                setSignupStep(1)
                setErrorMessage(null)
                setNoticeMessage(null)
              }}
              type="button"
            >
              New Artisan
            </button>
            <button
              className={`btn btn-soft ${mode === 'signin' ? 'mode-active' : ''}`}
              onClick={() => {
                setMode('signin')
                setErrorMessage(null)
                setNoticeMessage(null)
              }}
              type="button"
            >
              Returning Artisan
            </button>
          </div>

          <div className="steps">
            <span className={`step ${signupStep >= 1 ? 'active' : ''}`}>1 Account</span>
            <span className={`step ${signupStep >= 2 ? 'active' : ''}`}>2 Shop details</span>
            <span className={`step ${signupStep >= 3 ? 'active' : ''}`}>3 Publish</span>
          </div>

          <form className="form-card" onSubmit={handleContinue}>
            {mode === 'signup' && signupStep === 1 ? (
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

            {isSignin || signupStep === 1 ? (
              <>
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
              </>
            ) : null}

            {mode === 'signup' && signupStep === 2 ? (
              <>
                <label>
                  <span>Profile URL</span>
                  <input
                    type="text"
                    placeholder="terra-clay-studio"
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                  />
                </label>
                <label>
                  <span>Short bio (optional)</span>
                  <textarea
                    rows={3}
                    placeholder="What do you craft and for whom?"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                  />
                </label>
              </>
            ) : null}

            {mode === 'signup' && signupStep === 3 ? (
              <section className="signup-preview">
                <p className="eyebrow">Preview</p>
                <h3>{displayName || 'Your studio name'}</h3>
                <p>Public URL: craftly.com/a/{normalizeSlug(slug) || 'your-slug'}</p>
                <p>{bio || 'Add your bio to help buyers understand your style.'}</p>
              </section>
            ) : null}

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
            {noticeMessage ? <p className="form-success">{noticeMessage}</p> : null}
            <div className="step-actions">
              {mode === 'signup' && signupStep > 1 ? (
                <button className="btn btn-soft" type="button" onClick={goToPreviousStep}>
                  Back
                </button>
              ) : null}
              <button className="btn btn-primary full" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Submitting...'
                  : isSignin
                    ? submitLabel
                    : isFinalSignupStep
                      ? 'Create account'
                      : 'Continue'}
              </button>
            </div>
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
