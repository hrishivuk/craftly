import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProductsByShopId, fetchPublicShopBySlug } from '../lib/craftlyApi'
import { getProductThumbnail } from '../lib/productImages'
import { getStorefrontStudioConfigFromShop } from '../lib/storefrontStudio'
import type { ProductRow, ShopRow } from '../types/database'

export function ArtisanShopPage() {
  const { slug } = useParams()
  const [shop, setShop] = useState<ShopRow | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fallbackName = useMemo(() => {
    if (!slug) return 'Terra Studio'
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }, [slug])
  const storefrontConfig = useMemo(() => {
    return getStorefrontStudioConfigFromShop(shop)
  }, [shop])
  const activeTheme = storefrontConfig.tone

  useEffect(() => {
    if (!slug) return

    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const loadedShop = await fetchPublicShopBySlug(slug)
        if (!loadedShop) {
          if (isMounted) {
            setShop(null)
            setProducts([])
            setErrorMessage('This shop does not exist yet.')
          }
          return
        }

        const listing = await fetchProductsByShopId(loadedShop.id)
        if (!isMounted) return

        setShop(loadedShop)
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

  if (isLoading) {
    return (
      <article className="page page-buyer">
        <p className="auth-state">Loading shop...</p>
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
        <p className="form-error">Shop not found.</p>
      </article>
    )
  }

  const studioName = shop?.name || fallbackName

  const shopThemeStyle = {
    '--shop-primary': storefrontConfig.primaryColor,
    '--shop-secondary': storefrontConfig.secondaryColor,
  } as CSSProperties

  return (
    <article
      className={`page page-buyer page-shop-rework shop-page-tone-${storefrontConfig.tone} shop-v3-shell shop-theme-${activeTheme}`}
      style={shopThemeStyle}
    >
      <section className={`shop-v3-hero shop-tone-${storefrontConfig.tone}`}>
        <div className="shop-v3-hero-top">
          <div
            className="shop-v3-banner"
            style={{
              backgroundImage: storefrontConfig.shopBannerUrl
                ? `linear-gradient(125deg, rgba(23, 18, 14, 0.62), rgba(23, 18, 14, 0.28)), url(${storefrontConfig.shopBannerUrl})`
                : undefined,
            }}
          >
            <div className="shop-v3-identity">
              <h2>{studioName}</h2>
              <p className="shop-v3-headline">{storefrontConfig.heroHeadline}</p>
            </div>
          </div>
        </div>
        <div className="shop-v3-meta-row">
          <p>{shop?.description || 'Handcrafted work rooted in emotion, memory, and meaningful gifting.'}</p>
        </div>
      </section>

      <section className="catalog catalog-v2 shop-v3-products">
        <h3 className="shop-products-heading">Products</h3>
        <div className={`product-grid product-grid-theme-${activeTheme}`}>
          {products.length === 0 ? (
            <p className="empty-state">This shop has no published products yet.</p>
          ) : (
            products.map((product) => (
              <Link
                className={`product-card product-card-v2 shop-v3-product-card product-card-link shop-card-theme-${activeTheme}`}
                key={product.id}
                to={`/a/${slug}/p/${product.id}`}
              >
                <div className="shop-card-media-wrap">
                  {getProductThumbnail(product) ? (
                    <img className="product-media-image" src={getProductThumbnail(product) || ''} alt={product.title} />
                  ) : (
                    <div className="product-media shop-v3-product-media">Image coming soon</div>
                  )}
                </div>
                <div className="product-meta">
                  <p>{product.title}</p>
                  <span>{product.price_hint || 'Price on request'}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </article>
  )
}
