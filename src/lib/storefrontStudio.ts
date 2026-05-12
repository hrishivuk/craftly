import type { ShopRow } from '../types/database'

export type StorefrontThemeTone = 'earthy' | 'minimal' | 'bold'

export type StorefrontThemeOption = {
  tone: StorefrontThemeTone
  label: string
  description: string
  primaryColor: string
  secondaryColor: string
}

export const storefrontThemeOptions: StorefrontThemeOption[] = [
  {
    tone: 'earthy',
    label: 'Warm Craft',
    description: 'Classic handcrafted look with warm tones.',
    primaryColor: '#CFA98C',
    secondaryColor: '#D3E4D8',
  },
  {
    tone: 'minimal',
    label: 'Soft Minimal',
    description: 'Clean layout with airy spacing and subtle contrast.',
    primaryColor: '#9CB4C4',
    secondaryColor: '#E3EBF1',
  },
  {
    tone: 'bold',
    label: 'Bold Studio',
    description: 'High-impact cards and stronger visual hierarchy.',
    primaryColor: '#C9867A',
    secondaryColor: '#F2DED8',
  },
]

export type StorefrontStudioConfig = {
  heroHeadline: string
  heroSubline: string
  trustNote: string
  featuredMessage: string
  tone: StorefrontThemeTone
  shopBannerUrl: string
  primaryColor: string
  secondaryColor: string
}

function getThemeOption(tone: StorefrontThemeTone): StorefrontThemeOption {
  return storefrontThemeOptions.find((option) => option.tone === tone) || storefrontThemeOptions[0]
}

export const defaultStorefrontStudioConfig: StorefrontStudioConfig = {
  heroHeadline: 'Handmade with heart and intention.',
  heroSubline: 'Invite buyers into your process with clear story and context.',
  trustNote: 'Custom requests accepted. Response in 24-48 hours.',
  featuredMessage: 'Most loved by buyers this month',
  tone: 'earthy',
  shopBannerUrl: '',
  primaryColor: getThemeOption('earthy').primaryColor,
  secondaryColor: getThemeOption('earthy').secondaryColor,
}

export function getStorefrontStudioConfigFromShop(
  shop: ShopRow | null,
): StorefrontStudioConfig {
  if (!shop) return defaultStorefrontStudioConfig
  const tone = (shop.storefront_tone as StorefrontThemeTone | null) || defaultStorefrontStudioConfig.tone
  const preset = getThemeOption(tone)

  return {
    heroHeadline: shop.hero_headline || defaultStorefrontStudioConfig.heroHeadline,
    heroSubline: shop.hero_subline || defaultStorefrontStudioConfig.heroSubline,
    trustNote: shop.trust_note || defaultStorefrontStudioConfig.trustNote,
    featuredMessage: shop.featured_message || defaultStorefrontStudioConfig.featuredMessage,
    tone,
    shopBannerUrl: shop.shop_banner_url || defaultStorefrontStudioConfig.shopBannerUrl,
    primaryColor: preset.primaryColor,
    secondaryColor: preset.secondaryColor,
  }
}

export function toStorefrontStudioUpdatePayload(config: StorefrontStudioConfig) {
  const preset = getThemeOption(config.tone)
  return {
    hero_headline: config.heroHeadline,
    hero_subline: config.heroSubline,
    trust_note: config.trustNote,
    featured_message: config.featuredMessage,
    storefront_tone: config.tone,
    shop_avatar_url: null,
    shop_banner_url: config.shopBannerUrl || null,
    primary_color: preset.primaryColor,
    secondary_color: preset.secondaryColor,
  }
}
