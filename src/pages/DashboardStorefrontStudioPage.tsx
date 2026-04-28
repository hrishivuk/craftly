import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { DashboardSectionHeader } from '../components/dashboard/DashboardSectionHeader'
import { useArtisanProfile } from '../hooks/useArtisanProfile'
import { updateStorefrontStudioConfig, uploadStorefrontImage } from '../lib/craftlyApi'
import { toErrorMessage } from '../lib/errors'
import {
  getStorefrontStudioConfigFromProfile,
  pastelColorOptions,
  type StorefrontStudioConfig,
} from '../lib/storefrontStudio'

export function DashboardStorefrontStudioPage() {
  const { profile, isLoading } = useArtisanProfile()
  const [formState, setFormState] = useState<StorefrontStudioConfig>(
    getStorefrontStudioConfigFromProfile(null),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [avatarUploadFile, setAvatarUploadFile] = useState<File | null>(null)
  const [bannerUploadFile, setBannerUploadFile] = useState<File | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [avatarInputKey, setAvatarInputKey] = useState(0)
  const [bannerInputKey, setBannerInputKey] = useState(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return

    const timeoutId = window.setTimeout(() => {
      setFormState(getStorefrontStudioConfigFromProfile(profile))
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [profile])

  const toneClass = useMemo(() => `studio-preview tone-${formState.tone}`, [formState.tone])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profile) return
    setIsSaving(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    void updateStorefrontStudioConfig(profile.id, formState)
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

  const handleUploadImage = (kind: 'avatar' | 'banner') => {
    if (!profile) return

    const file = kind === 'avatar' ? avatarUploadFile : bannerUploadFile
    if (!file) {
      setErrorMessage(`Choose a ${kind} image before uploading.`)
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    if (kind === 'avatar') setIsUploadingAvatar(true)
    if (kind === 'banner') setIsUploadingBanner(true)

    void uploadStorefrontImage({
      userId: profile.user_id,
      kind,
      file,
    })
      .then((publicUrl) => {
        setFormState((prev) => ({
          ...prev,
          shopAvatarUrl: kind === 'avatar' ? publicUrl : prev.shopAvatarUrl,
          shopBannerUrl: kind === 'banner' ? publicUrl : prev.shopBannerUrl,
        }))

        if (kind === 'avatar') {
          setAvatarUploadFile(null)
          setAvatarInputKey((prev) => prev + 1)
        }
        if (kind === 'banner') {
          setBannerUploadFile(null)
          setBannerInputKey((prev) => prev + 1)
        }
        setSuccessMessage(`${kind === 'avatar' ? 'Avatar' : 'Banner'} uploaded. Save storefront style to publish.`)
      })
      .catch((error) => {
        setErrorMessage(toErrorMessage(error, `Unable to upload ${kind} image right now.`))
      })
      .finally(() => {
        if (kind === 'avatar') setIsUploadingAvatar(false)
        if (kind === 'banner') setIsUploadingBanner(false)
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
          title="Storefront Studio"
          description="Shape first-look buyer perception with story, trust, and tone."
        />

        {!profile ? (
          <p className="empty-state">Create your profile first to unlock storefront customization.</p>
        ) : (
          <div className="admin-content-grid studio-grid">
            <form className="panel panel-form" onSubmit={handleSubmit}>
              <h3>Hero settings</h3>
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
              <label>
                <span>Visual tone</span>
                <select
                  value={formState.tone}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      tone: event.target.value as StorefrontStudioConfig['tone'],
                    }))
                  }
                >
                  <option value="earthy">Earthy handcrafted</option>
                  <option value="minimal">Minimal clean</option>
                  <option value="bold">Bold vibrant</option>
                </select>
              </label>
              <div className="media-upload-card">
                <p className="media-upload-title">Shop avatar image</p>
                <p className="media-upload-note">
                  {formState.shopAvatarUrl ? 'Avatar uploaded. You can replace it anytime.' : 'Upload a clear square image.'}
                </p>
                <input
                  id="avatar-upload"
                  key={avatarInputKey}
                  className="input-hidden"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null
                    setAvatarUploadFile(file)
                  }}
                />
                <div className="media-upload-actions">
                  <label className="btn btn-soft" htmlFor="avatar-upload">
                    Choose file
                  </label>
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={!avatarUploadFile || isUploadingAvatar}
                    onClick={() => handleUploadImage('avatar')}
                  >
                    {isUploadingAvatar
                      ? 'Uploading avatar...'
                      : avatarUploadFile
                        ? 'Upload avatar'
                        : formState.shopAvatarUrl
                          ? 'Avatar uploaded'
                          : 'Upload avatar'}
                  </button>
                </div>
                <p className="media-upload-file">{avatarUploadFile ? avatarUploadFile.name : 'No file selected'}</p>
              </div>

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
                    onClick={() => handleUploadImage('banner')}
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
              <label>
                <span>Primary pastel color</span>
                <div className="swatch-grid">
                  {pastelColorOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`swatch-option ${formState.primaryColor === option.value ? 'selected' : ''}`}
                      onClick={() => setFormState((prev) => ({ ...prev, primaryColor: option.value }))}
                      aria-label={`Primary color ${option.label}`}
                      title={option.label}
                    >
                      <span className="swatch-color" style={{ background: option.value }} />
                    </button>
                  ))}
                </div>
              </label>
              <label>
                <span>Secondary pastel color</span>
                <div className="swatch-grid">
                  {pastelColorOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`swatch-option ${formState.secondaryColor === option.value ? 'selected' : ''}`}
                      onClick={() => setFormState((prev) => ({ ...prev, secondaryColor: option.value }))}
                      aria-label={`Secondary color ${option.label}`}
                      title={option.label}
                    >
                      <span className="swatch-color" style={{ background: option.value }} />
                    </button>
                  ))}
                </div>
              </label>
              {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
              {successMessage ? <p className="form-success">{successMessage}</p> : null}
              <button className="btn btn-primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save storefront style'}
              </button>
            </form>

            <div className="panel">
              <h3>Live preview</h3>
              <article
                className={toneClass}
                style={
                  {
                    '--studio-primary': formState.primaryColor,
                    '--studio-secondary': formState.secondaryColor,
                    '--studio-banner': formState.shopBannerUrl
                      ? `url(${formState.shopBannerUrl})`
                      : 'none',
                  } as CSSProperties
                }
              >
                <div className="preview-banner" />
                <div className="preview-avatar-wrap">
                  {formState.shopAvatarUrl ? (
                    <img src={formState.shopAvatarUrl} alt="Shop avatar preview" className="preview-avatar-image" />
                  ) : (
                    <div className="preview-avatar-fallback">AV</div>
                  )}
                </div>
                <p className="eyebrow">Preview</p>
                <h4>{formState.heroHeadline}</h4>
                <div className="preview-color-row">
                  <span style={{ background: formState.primaryColor }} />
                  <span style={{ background: formState.secondaryColor }} />
                </div>
              </article>
            </div>
          </div>
        )}
      </section>
    </article>
  )
}
