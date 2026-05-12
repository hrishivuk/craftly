import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardSectionHeader } from '../components/dashboard/DashboardSectionHeader'
import { useAuth } from '../auth/useAuth'
import { useShop } from '../hooks/useShop'
import {
  updateStorefrontStudioConfig,
  uploadStorefrontImage,
  upsertShop,
} from '../lib/craftlyApi'
import { toErrorMessage } from '../lib/errors'
import { normalizeSlug } from '../lib/slug'
import { getStorefrontStudioConfigFromShop } from '../lib/storefrontStudio'

type ShopFormState = {
  slug: string
  shopName: string
  description: string
}

export function DashboardShopPage() {
  const { user } = useAuth()
  const { shop, isLoading: isShopLoading, refreshShop } = useShop()
  const navigate = useNavigate()
  const [formState, setFormState] = useState<ShopFormState>({
    slug: '',
    shopName: '',
    description: '',
  })
  const [heroHeadline, setHeroHeadline] = useState('')
  const [shopBannerUrl, setShopBannerUrl] = useState('')
  const [bannerUploadFile, setBannerUploadFile] = useState<File | null>(null)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [bannerInputKey, setBannerInputKey] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!shop) return
    setFormState({
      slug: shop.slug,
      shopName: shop.name,
      description: shop.description ?? '',
    })
    const storefront = getStorefrontStudioConfigFromShop(shop)
    setHeroHeadline(storefront.heroHeadline)
    setShopBannerUrl(storefront.shopBannerUrl)
  }, [shop])

  const handleUploadBanner = async () => {
    if (!user) {
      setErrorMessage('Please sign in before uploading images.')
      return
    }
    const file = bannerUploadFile
    if (!file) {
      setErrorMessage('Choose a banner image first.')
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    setIsUploadingBanner(true)

    try {
      const publicUrl = await uploadStorefrontImage({
        userId: user.id,
        kind: 'banner',
        file,
      })
      setShopBannerUrl(publicUrl)
      setBannerUploadFile(null)
      setBannerInputKey((prev) => prev + 1)
      setSuccessMessage('Banner uploaded. Save shop changes to publish.')
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Unable to upload banner image right now.'))
    } finally {
      setIsUploadingBanner(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!user) {
      setErrorMessage('Please sign in before saving your shop.')
      return
    }

    const slug = normalizeSlug(formState.slug)
    if (!slug || !formState.shopName.trim()) {
      setErrorMessage('Shop name and shop slug are required.')
      return
    }

    if (!shopBannerUrl) {
      setErrorMessage('Upload a banner image to complete setup.')
      return
    }

    setIsSaving(true)
    try {
      const savedShop = await upsertShop(user, {
        slug,
        name: formState.shopName.trim(),
        description: formState.description.trim(),
        onboarding_completed: true,
      })
      const currentStorefront = getStorefrontStudioConfigFromShop(savedShop)
      await updateStorefrontStudioConfig(savedShop.id, {
        ...currentStorefront,
        heroHeadline: heroHeadline.trim() || currentStorefront.heroHeadline,
        shopBannerUrl,
      })
      setFormState((prev) => ({
        ...prev,
        slug: savedShop.slug,
      }))
      await refreshShop()
      setSuccessMessage('Shop details saved and published.')
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Could not save shop details.'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isShopLoading) {
    return (
      <article className="page page-admin-content">
        <section className="admin-main">
          <p className="auth-state">Loading shop details...</p>
        </section>
      </article>
    )
  }

  return (
    <article className="page page-admin-content">
      <section className="admin-main">
        <DashboardSectionHeader
          title="Edit shop"
          description="Manage your shop identity and storefront essentials."
          actions={
            <button
              className="btn btn-soft"
              type="button"
              onClick={() => navigate(`/a/${formState.slug || 'your-slug'}`)}
            >
              View public shop
            </button>
          }
        />

        <form className="panel panel-form" onSubmit={handleSubmit}>
          <label>
            <span>Shop name</span>
            <input
              type="text"
              placeholder="Terra Clay Studio"
              value={formState.shopName}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, shopName: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Shop slug</span>
            <input
              type="text"
              placeholder="terra-clay-studio"
              value={formState.slug}
              onChange={(event) => setFormState((prev) => ({ ...prev, slug: event.target.value }))}
            />
          </label>
          <label>
            <span>Short description</span>
            <textarea
              rows={3}
              placeholder="What do you craft and for whom?"
              value={formState.description}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>
          <label>
            <span>Hero headline</span>
            <input
              type="text"
              placeholder="Handmade with heart and intention."
              value={heroHeadline}
              onChange={(event) => setHeroHeadline(event.target.value)}
            />
          </label>
          <div className="media-upload-card">
            <p className="media-upload-title">Shop banner image</p>
            <input
              id="shop-banner-upload"
              key={bannerInputKey}
              className="input-hidden"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] || null
                setBannerUploadFile(file)
              }}
            />
            <div className="media-upload-actions">
              <label className="btn btn-soft" htmlFor="shop-banner-upload">
                Choose file
              </label>
              <button
                className="btn btn-primary"
                type="button"
                disabled={!bannerUploadFile || isUploadingBanner}
                onClick={handleUploadBanner}
              >
                {isUploadingBanner ? 'Uploading banner...' : 'Upload banner'}
              </button>
            </div>
            <p className="media-upload-file">{bannerUploadFile ? bannerUploadFile.name : 'No file selected'}</p>
            {shopBannerUrl ? <p className="empty-state">Banner ready</p> : null}
          </div>
          <div className="inline-actions">
            <button className="btn btn-soft" type="button" onClick={() => navigate('/dashboard/studio')}>
              Open design studio (advanced)
            </button>
          </div>
          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          {successMessage ? <p className="form-success">{successMessage}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save shop'}
          </button>
        </form>
      </section>
    </article>
  )
}
