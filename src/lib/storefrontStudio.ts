import type { ArtisanProfileRow } from '../types/database'

export type StorefrontStudioConfig = {
  heroHeadline: string
  heroSubline: string
  trustNote: string
  featuredMessage: string
  tone: 'earthy' | 'minimal' | 'bold'
  shopAvatarUrl: string
  shopBannerUrl: string
  primaryColor: string
  secondaryColor: string
}

export const pastelColorOptions = [
  { label: 'Rose Blush', value: '#E8B9B2' },
  { label: 'Peach Mist', value: '#F1C6A8' },
  { label: 'Butter Cream', value: '#F2DFA3' },
  { label: 'Sage Soft', value: '#BCD2BE' },
  { label: 'Mint Cloud', value: '#BEE0D7' },
  { label: 'Sky Dust', value: '#BFD6E8' },
  { label: 'Lavender Haze', value: '#CFBEEA' },
  { label: 'Sandstone', value: '#D7C2AE' },
] as const

export const defaultStorefrontStudioConfig: StorefrontStudioConfig = {
  heroHeadline: 'Handmade with heart and intention.',
  heroSubline: 'Invite buyers into your process with clear story and context.',
  trustNote: 'Custom requests accepted. Response in 24-48 hours.',
  featuredMessage: 'Most loved by buyers this month',
  tone: 'earthy',
  shopAvatarUrl: '',
  shopBannerUrl: '',
  primaryColor: '#E8B9B2',
  secondaryColor: '#BCD2BE',
}

export function getStorefrontStudioConfigFromProfile(
  profile: ArtisanProfileRow | null,
): StorefrontStudioConfig {
  if (!profile) return defaultStorefrontStudioConfig

  return {
    heroHeadline: profile.hero_headline || defaultStorefrontStudioConfig.heroHeadline,
    heroSubline: profile.hero_subline || defaultStorefrontStudioConfig.heroSubline,
    trustNote: profile.trust_note || defaultStorefrontStudioConfig.trustNote,
    featuredMessage: profile.featured_message || defaultStorefrontStudioConfig.featuredMessage,
    tone: profile.storefront_tone || defaultStorefrontStudioConfig.tone,
    shopAvatarUrl: profile.shop_avatar_url || defaultStorefrontStudioConfig.shopAvatarUrl,
    shopBannerUrl: profile.shop_banner_url || defaultStorefrontStudioConfig.shopBannerUrl,
    primaryColor: profile.primary_color || defaultStorefrontStudioConfig.primaryColor,
    secondaryColor: profile.secondary_color || defaultStorefrontStudioConfig.secondaryColor,
  }
}

export function toStorefrontStudioUpdatePayload(config: StorefrontStudioConfig) {
  return {
    hero_headline: config.heroHeadline,
    hero_subline: config.heroSubline,
    trust_note: config.trustNote,
    featured_message: config.featuredMessage,
    storefront_tone: config.tone,
    shop_avatar_url: config.shopAvatarUrl || null,
    shop_banner_url: config.shopBannerUrl || null,
    primary_color: config.primaryColor,
    secondary_color: config.secondaryColor,
  }
}
