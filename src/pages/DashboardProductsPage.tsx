import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardSectionHeader } from '../components/dashboard/DashboardSectionHeader'
import { useShop } from '../hooks/useShop'
import { fetchProductsByShopId } from '../lib/craftlyApi'
import { toErrorMessage } from '../lib/errors'
import { getOrderedProductImages, getProductThumbnail } from '../lib/productImages'
import type { ProductRow } from '../types/database'

export function DashboardProductsPage() {
  const { shop, isLoading: isShopLoading } = useShop()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!shop) {
      return
    }

    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const listing = await fetchProductsByShopId(shop.id)
        if (!isMounted) return

        setProducts(listing)
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(toErrorMessage(error, 'Failed to load products.'))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [shop])

  const pageLoading = isShopLoading || (Boolean(shop) && isLoading)

  if (pageLoading) {
    return (
      <article className="page page-admin-content">
        <section className="admin-main">
          <p className="auth-state">Loading products...</p>
        </section>
      </article>
    )
  }

  return (
    <article className="page page-admin-content">
      <section className="admin-main">
        <DashboardSectionHeader
          title="Products"
          description="Showcase your products and click one to edit details."
          actions={
            <Link className="btn btn-primary nav-link-btn" to="/dashboard/products/new">
              Add new product
            </Link>
          }
        />

        {!shop ? (
          <p className="empty-state">Complete onboarding first to manage products.</p>
        ) : errorMessage ? (
          <p className="form-error">{errorMessage}</p>
        ) : products.length === 0 ? (
          <p className="empty-state">No products yet. Add your first listing.</p>
        ) : (
          <div className="dashboard-products-grid">
            {products.map((product) => (
              <Link className="product-card product-card-v2 dashboard-product-card" key={product.id} to={`/dashboard/products/${product.id}`}>
                {getProductThumbnail(product) ? (
                  <img
                    src={getProductThumbnail(product) || ''}
                    alt={product.title}
                    className="product-media-image"
                  />
                ) : (
                  <div className="product-media">Image coming soon</div>
                )}
                <div className="product-meta">
                  <p>{product.title}</p>
                  <span>{product.price_hint || 'Price on request'}</span>
                  <small>
                    {product.status === 'published' ? 'Published' : 'Draft'} · {getOrderedProductImages(product).length} image(s)
                  </small>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </article>
  )
}
