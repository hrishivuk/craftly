export type ProductStatus = 'draft' | 'published'
export type CustomRequestStatus = 'new' | 'reviewed' | 'closed'

export type ArtisanProfileRow = {
  id: string
  user_id: string
  slug: string
  display_name: string
  bio: string | null
  story: string | null
  avatar_url: string | null
  hero_headline: string | null
  hero_subline: string | null
  trust_note: string | null
  featured_message: string | null
  storefront_tone: 'earthy' | 'minimal' | 'bold' | null
  shop_avatar_url: string | null
  shop_banner_url: string | null
  primary_color: string | null
  secondary_color: string | null
  created_at: string
}

export type ProductRow = {
  id: string
  artisan_id: string
  title: string
  description: string | null
  price_hint: string | null
  status: ProductStatus
  image_url: string | null
  created_at: string
}

export type CustomRequestRow = {
  id: string
  artisan_id: string
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
      artisan_profiles: {
        Row: ArtisanProfileRow
        Insert: {
          id?: string
          user_id: string
          slug: string
          display_name: string
          bio?: string | null
          story?: string | null
          avatar_url?: string | null
          hero_headline?: string | null
          hero_subline?: string | null
          trust_note?: string | null
          featured_message?: string | null
          storefront_tone?: 'earthy' | 'minimal' | 'bold' | null
          shop_avatar_url?: string | null
          shop_banner_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          created_at?: string
        }
        Update: Partial<{
          slug: string
          display_name: string
          bio: string | null
          story: string | null
          avatar_url: string | null
          hero_headline: string | null
          hero_subline: string | null
          trust_note: string | null
          featured_message: string | null
          storefront_tone: 'earthy' | 'minimal' | 'bold' | null
          shop_avatar_url: string | null
          shop_banner_url: string | null
          primary_color: string | null
          secondary_color: string | null
        }>
        Relationships: []
      }
      products: {
        Row: ProductRow
        Insert: {
          id?: string
          artisan_id: string
          title: string
          description?: string | null
          price_hint?: string | null
          status?: ProductStatus
          image_url?: string | null
          created_at?: string
        }
        Update: Partial<{
          title: string
          description: string | null
          price_hint: string | null
          status: ProductStatus
          image_url: string | null
        }>
        Relationships: []
      }
      custom_requests: {
        Row: CustomRequestRow
        Insert: {
          id?: string
          artisan_id: string
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
