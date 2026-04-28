import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { DashboardSectionHeader } from '../components/dashboard/DashboardSectionHeader'
import { useArtisanProfile } from '../hooks/useArtisanProfile'
import { trackEvent } from '../lib/analytics'
import {
  createProduct,
  deleteProduct,
  fetchProductsByArtisanId,
  updateProduct,
} from '../lib/craftlyApi'
import { toErrorMessage } from '../lib/errors'
import type { ProductRow, ProductStatus } from '../types/database'

type ProductFormState = {
  title: string
  priceHint: string
  description: string
  status: ProductStatus
}

const emptyForm: ProductFormState = {
  title: '',
  priceHint: '',
  description: '',
  status: 'draft',
}

export function DashboardProductsPage() {
  const { profile, isLoading: isProfileLoading } = useArtisanProfile()
  const [products, setProducts] = useState<ProductRow[]>([])
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [formState, setFormState] = useState<ProductFormState>(emptyForm)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) {
      return
    }

    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const listing = await fetchProductsByArtisanId(profile.id)
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
  }, [profile])

  const actionLabel = useMemo(
    () => (editingProductId ? 'Update product' : 'Save product'),
    [editingProductId],
  )

  const resetForm = () => {
    setEditingProductId(null)
    setFormState(emptyForm)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    if (!profile) {
      setErrorMessage('Profile is required before adding products.')
      return
    }

    if (!formState.title.trim()) {
      setErrorMessage('Product title is required.')
      return
    }

    setIsSaving(true)
    try {
      if (editingProductId) {
        const updated = await updateProduct(editingProductId, {
          title: formState.title.trim(),
          description: formState.description.trim(),
          price_hint: formState.priceHint.trim(),
          status: formState.status,
        })

        setProducts((prev) => prev.map((item) => (item.id === editingProductId ? updated : item)))
        trackEvent('product_saved', {
          mode: 'edit',
          status: formState.status,
        })
      } else {
        const created = await createProduct(profile.id, {
          title: formState.title.trim(),
          description: formState.description.trim(),
          price_hint: formState.priceHint.trim(),
          status: formState.status,
        })
        setProducts((prev) => [created, ...prev])
        trackEvent('product_saved', {
          mode: 'create',
          status: formState.status,
        })
      }

      if (formState.status === 'published') {
        trackEvent('product_published', {
          mode: editingProductId ? 'edit' : 'create',
        })
      }

      resetForm()
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to save product.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (product: ProductRow) => {
    setEditingProductId(product.id)
    setFormState({
      title: product.title,
      description: product.description ?? '',
      priceHint: product.price_hint ?? '',
      status: product.status,
    })
  }

  const handleDelete = async (productId: string) => {
    setErrorMessage(null)
    try {
      await deleteProduct(productId)
      setProducts((prev) => prev.filter((item) => item.id !== productId))
      if (editingProductId === productId) resetForm()
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Failed to delete product.'))
    }
  }

  const pageLoading = isProfileLoading || (Boolean(profile) && isLoading)

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
          description="Manage listings that make first-look decisions easier for buyers."
          actions={
            editingProductId ? (
              <button className="btn btn-soft" onClick={resetForm} type="button">
                Cancel edit
              </button>
            ) : null
          }
        />

        <div className="admin-content-grid">
          <div className="panel">
            <h3>Your listings</h3>
            {!profile ? (
              <p className="empty-state">Create your profile first to manage products.</p>
            ) : products.length === 0 ? (
              <p className="empty-state">No products yet. Add your first listing.</p>
            ) : (
              <div className="rows">
                {products.map((product) => (
                  <div className="row-actions" key={product.id}>
                    <p>
                      {product.title} · {product.price_hint || 'Price on request'} ·{' '}
                      {product.status === 'published' ? 'Published' : 'Draft'}
                    </p>
                    <div className="inline-actions">
                      <button className="btn btn-soft" onClick={() => handleEdit(product)} type="button">
                        Edit
                      </button>
                      <button
                        className="btn btn-soft"
                        onClick={() => handleDelete(product.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form className="panel panel-form" onSubmit={handleSubmit}>
            <h3>{editingProductId ? 'Edit product' : 'Add new product'}</h3>
            <input
              type="text"
              placeholder="Product title"
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
            />
            <input
              type="text"
              placeholder="Price hint (e.g. From $45)"
              value={formState.priceHint}
              onChange={(event) => setFormState((prev) => ({ ...prev, priceHint: event.target.value }))}
            />
            <textarea
              placeholder="Description"
              rows={4}
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, description: event.target.value }))
              }
            ></textarea>
            <label>
              <span>Status</span>
              <select
                value={formState.status}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    status: event.target.value as ProductStatus,
                  }))
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
            <button className="btn btn-primary" type="submit" disabled={isSaving || !profile}>
              {isSaving ? 'Saving...' : actionLabel}
            </button>
          </form>
        </div>
      </section>
    </article>
  )
}
