import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useShop } from '../hooks/useShop'
import { updateShop, uploadStorefrontImage, upsertShop } from '../lib/craftlyApi'
import { toErrorMessage } from '../lib/errors'
import { normalizeSlug } from '../lib/slug'

type OnboardingStep = 1 | 2 | 3 | 4 | 5

const LAST_STEP: OnboardingStep = 5

export function OnboardingPage() {
  const location = useLocation()
  const { user } = useAuth()
  const { shop, isLoading: isLoadingShop, refreshShop } = useShop()

  const [step, setStep] = useState<OnboardingStep>(1)
  const [shopName, setShopName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [hasCompletedLocally, setHasCompletedLocally] = useState(false)

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('next') || '/dashboard/overview'
  }, [location.search])

  const stepDots = useMemo(
    () => Array.from({ length: LAST_STEP }, (_, index) => index + 1),
    [],
  )

  useEffect(() => {
    if (!shop) return
    setShopName(shop.name || '')
    setSlug(shop.slug || '')
    setDescription(shop.description || '')
    setBannerUrl(shop.shop_banner_url || '')
    if (shop.onboarding_completed && user) {
      localStorage.setItem(`craftly:onboarding-complete:${user.id}`, '1')
    }
  }, [shop, user])

  if (!user) {
    return <Navigate to="/join" replace />
  }

  if (hasCompletedLocally || (!isLoadingShop && shop?.onboarding_completed)) {
    return <Navigate to={nextPath} replace />
  }

  if (isLoadingShop) {
    return (
      <article className="page page-onboarding-flow">
        <section className="onboarding-shell">
          <p className="auth-state">Loading onboarding...</p>
        </section>
      </article>
    )
  }

  const goToNext = () => {
    setErrorMessage(null)
    setSuccessMessage(null)

    if (step === 2) {
      if (!shopName.trim()) {
        setErrorMessage('Shop name is required.')
        return
      }
      const cleanedSlug = normalizeSlug(slug)
      if (!cleanedSlug) {
        setErrorMessage('A valid shop slug is required.')
        return
      }
      setSlug(cleanedSlug)
    }

    if (step === 3 && !bannerUrl) {
      setErrorMessage('Please upload a banner before continuing.')
      return
    }

    if (step === 4 && !description.trim()) {
      setErrorMessage('Please add a short shop description.')
      return
    }

    if (step < LAST_STEP) {
      setStep((prev) => (prev + 1) as OnboardingStep)
    }
  }

  const goToPrevious = () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    if (step > 1) {
      setStep((prev) => (prev - 1) as OnboardingStep)
    }
  }

  const handleBannerFileChange = async (file: File | null) => {
    if (!user) return
    if (!file) {
      setBannerFile(null)
      return
    }
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsUploadingBanner(true)
    setBannerFile(file)
    try {
      const publicUrl = await uploadStorefrontImage({
        userId: user.id,
        kind: 'banner',
        file,
      })
      setBannerUrl(publicUrl)
      setSuccessMessage('Banner uploaded. You can continue.')
    } catch (error) {
      setBannerUrl('')
      setErrorMessage(toErrorMessage(error, 'Unable to upload banner right now.'))
    } finally {
      setIsUploadingBanner(false)
    }
  }

  const handleFinish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const cleanedSlug = normalizeSlug(slug)
    if (!shopName.trim() || !cleanedSlug || !description.trim() || !bannerUrl) {
      setErrorMessage('Complete all required fields before finishing onboarding.')
      return
    }

    setIsFinishing(true)
    try {
      const savedShop = await upsertShop(user, {
        name: shopName.trim(),
        slug: cleanedSlug,
        description: description.trim(),
        onboarding_completed: true,
      })
      await updateShop(savedShop.id, {
        shop_banner_url: bannerUrl,
        onboarding_completed: true,
      })
      localStorage.setItem(`craftly:onboarding-complete:${user.id}`, '1')
      setHasCompletedLocally(true)
      void refreshShop()
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Unable to complete onboarding right now.'))
    } finally {
      setIsFinishing(false)
    }
  }

  return (
    <article className="page page-onboarding-flow">
      <section className="onboarding-shell">
        <header className="onboarding-header">
          <p className="eyebrow">Onboarding</p>
          <h2>Set up your shop in a few quick steps</h2>
        </header>

        <form className="panel panel-form onboarding-form" onSubmit={handleFinish}>
          {step === 1 ? (
            <section className="onboarding-step">
              <h3>Welcome to Craftly</h3>
              <p>Create your shop, add products, and start collecting buyer requests from your public page.</p>
              <ul className="checklist">
                <li>Set your shop identity</li>
                <li>Upload your banner image</li>
                <li>Add a short shop description</li>
              </ul>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="onboarding-step">
              <h3>Shop identity</h3>
              <label>
                <span>Shop name</span>
                <input
                  type="text"
                  placeholder="Terra Clay Studio"
                  value={shopName}
                  onChange={(event) => setShopName(event.target.value)}
                />
              </label>
              <label>
                <span>Shop slug</span>
                <input
                  type="text"
                  placeholder="terra-clay-studio"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                />
                <small className="field-hint">Example: `bday-gifts-studio` (lowercase, use hyphens)</small>
              </label>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="onboarding-step">
              <h3>Upload your shop banner</h3>
              <p className="empty-state">Use a wide image that reflects your craft style.</p>
              <input
                className="input-hidden"
                id="onboarding-banner-upload"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null
                  void handleBannerFileChange(file)
                }}
              />
              <div className="media-upload-actions">
                <label className="btn btn-soft" htmlFor="onboarding-banner-upload">
                  {isUploadingBanner ? 'Uploading...' : 'Choose file'}
                </label>
              </div>
              <p className="media-upload-file">{bannerFile ? bannerFile.name : 'No file selected'}</p>
              {bannerUrl ? (
                <div className="onboarding-banner-preview">
                  <img src={bannerUrl} alt="Shop banner preview" />
                </div>
              ) : null}
              {bannerUrl ? <p className="form-success">Banner ready</p> : null}
            </section>
          ) : null}

          {step === 4 ? (
            <section className="onboarding-step">
              <h3>Describe your shop</h3>
              <label>
                <span>Short description</span>
                <textarea
                  rows={4}
                  placeholder="What do you craft and for whom?"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>
            </section>
          ) : null}

          {step === 5 ? (
            <section className="onboarding-step">
              <h3>You are ready to launch</h3>
              <p>After this, you will enter your dashboard. Next recommended action: add your first product listing.</p>
              <ul className="checklist">
                <li>Keep at least one product published for better conversion</li>
                <li>Use clear pricing hints and product photos</li>
                <li>Review buyer requests daily</li>
              </ul>
            </section>
          ) : null}

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          {successMessage ? <p className="form-success">{successMessage}</p> : null}

          <div className="onboarding-actions">
            <button
              className="btn btn-soft"
              type="button"
              onClick={goToPrevious}
              disabled={step === 1}
              aria-hidden={step === 1}
            >
              Previous
            </button>
            <div className="onboarding-step-dots" aria-label={`Step ${step} of ${LAST_STEP}`}>
              {stepDots.map((dot) => (
                <span
                  key={dot}
                  className={`onboarding-dot ${dot <= step ? 'active' : ''}`}
                  aria-hidden="true"
                />
              ))}
            </div>
            {step < LAST_STEP ? (
              <button className="btn btn-primary" type="button" onClick={goToNext}>
                Continue
              </button>
            ) : (
              <button className="btn btn-primary" type="submit" disabled={isFinishing}>
                {isFinishing ? 'Finishing...' : 'Go to dashboard'}
              </button>
            )}
          </div>
        </form>
      </section>
    </article>
  )
}
