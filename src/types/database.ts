export type ProductStatus = 'draft' | 'published'
export type CustomRequestStatus = 'new' | 'reviewed' | 'closed'

export type ShopRow = {
  id: string
  user_id: string
  slug: string
  name: string
  description: string | null
  hero_headline: string | null
  hero_subline: string | null
  trust_note: string | null
  featured_message: string | null
  storefront_tone: 'earthy' | 'minimal' | 'bold' | null
  shop_avatar_url: string | null
  shop_banner_url: string | null
  primary_color: string | null
  secondary_color: string | null
  onboarding_completed: boolean
  created_at: string
}

export type ProductRow = {
  id: string
  shop_id: string
  title: string
  description: string | null
  price_hint: string | null
  shipping_note: string | null
  support_note: string | null
  detail_points: string[]
  status: ProductStatus
  image_url: string | null
  image_urls: string[]
  thumbnail_index: number
  created_at: string
}

export type CustomRequestRow = {
  id: string
  shop_id: string
  buyer_name: string
  buyer_email: string
  occasion: string | null
  budget_range: string | null
  details: string
  status: CustomRequestStatus
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      shops: {
        Row: ShopRow
        Insert: {
          id?: string
          user_id: string
          slug: string
          name: string
          description?: string | null
          hero_headline?: string | null
          hero_subline?: string | null
          trust_note?: string | null
          featured_message?: string | null
          storefront_tone?: 'earthy' | 'minimal' | 'bold' | null
          shop_avatar_url?: string | null
          shop_banner_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          onboarding_completed?: boolean
          created_at?: string
        }
        Update: Partial<{
          slug: string
          name: string
          description: string | null
          hero_headline: string | null
          hero_subline: string | null
          trust_note: string | null
          featured_message: string | null
          storefront_tone: 'earthy' | 'minimal' | 'bold' | null
          shop_avatar_url: string | null
          shop_banner_url: string | null
          primary_color: string | null
          secondary_color: string | null
          onboarding_completed: boolean
        }>
        Relationships: []
      }
      products: {
        Row: ProductRow
        Insert: {
          id?: string
          shop_id: string
          title: string
          description?: string | null
          price_hint?: string | null
          shipping_note?: string | null
          support_note?: string | null
          detail_points?: string[]
          status?: ProductStatus
          image_url?: string | null
          image_urls?: string[]
          thumbnail_index?: number
          created_at?: string
        }
        Update: Partial<{
          title: string
          description: string | null
          price_hint: string | null
          shipping_note: string | null
          support_note: string | null
          detail_points: string[]
          status: ProductStatus
          image_url: string | null
          image_urls: string[]
          thumbnail_index: number
        }>
        Relationships: []
      }
      custom_requests: {
        Row: CustomRequestRow
        Insert: {
          id?: string
          shop_id: string
          buyer_name: string
          buyer_email: string
          occasion?: string | null
          budget_range?: string | null
          details: string
          status?: CustomRequestStatus
          created_at?: string
        }
        Update: Partial<{
          status: CustomRequestStatus
        }>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
