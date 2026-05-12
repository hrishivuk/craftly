import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { DashboardSectionHeader } from '../components/dashboard/DashboardSectionHeader'
import { useShop } from '../hooks/useShop'
import { updateStorefrontStudioConfig, uploadStorefrontImage } from '../lib/craftlyApi'
import { toErrorMessage } from '../lib/errors'
import {
  getStorefrontStudioConfigFromShop,
  storefrontThemeOptions,
  type StorefrontStudioConfig,
} from '../lib/storefrontStudio'

export function DashboardStorefrontStudioPage() {
  const { shop, isLoading } = useShop()
  const [formState, setFormState] = useState<StorefrontStudioConfig>(
    getStorefrontStudioConfigFromShop(null),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [bannerUploadFile, setBannerUploadFile] = useState<File | null>(null)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [bannerInputKey, setBannerInputKey] = useState(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!shop) return

    const timeoutId = window.setTimeout(() => {
      setFormState(getStorefrontStudioConfigFromShop(shop))
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [shop])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!shop) return
    setIsSaving(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    void updateStorefrontStudioConfig(shop.id, formState)
      .then(() => {
        setSuccessMessage('Storefront style saved and published to your public shop.')
      })
      .catch((error) => {
        setErrorMessage(toErrorMessage(error, 'Unable to save storefront style right now.'))
      })
      .finally(() => {
        setIsSaving(false)
      })
  }

  const handleUploadBanner = () => {
    if (!shop) return

    const file = bannerUploadFile
    if (!file) {
      setErrorMessage('Choose a banner image before uploading.')
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    setIsUploadingBanner(true)

    void uploadStorefrontImage({
      userId: shop.user_id,
      kind: 'banner',
      file,
    })
      .then((publicUrl) => {
        setFormState((prev) => ({
          ...prev,
          shopBannerUrl: publicUrl,
        }))

        setBannerUploadFile(null)
        setBannerInputKey((prev) => prev + 1)
        setSuccessMessage('Banner uploaded. Save storefront style to publish.')
      })
      .catch((error) => {
        setErrorMessage(toErrorMessage(error, 'Unable to upload banner image right now.'))
      })
      .finally(() => {
        setIsUploadingBanner(false)
      })
  }

  if (isLoading) {
    return (
      <article className="page page-admin-content">
        <section className="admin-main">
          <p className="auth-state">Loading storefront studio...</p>
        </section>
      </article>
    )
  }

  return (
    <article className="page page-admin-content">
      <section className="admin-main">
        <DashboardSectionHeader
          title="Design studio"
          description="Choose a preset theme style for your public shop."
        />

        {!shop ? (
          <p className="empty-state">Complete onboarding first to unlock storefront customization.</p>
        ) : (
          <form className="panel panel-form" onSubmit={handleSubmit}>
            <h3>Hero settings</h3>
            <p className="empty-state">Quick setup: add headline, banner, and choose a theme.</p>
            <label>
              <span>Hero headline</span>
              <input
                type="text"
                value={formState.heroHeadline}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, heroHeadline: event.target.value }))
                }
              />
            </label>
            <div className="media-upload-card">
              <p className="media-upload-title">Shop banner image</p>
              <p className="media-upload-note">
                {formState.shopBannerUrl ? 'Banner uploaded. Choose a new file to replace it.' : 'Use a wide image for best hero fit.'}
              </p>
              <input
                id="banner-upload"
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
                <label className="btn btn-soft" htmlFor="banner-upload">
                  Choose file
                </label>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={!bannerUploadFile || isUploadingBanner}
                  onClick={handleUploadBanner}
                >
                  {isUploadingBanner
                    ? 'Uploading banner...'
                    : bannerUploadFile
                      ? 'Upload banner'
                      : formState.shopBannerUrl
                        ? 'Banner uploaded'
                        : 'Upload banner'}
                </button>
              </div>
              <p className="media-upload-file">{bannerUploadFile ? bannerUploadFile.name : 'No file selected'}</p>
            </div>
            <fieldset className="theme-fieldset">
              <legend>Theme options</legend>
              <div className="theme-option-grid">
                {storefrontThemeOptions.map((theme) => (
                  <label
                    key={theme.tone}
                    className={`theme-option-card ${formState.tone === theme.tone ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="shop-theme"
                      value={theme.tone}
                      checked={formState.tone === theme.tone}
                      onChange={() =>
                        setFormState((prev) => ({
                          ...prev,
                          tone: theme.tone,
                          primaryColor: theme.primaryColor,
                          secondaryColor: theme.secondaryColor,
                        }))
                      }
                    />
                    <div className={`theme-option-preview preview-${theme.tone}`}>
                      <span />
                      <span />
                      <span />
                    </div>
                    <p className="theme-option-title">{theme.label}</p>
                    <p className="theme-option-description">{theme.description}</p>
                  </label>
                ))}
              </div>
            </fieldset>
            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
            {successMessage ? <p className="form-success">{successMessage}</p> : null}
            <button className="btn btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save storefront style'}
            </button>
          </form>
        )}
      </section>
    </article>
  )
}
