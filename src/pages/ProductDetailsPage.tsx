import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPublishedProductBySlugAndId } from '../lib/craftlyApi'
import { getOrderedProductImages } from '../lib/productImages'
import type { ArtisanProfileRow, ProductRow } from '../types/database'

export function ProductDetailsPage() {
  const { slug, productId } = useParams()
  const [profile, setProfile] = useState<ArtisanProfileRow | null>(null)
  const [product, setProduct] = useState<ProductRow | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!slug || !productId) return

    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const result = await fetchPublishedProductBySlugAndId(slug, productId)
        if (!isMounted) return

        if (!result) {
          setErrorMessage('Product not found.')
          setProfile(null)
          setProduct(null)
          return
        }

        setProfile(result.profile)
        setProduct(result.product)
        setActiveIndex(Math.max(0, result.product.thumbnail_index || 0))
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load product details.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [productId, slug])

  const images = useMemo(() => (product ? getOrderedProductImages(product) : []), [product])
  const activeImage = images[activeIndex] || images[0] || null

  if (isLoading) {
    return (
      <article className="page page-buyer">
        <p className="auth-state">Loading product...</p>
      </article>
    )
  }

  if (errorMessage || !product || !profile) {
    return (
      <article className="page page-buyer">
        <p className="form-error">{errorMessage || 'Product unavailable.'}</p>
      </article>
    )
  }

  return (
    <article className="page page-buyer product-detail-page">
      <Link className="btn btn-soft product-detail-back" to={`/a/${slug}`}>
        Back to shop
      </Link>

      <section className="product-detail-grid">
        <div className="product-detail-gallery">
          {activeImage ? (
            <img className="product-detail-main-image" src={activeImage} alt={product.title} />
          ) : (
            <div className="product-detail-main-image product-detail-placeholder">Image coming soon</div>
          )}
          {images.length > 1 ? (
            <div className="product-detail-thumbs">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={`product-detail-thumb ${activeIndex === index ? 'active' : ''}`}
                  onClick={() => setActiveIndex(index)}
                >
                  <img src={image} alt={`${product.title} ${index + 1}`} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="product-detail-meta">
          <p className="eyebrow">{profile.display_name}</p>
          <h1>{product.title}</h1>
          <p className="product-detail-price">{product.price_hint || 'Price on request'}</p>
          <p>{product.description || 'Handcrafted with care. Contact artisan for customizations and availability.'}</p>
          <Link className="btn btn-primary" to={`/a/${slug}#request-form`}>
            Contact artisan
          </Link>
        </div>
      </section>
    </article>
  )
}
