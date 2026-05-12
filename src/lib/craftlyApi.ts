import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { CustomRequestRow, ProductRow, ShopRow } from '../types/database'
import type { StorefrontStudioConfig } from './storefrontStudio'
import { toStorefrontStudioUpdatePayload } from './storefrontStudio'

export type ShopInput = {
  slug: string
  name: string
  description: string
  onboarding_completed?: boolean
}

export type ProductInput = {
  title: string
  description: string
  price_hint: string
  shipping_note: string
  support_note: string
  detail_points: string[]
  status: 'draft' | 'published'
  image_urls: string[]
  thumbnail_index: number
}

type StorefrontMediaKind = 'banner'

const STOREFRONT_MEDIA_BUCKET = 'storefront-media'
const PRODUCT_MEDIA_BUCKET = 'product-media'

function getFileExtension(fileName: string) {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.at(-1)?.toLowerCase() || 'jpg' : 'jpg'
}

export async function uploadStorefrontImage(params: {
  userId: string
  kind: StorefrontMediaKind
  file: File
}): Promise<string> {
  const extension = getFileExtension(params.file.name)
  const objectPath = `${params.userId}/${params.kind}-${Date.now()}.${extension}`

  const { error: uploadError } = await supabase
    .storage
    .from(STOREFRONT_MEDIA_BUCKET)
    .upload(objectPath, params.file, { upsert: true })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(STOREFRONT_MEDIA_BUCKET).getPublicUrl(objectPath)
  return data.publicUrl
}

export async function uploadProductImage(params: {
  userId: string
  file: File
}): Promise<string> {
  const extension = getFileExtension(params.file.name)
  const objectPath = `${params.userId}/gallery-${Date.now()}.${extension}`

  const { error: uploadError } = await supabase
    .storage
    .from(PRODUCT_MEDIA_BUCKET)
    .upload(objectPath, params.file, { upsert: true })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(PRODUCT_MEDIA_BUCKET).getPublicUrl(objectPath)
  return data.publicUrl
}

export async function fetchShopByUserId(userId: string): Promise<ShopRow | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function fetchPublicShopBySlug(slug: string): Promise<ShopRow | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertShop(user: User, input: ShopInput): Promise<ShopRow> {
  const payload = {
    user_id: user.id,
    slug: input.slug,
    name: input.name,
    description: input.description || null,
    onboarding_completed: Boolean(input.onboarding_completed),
  }

  const { data, error } = await supabase
    .from('shops')
    .upsert(payload, {
      onConflict: 'user_id',
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function fetchProductsByShopId(shopId: string): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchProductByIdForShop(
  shopId: string,
  productId: string,
): Promise<ProductRow | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('shop_id', shopId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createProduct(shopId: string, input: ProductInput): Promise<ProductRow> {
  const thumbnailUrl = input.image_urls[input.thumbnail_index] || input.image_urls[0] || null
  const payload = {
    shop_id: shopId,
    title: input.title,
    description: input.description || null,
    price_hint: input.price_hint || null,
    shipping_note: input.shipping_note || null,
    support_note: input.support_note || null,
    detail_points: input.detail_points,
    status: input.status,
    image_url: thumbnailUrl,
    image_urls: input.image_urls,
    thumbnail_index: input.thumbnail_index,
  }

  const { data, error } = await supabase.from('products').insert(payload).select('*').single()

  if (error) throw error
  return data
}

export async function updateProduct(
  productId: string,
  input: ProductInput,
): Promise<ProductRow> {
  const thumbnailUrl = input.image_urls[input.thumbnail_index] || input.image_urls[0] || null
  const payload = {
    title: input.title,
    description: input.description || null,
    price_hint: input.price_hint || null,
    shipping_note: input.shipping_note || null,
    support_note: input.support_note || null,
    detail_points: input.detail_points,
    status: input.status,
    image_url: thumbnailUrl,
    image_urls: input.image_urls,
    thumbnail_index: input.thumbnail_index,
  }

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) throw error
}

export async function createCustomRequest(params: {
  shop_id: string
  buyer_name: string
  buyer_email: string
  occasion: string
  budget_range: string
  details: string
}) {
  const payload = {
    shop_id: params.shop_id,
    buyer_name: params.buyer_name,
    buyer_email: params.buyer_email,
    occasion: params.occasion || null,
    budget_range: params.budget_range || null,
    details: params.details,
  }

  const { error } = await supabase.from('custom_requests').insert(payload)
  if (error) throw error
}

export async function fetchCustomRequestsByShopId(shopId: string): Promise<CustomRequestRow[]> {
  const { data, error } = await supabase
    .from('custom_requests')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function updateCustomRequestStatus(
  requestId: string,
  status: CustomRequestRow['status'],
): Promise<CustomRequestRow> {
  const { data, error } = await supabase
    .from('custom_requests')
    .update({ status })
    .eq('id', requestId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function fetchPublishedProductBySlugAndId(
  slug: string,
  productId: string,
): Promise<{ shop: ShopRow; product: ProductRow } | null> {
  const shop = await fetchPublicShopBySlug(slug)
  if (!shop) return null

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('shop_id', shop.id)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return { shop, product: data }
}

export async function updateStorefrontStudioConfig(
  shopId: string,
  config: StorefrontStudioConfig,
): Promise<ShopRow> {
  const { data, error } = await supabase
    .from('shops')
    .update(toStorefrontStudioUpdatePayload(config))
    .eq('id', shopId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateShop(
  shopId: string,
  updates: Partial<{
    slug: string
    name: string
    description: string | null
    onboarding_completed: boolean
    shop_banner_url: string | null
    shop_avatar_url: string | null
    hero_headline: string | null
  }>,
): Promise<ShopRow> {
  const { data, error } = await supabase
    .from('shops')
    .update(updates)
    .eq('id', shopId)
    .select('*')
    .single()

  if (error) throw error
  return data
}
