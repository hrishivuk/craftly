import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { createCustomRequest, fetchProductsByArtisanId, fetchPublicProfileBySlug } from '../lib/craftlyApi'
import type { ArtisanProfileRow, ProductRow } from '../types/database'

export function ArtisanShopPage() {
  const { slug } = useParams()
  const [profile, setProfile] = useState<ArtisanProfileRow | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [requestState, setRequestState] = useState({
    buyerName: '',
    buyerEmail: '',
    occasion: '',
    budgetRange: '',
    details: '',
  })
  const [requestError, setRequestError] = useState<string | null>(null)
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null)
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

  const fallbackName = useMemo(() => {
    if (!slug) return 'Terra Studio'
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }, [slug])

  useEffect(() => {
    if (!slug) return

    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const artisanProfile = await fetchPublicProfileBySlug(slug)
        if (!artisanProfile) {
          if (isMounted) {
            setProfile(null)
            setProducts([])
            setErrorMessage('This artisan profile does not exist yet.')
          }
          return
        }

        const listing = await fetchProductsByArtisanId(artisanProfile.id)
        if (!isMounted) return

        setProfile(artisanProfile)
        setProducts(listing.filter((item) => item.status === 'published'))
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load artisan page.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [slug])

  const handleRequestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRequestError(null)
    setRequestSuccess(null)

    if (!profile) {
      setRequestError('Artisan profile is unavailable right now.')
      return
    }

    if (!requestState.buyerName.trim() || !requestState.buyerEmail.trim() || !requestState.details.trim()) {
      setRequestError('Name, email, and request details are required.')
      return
    }

    setIsSubmittingRequest(true)
    try {
      await createCustomRequest({
        artisan_id: profile.id,
        buyer_name: requestState.buyerName.trim(),
        buyer_email: requestState.buyerEmail.trim(),
        occasion: requestState.occasion.trim(),
        budget_range: requestState.budgetRange.trim(),
        details: requestState.details.trim(),
      })
      setRequestState({
        buyerName: '',
        buyerEmail: '',
        occasion: '',
        budgetRange: '',
        details: '',
      })
      setRequestSuccess('Request sent. The artisan can now review your idea.')
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to send your request.')
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  if (isLoading) {
    return (
      <article className="page page-buyer">
        <p className="auth-state">Loading artisan shop...</p>
      </article>
    )
  }

  if (errorMessage) {
    return (
      <article className="page page-buyer">
        <p className="form-error">{errorMessage}</p>
      </article>
    )
  }

  if (!slug) {
    return (
      <article className="page page-buyer">
        <p className="form-error">Artisan profile not found.</p>
      </article>
    )
  }

  const studioName = profile?.display_name || fallbackName

  return (
    <article className="page page-buyer">
      <section className="shop-hero">
        <div className="avatar">TS</div>
        <div className="shop-hero-copy">
          <h2>{studioName}</h2>
          <p>{profile?.bio || 'Handcrafted work rooted in emotion, memory, and meaningful gifting.'}</p>
          <p>{profile?.story || 'Every piece is made to carry a story from maker to receiver.'}</p>
          <p className="profile-link">craftly.com/a/{slug || 'terra-studio'}</p>
        </div>
        <a className="btn btn-primary nav-link-btn" href="#request-form">
          Request custom piece
        </a>
      </section>

      <section className="catalog">
        <div className="section-head">
          <h3>Products</h3>
          <button className="btn btn-soft" type="button">
            Story-led catalog
          </button>
        </div>
        <div className="product-grid">
          {products.length === 0 ? (
            <p className="empty-state">This artisan has no published products yet.</p>
          ) : (
            products.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-media">Image</div>
                <div className="product-meta">
                  <p>{product.title}</p>
                  <span>{product.price_hint || 'Price on request'}</span>
                  {product.description ? <small>{product.description}</small> : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="catalog" id="request-form">
        <div className="section-head">
          <h3>Request a custom product</h3>
        </div>
        <form className="panel panel-form request-form" onSubmit={handleRequestSubmit}>
          <label>
            <span>Your name</span>
            <input
              type="text"
              value={requestState.buyerName}
              onChange={(event) =>
                setRequestState((prev) => ({ ...prev, buyerName: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={requestState.buyerEmail}
              onChange={(event) =>
                setRequestState((prev) => ({ ...prev, buyerEmail: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Occasion (optional)</span>
            <input
              type="text"
              value={requestState.occasion}
              onChange={(event) =>
                setRequestState((prev) => ({ ...prev, occasion: event.target.value }))
              }
              placeholder="Wedding, birthday, housewarming..."
            />
          </label>
          <label>
            <span>Budget range (optional)</span>
            <input
              type="text"
              value={requestState.budgetRange}
              onChange={(event) =>
                setRequestState((prev) => ({ ...prev, budgetRange: event.target.value }))
              }
              placeholder="e.g. $80 - $150"
            />
          </label>
          <label>
            <span>Tell the artisan what you need</span>
            <textarea
              rows={4}
              value={requestState.details}
              onChange={(event) =>
                setRequestState((prev) => ({ ...prev, details: event.target.value }))
              }
            ></textarea>
          </label>
          {requestError ? <p className="form-error">{requestError}</p> : null}
          {requestSuccess ? <p className="form-success">{requestSuccess}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={isSubmittingRequest}>
            {isSubmittingRequest ? 'Sending request...' : 'Send request'}
          </button>
        </form>
      </section>
    </article>
  )
}
