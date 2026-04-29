import type { ProductRow } from '../types/database'

export function getOrderedProductImages(product: ProductRow): string[] {
  if (product.image_urls && product.image_urls.length > 0) {
    return product.image_urls
  }

  if (product.image_url) {
    return [product.image_url]
  }

  return []
}

export function getProductThumbnail(product: ProductRow): string | null {
  const images = getOrderedProductImages(product)
  if (images.length === 0) return null

  const index = Math.min(Math.max(product.thumbnail_index || 0, 0), images.length - 1)
  return images[index] || images[0]
}
