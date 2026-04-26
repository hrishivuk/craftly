import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { ArtisanProfileRow, ProductRow } from '../types/database'

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
