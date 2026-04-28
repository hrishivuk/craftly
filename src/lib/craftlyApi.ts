import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { ArtisanProfileRow, CustomRequestRow, ProductRow } from '../types/database'
import type { StorefrontStudioConfig } from './storefrontStudio'
import { toStorefrontStudioUpdatePayload } from './storefrontStudio'

export type ProfileInput = {
  slug: string
  display_name: string
  bio: string
  story: string
}

export type ProductInput = {
  title: string
  description: string
  price_hint: string
  status: 'draft' | 'published'
}

type StorefrontMediaKind = 'avatar' | 'banner'

const STOREFRONT_MEDIA_BUCKET = 'storefront-media'

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

export async function fetchProfileByUserId(userId: string): Promise<ArtisanProfileRow | null> {
  const { data, error } = await supabase
    .from('artisan_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function fetchPublicProfileBySlug(slug: string): Promise<ArtisanProfileRow | null> {
  const { data, error } = await supabase
    .from('artisan_profiles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertProfile(user: User, input: ProfileInput): Promise<ArtisanProfileRow> {
  const payload = {
    user_id: user.id,
    slug: input.slug,
    display_name: input.display_name,
    bio: input.bio || null,
    story: input.story || null,
  }

  const { data, error } = await supabase
    .from('artisan_profiles')
    .upsert(payload, {
      onConflict: 'user_id',
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function fetchProductsByArtisanId(artisanId: string): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('artisan_id', artisanId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createProduct(artisanId: string, input: ProductInput): Promise<ProductRow> {
  const payload = {
    artisan_id: artisanId,
    title: input.title,
    description: input.description || null,
    price_hint: input.price_hint || null,
    status: input.status,
  }

  const { data, error } = await supabase.from('products').insert(payload).select('*').single()

  if (error) throw error
  return data
}

export async function updateProduct(
  productId: string,
  input: ProductInput,
): Promise<ProductRow> {
  const payload = {
    title: input.title,
    description: input.description || null,
    price_hint: input.price_hint || null,
    status: input.status,
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
  artisan_id: string
  buyer_name: string
  buyer_email: string
  occasion: string
  budget_range: string
  details: string
}) {
  const payload = {
    artisan_id: params.artisan_id,
    buyer_name: params.buyer_name,
    buyer_email: params.buyer_email,
    occasion: params.occasion || null,
    budget_range: params.budget_range || null,
    details: params.details,
  }

  const { error } = await supabase.from('custom_requests').insert(payload)
  if (error) throw error
}

export async function fetchCustomRequestsByArtisanId(artisanId: string): Promise<CustomRequestRow[]> {
  const { data, error } = await supabase
    .from('custom_requests')
    .select('*')
    .eq('artisan_id', artisanId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function updateStorefrontStudioConfig(
  profileId: string,
  config: StorefrontStudioConfig,
): Promise<ArtisanProfileRow> {
  const { data, error } = await supabase
    .from('artisan_profiles')
    .update(toStorefrontStudioUpdatePayload(config))
    .eq('id', profileId)
    .select('*')
    .single()

  if (error) throw error
  return data
}
