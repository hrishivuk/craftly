import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { fetchProfileByUserId, upsertProfile } from '../lib/craftlyApi'

type ProfileFormState = {
  slug: string
  displayName: string
  bio: string
  story: string
}

function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
}

export function DashboardProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formState, setFormState] = useState<ProfileFormState>({
    slug: '',
    displayName: '',
    bio: '',
    story: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const profile = await fetchProfileByUserId(user.id)
        if (!isMounted) return

        if (profile) {
          setFormState({
            slug: profile.slug,
            displayName: profile.display_name,
            bio: profile.bio ?? '',
            story: profile.story ?? '',
          })
        }
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load profile.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [user])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!user) {
      setErrorMessage('Please sign in before saving your profile.')
      return
    }

    const slug = normalizeSlug(formState.slug)
    if (!slug || !formState.displayName.trim()) {
      setErrorMessage('Display name and profile slug are required.')
      return
    }

    setIsSaving(true)
    try {
      const profile = await upsertProfile(user, {
        slug,
        display_name: formState.displayName.trim(),
        bio: formState.bio.trim(),
        story: formState.story.trim(),
      })
      setFormState((prev) => ({
        ...prev,
        slug: profile.slug,
      }))
      setSuccessMessage('Profile saved. Your public shop is live.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save profile.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <article className="page page-admin-content">
        <section className="admin-main">
          <p className="auth-state">Loading profile...</p>
        </section>
      </article>
    )
  }

  return (
    <article className="page page-admin-content">
      <section className="admin-main">
        <div className="admin-head">
          <h2>Profile & Story</h2>
          <button
            className="btn btn-soft"
            type="button"
            onClick={() => navigate(`/a/${formState.slug || 'your-slug'}`)}
          >
            View public shop
          </button>
        </div>

        <form className="panel panel-form" onSubmit={handleSubmit}>
          <label>
            <span>Display name</span>
            <input
              type="text"
              placeholder="Terra Clay Studio"
              value={formState.displayName}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, displayName: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Profile slug</span>
            <input
              type="text"
              placeholder="terra-clay-studio"
              value={formState.slug}
              onChange={(event) => setFormState((prev) => ({ ...prev, slug: event.target.value }))}
            />
          </label>
          <label>
            <span>Short bio</span>
            <textarea
              rows={3}
              placeholder="What do you make and for whom?"
              value={formState.bio}
              onChange={(event) => setFormState((prev) => ({ ...prev, bio: event.target.value }))}
            />
          </label>
          <label>
            <span>Your story</span>
            <textarea
              rows={5}
              placeholder="Share your making philosophy and what your work means."
              value={formState.story}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, story: event.target.value }))
              }
            />
          </label>
          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          {successMessage ? <p className="form-success">{successMessage}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </section>
    </article>
  )
}
