import type { Area } from 'react-easy-crop'
import Cropper from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DashboardSectionHeader } from '../components/dashboard/DashboardSectionHeader'
import { useShop } from '../hooks/useShop'
import { trackEvent } from '../lib/analytics'
import {
  createProduct,
  deleteProduct,
  fetchProductByIdForShop,
  updateProduct,
  uploadProductImage,
} from '../lib/craftlyApi'
import { toErrorMessage } from '../lib/errors'
import { getCroppedImageBlob } from '../lib/imageCrop'
import { getOrderedProductImages } from '../lib/productImages'

type ProductFormState = {
  title: string
  priceHint: string
  description: string
  shippingNote: string
  supportNote: string
  detailPointsText: string
  saveAsDraft: boolean
}

const emptyForm: ProductFormState = {
  title: '',
  priceHint: '',
  description: '',
  shippingNote: '',
  supportNote: '',
  detailPointsText: '',
  saveAsDraft: false,
}

type ProductImageItem = {
  id: string
  url: string
}

export function DashboardProductEditorPage() {
  const navigate = useNavigate()
  const { productId } = useParams()
  const isCreateMode = !productId || productId === 'new'
  const { shop, isLoading: isShopLoading } = useShop()
  const [formState, setFormState] = useState<ProductFormState>(emptyForm)
  const [productImages, setProductImages] = useState<ProductImageItem[]>([])
  const [thumbnailImageId, setThumbnailImageId] = useState<string | null>(null)
  const [imageInputKey, setImageInputKey] = useState(0)
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null)
  const [cropQueue, setCropQueue] = useState<File[]>([])
  const [activeCropFile, setActiveCropFile] = useState<File | null>(null)
  const [activeCropUrl, setActiveCropUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!shop || isCreateMode || !productId) return

    let isMounted = true
    const load = async () => {
      setIsLoadingProduct(true)
      setErrorMessage(null)
      try {
        const product = await fetchProductByIdForShop(shop.id, productId)
        if (!isMounted) return
        if (!product) {
          setErrorMessage('Product not found.')
          return
        }

        setFormState({
          title: product.title,
          description: product.description ?? '',
          priceHint: product.price_hint ?? '',
          shippingNote: product.shipping_note ?? '',
          supportNote: product.support_note ?? '',
          detailPointsText: (product.detail_points || []).join('\n'),
          saveAsDraft: product.status === 'draft',
        })
        const orderedImages = getOrderedProductImages(product)
        const mapped = orderedImages.map((url, index) => ({
          id: `${product.id}-${index}`,
          url,
        }))
        setProductImages(mapped)
        const thumbnail = mapped[Math.max(0, product.thumbnail_index)] || mapped[0] || null
        setThumbnailImageId(thumbnail?.id ?? null)
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(toErrorMessage(error, 'Failed to load product.'))
      } finally {
        if (isMounted) setIsLoadingProduct(false)
      }
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [isCreateMode, productId, shop])

  useEffect(() => {
    if (activeCropFile || cropQueue.length === 0) return
    const timeoutId = window.setTimeout(() => {
      const nextFile = cropQueue[0]
      const objectUrl = URL.createObjectURL(nextFile)
      setActiveCropFile(nextFile)
      setActiveCropUrl(objectUrl)
      setCropQueue((prev) => prev.slice(1))
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [activeCropFile, cropQueue])

  const actionLabel = useMemo(
    () => (isCreateMode ? 'Save product' : 'Update product'),
    [isCreateMode],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    if (!shop) {
      setErrorMessage('Shop setup is required before adding products.')
      return
    }

    if (!formState.title.trim()) {
      setErrorMessage('Product title is required.')
      return
    }

    if (productImages.length < 1) {
      setErrorMessage('Add at least one product image.')
      return
    }

    if (productImages.length > 5) {
      setErrorMessage('You can upload a maximum of 5 product images.')
      return
    }

    const thumbnailIndex = Math.max(
      0,
      productImages.findIndex((image) => image.id === thumbnailImageId),
    )
    const status = formState.saveAsDraft ? 'draft' : 'published'
    const detailPoints = formState.detailPointsText
      .split('\n')
      .map((point) => point.trim())
      .filter(Boolean)

    setIsSaving(true)
    try {
      if (isCreateMode) {
        await createProduct(shop.id, {
          title: formState.title.trim(),
          description: formState.description.trim(),
          price_hint: formState.priceHint.trim(),
          shipping_note: formState.shippingNote.trim(),
          support_note: formState.supportNote.trim(),
          detail_points: detailPoints,
          status,
          image_urls: productImages.map((image) => image.url),
          thumbnail_index: thumbnailIndex,
        })
      } else if (productId) {
        await updateProduct(productId, {
          title: formState.title.trim(),
          description: formState.description.trim(),
          price_hint: formState.priceHint.trim(),
          shipping_note: formState.shippingNote.trim(),
          support_note: formState.supportNote.trim(),
          detail_points: detailPoints,
          status,
          image_urls: productImages.map((image) => image.url),
          thumbnail_index: thumbnailIndex,
        })
      }

      trackEvent('product_saved', {
        mode: isCreateMode ? 'create' : 'edit',
        status,
      })
      if (status === 'published') {
        trackEvent('product_published', { mode: isCreateMode ? 'create' : 'edit' })
      }

      navigate('/dashboard/products')
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to save product.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!productId || isCreateMode) return
    setErrorMessage(null)
    try {
      await deleteProduct(productId)
      navigate('/dashboard/products')
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to delete product.'))
    }
  }

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const availableSlots = 5 - productImages.length - cropQueue.length - (activeCropFile ? 1 : 0)
    if (availableSlots <= 0) {
      setErrorMessage('Maximum 5 images allowed.')
      setImageInputKey((prev) => prev + 1)
      return
    }

    const acceptedFiles = files.slice(0, availableSlots)
    if (files.length > acceptedFiles.length) {
      setErrorMessage('Only the first 5 images were queued.')
    } else {
      setErrorMessage(null)
    }

    setCropQueue((prev) => [...prev, ...acceptedFiles])
    setImageInputKey((prev) => prev + 1)
  }

  const handleCropCancel = () => {
    if (activeCropUrl) URL.revokeObjectURL(activeCropUrl)
    setActiveCropFile(null)
    setActiveCropUrl(null)
    setCroppedAreaPixels(null)
  }

  const handleCropComplete = async () => {
    if (!shop || !activeCropFile || !activeCropUrl || !croppedAreaPixels) return

    setIsUploadingImage(true)
    try {
      const croppedBlob = await getCroppedImageBlob(activeCropUrl, croppedAreaPixels, 'image/jpeg')
      const croppedFile = new File([croppedBlob], `cropped-${activeCropFile.name}`, { type: 'image/jpeg' })
      const uploadedUrl = await uploadProductImage({ userId: shop.user_id, file: croppedFile })
      const nextImage: ProductImageItem = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        url: uploadedUrl,
      }

      setProductImages((prev) => [...prev, nextImage])
      setThumbnailImageId((prev) => prev || nextImage.id)
      setErrorMessage(null)
      if (activeCropUrl) URL.revokeObjectURL(activeCropUrl)
      setActiveCropFile(null)
      setActiveCropUrl(null)
      setCroppedAreaPixels(null)
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to crop and upload image.'))
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleImageDrop = (targetImageId: string) => {
    if (!draggingImageId || draggingImageId === targetImageId) return
    setProductImages((prev) => {
      const sourceIndex = prev.findIndex((item) => item.id === draggingImageId)
      const targetIndex = prev.findIndex((item) => item.id === targetImageId)
      if (sourceIndex < 0 || targetIndex < 0) return prev
      const next = [...prev]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    setDraggingImageId(null)
  }

  const handleRemoveImage = (imageId: string) => {
    setProductImages((prev) => {
      const next = prev.filter((image) => image.id !== imageId)
      if (thumbnailImageId === imageId) {
        setThumbnailImageId(next[0]?.id ?? null)
      }
      return next
    })
  }

  if (isShopLoading || isLoadingProduct) {
    return (
      <article className="page page-admin-content">
        <section className="admin-main">
          <p className="auth-state">Loading product editor...</p>
        </section>
      </article>
    )
  }

  return (
    <article className="page page-admin-content">
      <section className="admin-main">
        <DashboardSectionHeader
          title={isCreateMode ? 'Add new product' : 'Edit product'}
          description="Start with title, price hint, and one image. You can fine-tune visuals later."
          actions={
            <button className="btn btn-soft" type="button" onClick={() => navigate('/dashboard/products')}>
              Back to products
            </button>
          }
        />

        <form className="panel panel-form" onSubmit={handleSubmit}>
          <p className="empty-state">Quick start: add details, one clear image, then publish.</p>
          <input
            type="text"
            placeholder="Product title"
            value={formState.title}
            onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
          />
          <input
            type="text"
            placeholder="Price hint (e.g. From INR 1200)"
            value={formState.priceHint}
            onChange={(event) => setFormState((prev) => ({ ...prev, priceHint: event.target.value }))}
          />
          <textarea
            placeholder="Description"
            rows={4}
            value={formState.description}
            onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
          ></textarea>
          <input
            type="text"
            placeholder="Shipping note (e.g. Ships in 3 to 5 days)"
            value={formState.shippingNote}
            onChange={(event) => setFormState((prev) => ({ ...prev, shippingNote: event.target.value }))}
          />
          <input
            type="text"
            placeholder="Support note (e.g. DM on Instagram for queries)"
            value={formState.supportNote}
            onChange={(event) => setFormState((prev) => ({ ...prev, supportNote: event.target.value }))}
          />
          <textarea
            placeholder="Options / highlights (one per line, e.g. violet)"
            rows={4}
            value={formState.detailPointsText}
            onChange={(event) => setFormState((prev) => ({ ...prev, detailPointsText: event.target.value }))}
          ></textarea>

          <label>
            <span>Product images (min 1, max 5)</span>
            <input
              key={imageInputKey}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              disabled={!shop || isUploadingImage}
            />
          </label>
          <p className="empty-state">Need only the basics? Upload one image and save.</p>

          <details>
            <summary>Advanced image options (reorder and choose thumbnail)</summary>
            <p className="empty-state">Drag cards to reorder and choose one thumbnail for your shop cover.</p>
            <div className="product-images-grid">
              {productImages.map((image) => (
                <article
                  key={image.id}
                  className="product-image-card"
                  draggable
                  onDragStart={() => setDraggingImageId(image.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleImageDrop(image.id)}
                >
                  <img src={image.url} alt="Product upload" />
                  <div className="product-image-actions">
                    <label>
                      <input
                        type="radio"
                        name="product-thumbnail"
                        checked={thumbnailImageId === image.id}
                        onChange={() => setThumbnailImageId(image.id)}
                      />
                      Thumbnail
                    </label>
                    <button className="btn btn-soft" type="button" onClick={() => handleRemoveImage(image.id)}>
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </details>

          <label className="draft-toggle-row">
            <input
              type="checkbox"
              checked={formState.saveAsDraft}
              onChange={(event) => setFormState((prev) => ({ ...prev, saveAsDraft: event.target.checked }))}
            />
            <span>Save as draft (leave unchecked to publish)</span>
          </label>

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

          <div className="inline-actions">
            <button className="btn btn-primary" type="submit" disabled={isSaving || !shop}>
              {isSaving ? 'Saving...' : actionLabel}
            </button>
            {!isCreateMode ? (
              <button className="btn btn-soft" type="button" onClick={handleDelete}>
                Delete product
              </button>
            ) : null}
          </div>
        </form>

        {activeCropUrl ? (
          <div className="crop-modal-backdrop">
            <div className="crop-modal">
              <div className="cropper-stage">
                <Cropper
                  image={activeCropUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                />
              </div>
              <label>
                <span>Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                />
              </label>
              <div className="inline-actions">
                <button className="btn btn-soft" type="button" onClick={handleCropCancel} disabled={isUploadingImage}>
                  Skip image
                </button>
                <button className="btn btn-primary" type="button" onClick={handleCropComplete} disabled={isUploadingImage}>
                  {isUploadingImage ? 'Uploading...' : 'Crop & upload'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </article>
  )
}
