import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { trackEvent } from '../lib/analytics'
import { createCustomRequest, fetchProductsByArtisanId, fetchPublicProfileBySlug } from '../lib/craftlyApi'
import { getStorefrontStudioConfigFromProfile } from '../lib/storefrontStudio'
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
  const storefrontConfig = useMemo(() => {
    return getStorefrontStudioConfigFromProfile(profile)
  }, [profile])

  const handleOpenContact = () => {
    trackEvent('inquiry_started', { slug: slug ?? null })
    document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
      trackEvent('inquiry_submitted', { slug: slug ?? null })
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
  const avatarInitials = studioName
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')

  const shopThemeStyle = {
    '--shop-primary': storefrontConfig.primaryColor,
    '--shop-secondary': storefrontConfig.secondaryColor,
  } as CSSProperties

  return (
    <article
      className={`page page-buyer page-shop-rework shop-page-tone-${storefrontConfig.tone} shop-v3-shell`}
      style={shopThemeStyle}
    >
      <section className={`shop-v3-hero shop-tone-${storefrontConfig.tone}`}>
        <div className="shop-v3-hero-inner">
          <div
            className="shop-v3-banner"
            style={{
              backgroundImage: storefrontConfig.shopBannerUrl
                ? `linear-gradient(125deg, rgba(23, 18, 14, 0.62), rgba(23, 18, 14, 0.28)), url(${storefrontConfig.shopBannerUrl})`
                : undefined,
            }}
          >
            <div className="shop-v3-identity">
              {storefrontConfig.shopAvatarUrl ? (
                <img className="shop-v3-avatar-image" src={storefrontConfig.shopAvatarUrl} alt={studioName} />
              ) : (
                <div className="shop-v3-avatar">{avatarInitials || 'CS'}</div>
              )}
              <div>
                <p className="eyebrow">Craftly artisan shop</p>
                <h2>{studioName}</h2>
                <p className="shop-v3-headline">{storefrontConfig.heroHeadline}</p>
              </div>
            </div>
          </div>
          <div className="shop-v3-meta-row">
            <p>{profile?.bio || 'Handcrafted work rooted in emotion, memory, and meaningful gifting.'}</p>
            <button className="btn btn-primary" type="button" onClick={handleOpenContact}>
              Contact artisan
            </button>
          </div>
        </div>
      </section>

      <section className="catalog catalog-v2 shop-v3-products">
        <div className="section-head">
          <h3>Featured creations</h3>
        </div>
        <div className="product-grid">
          {products.length === 0 ? (
            <p className="empty-state">This artisan has no published products yet.</p>
          ) : (
            products.map((product) => (
              <article className="product-card product-card-v2 shop-v3-product-card" key={product.id}>
                {product.image_url ? (
                  <img className="product-media-image" src={product.image_url} alt={product.title} />
                ) : (
                  <div className="product-media shop-v3-product-media">Image coming soon</div>
                )}
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

      <section className="catalog catalog-v2 shop-request-section shop-v3-contact" id="request-form">
        <form className="panel panel-form request-form shop-themed-form" onSubmit={handleRequestSubmit}>
          <div className="section-head">
            <h3>Contact artisan</h3>
          </div>
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
            <span>What do you want made?</span>
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

        <aside className="panel shop-v3-contact-side">
          <p className="eyebrow">Quick process</p>
          <h4>Simple and direct</h4>
          <p>You share your idea. The artisan replies with availability, timeline, and next steps.</p>
        </aside>
      </section>
    </article>
  )
}
