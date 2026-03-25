import { supabase, Club, Category, SiteContent, DiscountCode, Order, OrderItem } from './supabase'

export async function getCategories(): Promise<Category[]> {
  const { data } = await supabase.from('categories').select('*').order('sort_order')
  return data || []
}

export async function getClubs(categorySlug?: string, productType?: string): Promise<Club[]> {
  let query = supabase.from('clubs').select('*, categories(*)').order('sort_order')
  if (categorySlug) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', categorySlug).single()
    if (cat) query = query.eq('category_id', cat.id)
  }
  if (productType) query = query.eq('product_type', productType)
  const { data } = await query
  return data || []
}

export async function getClubBySlug(slug: string): Promise<Club | null> {
  const { data } = await supabase.from('clubs').select('*, categories(*)').eq('slug', slug).single()
  return data || null
}

export async function getFeaturedClubs(): Promise<Club[]> {
  const { data } = await supabase.from('clubs').select('*, categories(*)')
    .eq('is_featured', true).order('sort_order').limit(8)
  return data || []
}

export async function getNewArrivals(): Promise<Club[]> {
  const { data } = await supabase.from('clubs').select('*, categories(*)')
    .eq('is_new', true).order('sort_order').limit(8)
  return data || []
}

export async function getRelatedClubs(categoryId: string, excludeId: string): Promise<Club[]> {
  const { data } = await supabase.from('clubs').select('*, categories(*)')
    .eq('category_id', categoryId).neq('id', excludeId).order('sort_order').limit(4)
  return data || []
}

export async function getSiteContent(section?: string): Promise<Record<string, string>> {
  let query = supabase.from('site_content').select('*')
  if (section) query = query.eq('section', section)
  const { data } = await query
  const content: Record<string, string> = {}
  data?.forEach((item: SiteContent) => { content[`${item.section}.${item.key}`] = item.value })
  return content
}

export async function submitContact(name: string, email: string, message: string) {
  const { error } = await supabase.from('contact_submissions').insert({ name, email, message })
  if (error) throw error
}

export async function validateDiscountCode(code: string, subtotalIsk: number): Promise<{
  valid: boolean
  discount: DiscountCode | null
  error?: string
}> {
  const { data } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .single()

  if (!data) return { valid: false, discount: null, error: 'Ógildur kóði' }

  if (data.expires_at && new Date(data.expires_at) < new Date())
    return { valid: false, discount: null, error: 'Kóðinn er útrunninn' }

  if (data.max_uses && data.uses_count >= data.max_uses)
    return { valid: false, discount: null, error: 'Kóðinn hefur verið notaður of oft' }

  if (subtotalIsk < data.min_order_isk)
    return { valid: false, discount: null, error: `Lágmarks pöntun er ${data.min_order_isk.toLocaleString('is-IS')} kr.` }

  return { valid: true, discount: data }
}

export function calculateDiscount(discount: DiscountCode, subtotalIsk: number): number {
  if (discount.type === 'percentage') return Math.round(subtotalIsk * discount.value / 100)
  return Math.min(discount.value, subtotalIsk)
}

let orderCounter = 0
export async function createOrder(params: {
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  items: OrderItem[]
  subtotalIsk: number
  discountIsk: number
  discountCode: string | null
  totalIsk: number
  notes?: string
}): Promise<Order> {
  orderCounter++
  const orderNumber = `PXG-${Date.now().toString().slice(-6)}-${String(orderCounter).padStart(3, '0')}`

  const { data, error } = await supabase.from('orders').insert({
    order_number: orderNumber,
    status: 'pending',
    customer_name: params.customerName,
    customer_email: params.customerEmail,
    customer_phone: params.customerPhone,
    shipping_address: params.shippingAddress,
    items: params.items,
    subtotal_isk: params.subtotalIsk,
    discount_isk: params.discountIsk,
    discount_code: params.discountCode,
    total_isk: params.totalIsk,
    notes: params.notes,
  }).select().single()

  if (error) throw error

  // Increment discount code uses (non-critical)
  if (params.discountCode) {
    try {
      await supabase.from('discount_codes').update({ uses_count: supabase.rpc('increment_discount_uses' as never) }).eq('code', params.discountCode)
    } catch {} // non-critical
  }

  return data
}
