import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  image_url: string | null
}

export interface Club {
  id: string
  name: string
  slug: string
  category: string
  category_id: string | null
  description: string | null
  short_description: string | null
  price_usd: number | null
  price_isk: number | null
  image_url: string | null
  pxg_url: string | null
  is_new: boolean
  is_featured: boolean
  featured: boolean
  in_stock: boolean
  sort_order: number
  player_type: string
  product_type: 'equipment' | 'apparel' | 'accessory'
  gender: 'men' | 'women' | 'unisex'
  variants: { options?: string[]; sizes?: string[]; colors?: string[] } | null
  extra_images: string[] | null
  specs: Record<string, string> | null
  categories?: Category
}

export interface SiteContent {
  id: string
  section: string
  key: string
  value: string
  type: string
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  message: string | null
  created_at: string
  is_read: boolean
}

export interface DiscountCode {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order_isk: number
  max_uses: number | null
  uses_count: number
  active: boolean
  expires_at: string | null
  description: string | null
  created_at: string
}

export interface OrderItem {
  id: string
  name: string
  slug: string
  price_isk: number
  quantity: number
  variant?: string
  image_url?: string | null
}

export interface Order {
  id: string
  order_number: string
  status: 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled'
  customer_name: string
  customer_email: string
  customer_phone: string | null
  shipping_address: string | null
  items: OrderItem[]
  subtotal_isk: number
  discount_isk: number
  discount_code: string | null
  total_isk: number
  notes: string | null
  created_at: string
}
