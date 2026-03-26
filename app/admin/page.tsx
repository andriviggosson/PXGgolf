'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, Club, Category, ContactSubmission, DiscountCode, Order } from '@/lib/supabase'
import { getCategories } from '@/lib/data'
import { uploadImage } from '@/lib/storage'
import { PxgLogo } from '@/components/PxgLogo'

type Tab = 'clubs' | 'orders' | 'discounts' | 'messages'

const PLAYER_TYPES = ['All Players', 'Beginners', 'Advanced']
const PRODUCT_TYPES = [
  { value: 'equipment', label: 'Tæki' },
  { value: 'apparel', label: 'Klæðnaður' },
  { value: 'accessory', label: 'Aukahlutir' },
]
const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled']
const STATUS_COLORS: Record<string, string> = {
  pending: '#C9A84C', confirmed: '#4a9eff', shipped: '#8855ff',
  completed: '#4caf50', cancelled: '#e55',
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('clubs')
  const [clubs, setClubs] = useState<Club[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [messages, setMessages] = useState<ContactSubmission[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [discounts, setDiscounts] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncingAll, setSyncingAll] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const emptyForm = {
    name: '', slug: '', category: '', category_id: '',
    short_description: '', description: '',
    price_usd: 0, price_isk: 0,
    image_url: '', pxg_url: '',
    is_new: false, is_featured: false, featured: false,
    in_stock: true, player_type: 'All Players', sort_order: 0,
    product_type: 'equipment', gender: 'unisex',
  }
  const [form, setForm] = useState(emptyForm)

  // Discount form
  const emptyDiscount: { code: string; type: 'percentage' | 'fixed'; value: number; min_order_isk: number; max_uses: string; description: string; active: boolean } = { code: '', type: 'percentage', value: 0, min_order_isk: 0, max_uses: '', description: '', active: true }
  const [discountForm, setDiscountForm] = useState(emptyDiscount)
  const [showDiscountForm, setShowDiscountForm] = useState(false)

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/admin/login'); return }
    setUserEmail(user.email || '')
    fetchAll()
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: clubData }, cats, { data: msgData }, { data: orderData }, { data: discountData }] = await Promise.all([
      supabase.from('clubs').select('*, categories(*)').order('category').order('sort_order'),
      getCategories(),
      supabase.from('contact_submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('discount_codes').select('*').order('created_at', { ascending: false }),
    ])
    if (clubData) setClubs(clubData)
    setCategories(cats)
    if (msgData) setMessages(msgData)
    if (orderData) setOrders(orderData as Order[])
    if (discountData) setDiscounts(discountData as DiscountCode[])
    setLoading(false)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  // Auto-calculate ISK from USD (171 multiplier)
  const calcIsk = (usd: number) => Math.round(usd * 171 / 100) * 100

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setSaving(true)
    const url = await uploadImage(file, 'clubs')
    if (url) setForm(prev => ({ ...prev, image_url: url }))
    setSaving(false)
  }

  const handleDownloadFromUrl = async () => {
    if (!form.image_url || !form.image_url.startsWith('http')) return
    setSaving(true)
    const res = await fetch('/api/download-image', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: form.image_url }),
    })
    const data = await res.json()
    if (data.url) { setForm(p => ({ ...p, image_url: data.url })); setImagePreview(data.url) }
    setSaving(false)
  }

  const handleSyncFromPxg = async (clubId: string, pxgUrl: string) => {
    setSyncing(clubId)
    const res = await fetch('/api/sync-pxg-image', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: clubId, pxgUrl }),
    })
    const data = await res.json()
    if (data.url) {
      setClubs(prev => prev.map(c => c.id === clubId ? { ...c, image_url: data.url } : c))
    }
    setSyncing(null)
  }

  const handleSyncAllImages = async () => {
    const noImage = clubs.filter(c => !c.image_url && c.pxg_url)
    if (noImage.length === 0) { alert('Allar vörur eru nú þegar með myndir!'); return }
    setSyncingAll(true)
    for (const club of noImage) {
      await handleSyncFromPxg(club.id, club.pxg_url!)
      await new Promise(r => setTimeout(r, 800)) // Rate limit
    }
    setSyncingAll(false)
    alert(`Sync lokið! ${noImage.length} myndir sóttar.`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, featured: form.is_featured }
    if (editId) {
      await supabase.from('clubs').update(payload).eq('id', editId)
    } else {
      await supabase.from('clubs').insert([payload])
    }
    setSaving(false)
    setShowForm(false); setEditId(null); setForm(emptyForm); setImagePreview(null)
    fetchAll()
  }

  const handleEdit = (club: Club) => {
    setForm({
      name: club.name, slug: club.slug || '',
      category: club.category, category_id: club.category_id || '',
      short_description: club.short_description || '',
      description: club.description || '',
      price_usd: club.price_usd || 0, price_isk: club.price_isk || 0,
      image_url: club.image_url || '', pxg_url: club.pxg_url || '',
      is_new: club.is_new, is_featured: club.is_featured || club.featured,
      featured: club.featured, in_stock: club.in_stock,
      player_type: club.player_type || 'All Players', sort_order: club.sort_order || 0,
      product_type: club.product_type || 'equipment', gender: club.gender || 'unisex',
    })
    setImagePreview(club.image_url || null)
    setEditId(club.id); setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    await supabase.from('clubs').delete().eq('id', id)
    setDeleteConfirm(null); fetchAll()
  }

  const toggleField = async (club: Club, field: 'is_featured' | 'in_stock' | 'is_new') => {
    await supabase.from('clubs').update({ [field]: !club[field], featured: field === 'is_featured' ? !club[field] : club.featured }).eq('id', club.id)
    fetchAll()
  }

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    fetchAll()
  }

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      code: discountForm.code.toUpperCase(),
      type: discountForm.type,
      value: discountForm.value,
      min_order_isk: discountForm.min_order_isk,
      max_uses: discountForm.max_uses ? Number(discountForm.max_uses) : null,
      description: discountForm.description,
      active: discountForm.active,
    }
    await supabase.from('discount_codes').insert([payload])
    setSaving(false); setShowDiscountForm(false); setDiscountForm(emptyDiscount); fetchAll()
  }

  const toggleDiscount = async (id: string, active: boolean) => {
    await supabase.from('discount_codes').update({ active }).eq('id', id); fetchAll()
  }

  const markRead = async (id: string) => {
    await supabase.from('contact_submissions').update({ is_read: true }).eq('id', id); fetchAll()
  }

  const unread = messages.filter(m => !m.is_read).length
  const pendingOrders = orders.filter(o => o.status === 'pending').length

  // Label helpers
  const S = (style: React.CSSProperties) => style

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--black-card)', borderBottom: '1px solid var(--black-border)', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}><PxgLogo height={16} /></Link>
          <span style={{ color: 'var(--black-border)' }}>|</span>
          <span style={{ color: 'var(--gold)', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--white-muted)', fontSize: '0.7rem' }}>{userEmail}</span>
          <button
            onClick={handleSyncAllImages}
            disabled={syncingAll}
            style={{ background: 'none', border: '1px solid var(--black-border)', color: 'var(--white-muted)', padding: '5px 14px', fontSize: '0.62rem', cursor: 'pointer', fontFamily: 'Barlow Condensed', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget.style.borderColor = 'var(--gold)'); (e.currentTarget.style.color = 'var(--gold)') }}
            onMouseLeave={e => { (e.currentTarget.style.borderColor = 'var(--black-border)'); (e.currentTarget.style.color = 'var(--white-muted)') }}
          >
            {syncingAll ? '⟳ Sæki myndir...' : '↓ Sync PXG myndir'}
          </button>
          <button onClick={handleSignOut} className="btn-gold" style={{ padding: '5px 14px', fontSize: '0.62rem' }}>Útskrá</button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 32px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '32px', borderBottom: '1px solid var(--black-border)' }}>
          {([
            { key: 'clubs', label: `Vörur (${clubs.length})` },
            { key: 'orders', label: `Pantanir${pendingOrders > 0 ? ` (${pendingOrders})` : ''}` },
            { key: 'discounts', label: `Afsláttarkóðar (${discounts.length})` },
            { key: 'messages', label: `Skilaboð${unread > 0 ? ` (${unread})` : ''}` },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '10px 22px', fontSize: '0.7rem', letterSpacing: '0.12em',
              textTransform: 'uppercase', cursor: 'pointer', border: 'none', background: 'transparent',
              fontFamily: 'Barlow Condensed', fontWeight: 600,
              color: tab === t.key ? 'var(--gold)' : 'var(--white-muted)',
              borderBottom: tab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ===== CLUBS TAB ===== */}
        {tab === 'clubs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '2rem', color: '#fff' }}>Vörur</h1>
              {!showForm && (
                <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); setImagePreview(null) }} className="btn-gold btn-gold-fill">
                  + Bæta við vöru
                </button>
              )}
            </div>

            {/* Form */}
            {showForm && (
              <div style={{ background: 'var(--black-card)', border: '1px solid var(--black-border)', padding: '36px', marginBottom: '28px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-1px', left: '36px', right: '36px', height: '2px', background: 'var(--gold)' }} />
                <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '24px' }}>{editId ? 'Breyta vöru' : 'Ný vara'}</h2>
                <form onSubmit={handleSubmit}>
                  {/* Image upload */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px' }}>Mynd</label>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                      {imagePreview && (
                        <div style={{ width: '88px', height: '88px', background: '#0a0a0a', border: '1px solid var(--black-border)', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <button type="button" onClick={() => fileRef.current?.click()} className="btn-gold" style={{ padding: '7px 16px', fontSize: '0.62rem' }}>
                            {imagePreview ? '↑ Skipta um mynd' : '↑ Hlaða upp mynd'}
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input className="input-dark" value={form.image_url} onChange={e => { setForm(p => ({ ...p, image_url: e.target.value })); setImagePreview(e.target.value || null) }} placeholder="...eða límdu mynd URL hér" style={{ fontSize: '0.78rem', flex: 1 }} />
                          <button type="button" onClick={handleDownloadFromUrl} className="btn-ghost" style={{ padding: '7px 14px', fontSize: '0.62rem', flexShrink: 0 }} disabled={saving}>
                            ↓ Niðurhal
                          </button>
                          {form.pxg_url && (
                            <button type="button" onClick={() => handleSyncFromPxg('', form.pxg_url)} className="btn-ghost" style={{ padding: '7px 14px', fontSize: '0.62rem', flexShrink: 0 }}>
                              PXG Sync
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '7px' }}>Nafn *</label>
                      <input className="input-dark" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: editId ? p.slug : generateSlug(e.target.value) }))} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '7px' }}>Flokkur *</label>
                      <select className="input-dark" value={form.category_id} onChange={e => {
                        const cat = categories.find(c => c.id === e.target.value)
                        setForm(p => ({ ...p, category_id: e.target.value, category: cat?.name || '' }))
                      }} required style={{ cursor: 'pointer' }}>
                        <option value="">Veldu flokk</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '7px' }}>Verð USD</label>
                      <input className="input-dark" type="number" value={form.price_usd || ''} onChange={e => setForm(p => ({ ...p, price_usd: Number(e.target.value), price_isk: calcIsk(Number(e.target.value)) }))} placeholder="475" />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '7px' }}>Verð ISK (auto)</label>
                      <input className="input-dark" type="number" value={form.price_isk || ''} onChange={e => setForm(p => ({ ...p, price_isk: Number(e.target.value) }))} placeholder="82900" />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '7px' }}>Tegund vöru</label>
                      <select className="input-dark" value={form.product_type} onChange={e => setForm(p => ({ ...p, product_type: e.target.value }))} style={{ cursor: 'pointer' }}>
                        {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '7px' }}>PXG.com slóð</label>
                      <input className="input-dark" value={form.pxg_url} onChange={e => setForm(p => ({ ...p, pxg_url: e.target.value }))} placeholder="https://www.pxg.com/products/..." />
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '7px' }}>Stutt lýsing</label>
                    <input className="input-dark" value={form.short_description} onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '7px' }}>Lýsing</label>
                    <textarea className="input-dark" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {[{ key: 'is_new', label: 'Nýtt' }, { key: 'is_featured', label: 'Úrval á forsíðu' }, { key: 'in_stock', label: 'Á lager' }].map(({ key, label }) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--white-muted)', fontSize: '0.82rem' }}>
                        <input type="checkbox" checked={form[key as keyof typeof form] as boolean} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} style={{ accentColor: 'var(--gold)', width: '14px', height: '14px' }} />
                        {label}
                      </label>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn-gold btn-gold-fill" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                      {saving ? 'Vista...' : editId ? 'Vista breytingar' : 'Bæta við'}
                    </button>
                    <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} className="btn-ghost">Hætta við</button>
                  </div>
                </form>
              </div>
            )}

            {/* Club list */}
            {loading ? <div style={{ textAlign: 'center', padding: '60px', color: 'var(--white-muted)' }}>Hleður...</div> : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 120px 100px 60px 80px 1fr', gap: '10px', padding: '8px 14px', color: 'var(--white-muted)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  <span></span><span>Nafn</span><span>Flokkur</span><span>ISK</span><span>Nýtt/★</span><span>Lager</span><span>Aðgerðir</span>
                </div>
                {clubs.map(club => (
                  <div key={club.id} style={{ display: 'grid', gridTemplateColumns: '56px 1fr 120px 100px 60px 80px 1fr', gap: '10px', padding: '12px 14px', alignItems: 'center', background: 'var(--black-card)', border: '1px solid var(--black-border)', marginBottom: '2px', transition: 'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#0d0d0d')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--black-card)')}>
                    <div style={{ width: '48px', height: '48px', background: '#050505', border: '1px solid var(--black-border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {club.image_url ? <img src={club.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <PxgLogo height={12} color="#black" />}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '0.88rem', fontFamily: 'Cormorant Garamond' }}>{club.name}</div>
                      <div style={{ color: 'var(--white-muted)', fontSize: '0.65rem', marginTop: '2px' }}>{club.short_description?.slice(0, 45)}</div>
                    </div>
                    <div style={{ color: 'var(--gold)', fontSize: '0.7rem', letterSpacing: '0.06em' }}>{club.category}</div>
                    <div style={{ color: '#fff', fontSize: '0.8rem' }}>{club.price_isk ? club.price_isk.toLocaleString('is-IS') + ' kr.' : '—'}</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => toggleField(club, 'is_new')} title="Nýtt" style={{ background: 'none', border: 'none', cursor: 'pointer', color: club.is_new ? 'var(--white)' : 'var(--black-border)', fontSize: '0.8rem' }}>N</button>
                      <button onClick={() => toggleField(club, 'is_featured')} title="Úrval" style={{ background: 'none', border: 'none', cursor: 'pointer', color: (club.is_featured || club.featured) ? 'var(--gold)' : 'var(--black-border)', fontSize: '1rem' }}>★</button>
                    </div>
                    <button onClick={() => toggleField(club, 'in_stock')} style={{ background: 'none', border: `1px solid ${club.in_stock ? '#2a4a2a' : 'var(--black-border)'}`, color: club.in_stock ? '#4caf50' : 'var(--white-muted)', fontSize: '0.6rem', letterSpacing: '0.06em', padding: '4px 8px', cursor: 'pointer', fontFamily: 'Barlow Condensed' }}>
                      {club.in_stock ? 'Á lager' : 'Uppselt'}
                    </button>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleEdit(club)} className="btn-gold" style={{ padding: '4px 10px', fontSize: '0.6rem' }}>Breyta</button>
                      {club.pxg_url && (
                        <button onClick={() => handleSyncFromPxg(club.id, club.pxg_url!)} disabled={syncing === club.id}
                          style={{ background: 'none', border: '1px solid var(--black-border)', color: 'var(--white-muted)', padding: '4px 10px', fontSize: '0.6rem', cursor: 'pointer', fontFamily: 'Barlow Condensed', letterSpacing: '0.06em' }}>
                          {syncing === club.id ? '⟳' : '↓ Mynd'}
                        </button>
                      )}
                      {deleteConfirm === club.id
                        ? <button onClick={() => handleDelete(club.id)} style={{ background: '#8b1a1a', border: '1px solid #8b1a1a', color: '#fff', padding: '4px 10px', fontSize: '0.6rem', cursor: 'pointer', fontFamily: 'Barlow Condensed' }}>Eyða?</button>
                        : <button onClick={() => setDeleteConfirm(club.id)} style={{ background: 'none', border: '1px solid var(--black-border)', color: 'var(--white-muted)', padding: '4px 10px', fontSize: '0.6rem', cursor: 'pointer', fontFamily: 'Barlow Condensed', transition: 'all 0.2s' }}>Eyða</button>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== ORDERS TAB ===== */}
        {tab === 'orders' && (
          <div>
            <h1 style={{ fontSize: '2rem', color: '#fff', marginBottom: '24px' }}>Pantanir ({orders.length})</h1>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--white-muted)', fontSize: '0.88rem' }}>Engar pantanir ennþá.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {orders.map(order => (
                  <div key={order.id}>
                    <div style={{ background: 'var(--black-card)', border: `1px solid ${order.status === 'pending' ? 'rgba(201,168,76,0.2)' : 'var(--black-border)'}`, padding: '16px 20px', cursor: 'pointer', transition: 'background 0.2s' }}
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      onMouseEnter={e => (e.currentTarget.style.background = '#0d0d0d')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--black-card)')}>
                      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 100px 140px 160px 60px', gap: '12px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--gold)', fontSize: '0.72rem', letterSpacing: '0.08em', fontFamily: 'Cormorant Garamond' }}>{order.order_number}</span>
                        <div>
                          <div style={{ color: '#fff', fontSize: '0.88rem' }}>{order.customer_name}</div>
                          <div style={{ color: 'var(--white-muted)', fontSize: '0.7rem' }}>{order.customer_email}</div>
                        </div>
                        <span style={{ color: 'var(--white)', fontSize: '0.82rem', fontFamily: 'Cormorant Garamond' }}>{order.total_isk.toLocaleString('is-IS')} kr.</span>
                        <span style={{ color: STATUS_COLORS[order.status] || 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', border: `1px solid ${STATUS_COLORS[order.status] || 'var(--black-border)'}`, padding: '3px 10px', display: 'inline-block' }}>
                          {order.status}
                        </span>
                        <span style={{ color: 'var(--white-muted)', fontSize: '0.7rem' }}>{new Date(order.created_at).toLocaleDateString('is-IS', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        <span style={{ color: 'var(--white-muted)', fontSize: '0.9rem' }}>{expandedOrder === order.id ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {expandedOrder === order.id && (
                      <div style={{ background: '#080808', border: '1px solid var(--black-border)', borderTop: 'none', padding: '24px 20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                          <div>
                            <div style={{ color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Heimilisfang</div>
                            <p style={{ color: 'var(--white)', fontSize: '0.82rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{order.shipping_address || '—'}</p>
                            {order.customer_phone && <p style={{ color: 'var(--white-muted)', fontSize: '0.78rem', marginTop: '4px' }}>📞 {order.customer_phone}</p>}
                          </div>
                          <div>
                            <div style={{ color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Vörur</div>
                            {(order.items || []).map((item: {name: string; quantity: number; variant?: string; price_isk: number}, i: number) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--white)', fontSize: '0.8rem' }}>{item.name} {item.variant ? `(${item.variant})` : ''} ×{item.quantity}</span>
                                <span style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>{(item.price_isk * item.quantity).toLocaleString('is-IS')} kr.</span>
                              </div>
                            ))}
                            {order.discount_code && <p style={{ color: '#5c5', fontSize: '0.78rem', marginTop: '8px' }}>Kóði: {order.discount_code} (−{order.discount_isk.toLocaleString('is-IS')} kr.)</p>}
                            <div style={{ borderTop: '1px solid var(--black-border)', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--white)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Samtals</span>
                              <span style={{ color: 'var(--gold)', fontFamily: 'Cormorant Garamond', fontSize: '1.1rem' }}>{order.total_isk.toLocaleString('is-IS')} kr.</span>
                            </div>
                          </div>
                        </div>
                        {order.notes && <p style={{ color: 'var(--white-muted)', fontSize: '0.78rem', marginBottom: '16px', fontStyle: 'italic' }}>Athugasemd: {order.notes}</p>}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', alignSelf: 'center' }}>Breyta stöðu:</span>
                          {ORDER_STATUSES.map(s => (
                            <button key={s} onClick={() => updateOrderStatus(order.id, s)}
                              style={{ padding: '5px 14px', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'Barlow Condensed', border: `1px solid ${order.status === s ? STATUS_COLORS[s] : 'var(--black-border)'}`, background: order.status === s ? STATUS_COLORS[s] + '22' : 'transparent', color: order.status === s ? STATUS_COLORS[s] : 'var(--white-muted)' }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== DISCOUNTS TAB ===== */}
        {tab === 'discounts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '2rem', color: '#fff' }}>Afsláttarkóðar</h1>
              {!showDiscountForm && (
                <button onClick={() => setShowDiscountForm(true)} className="btn-gold btn-gold-fill">+ Nýr kóði</button>
              )}
            </div>

            {showDiscountForm && (
              <div style={{ background: 'var(--black-card)', border: '1px solid var(--black-border)', padding: '32px', marginBottom: '24px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-1px', left: '32px', right: '32px', height: '2px', background: 'var(--gold)' }} />
                <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '20px' }}>Nýr afsláttarkóði</h2>
                <form onSubmit={handleSaveDiscount}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '7px' }}>Kóði *</label>
                      <input className="input-dark" value={discountForm.code} onChange={e => setDiscountForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} required placeholder="PXGISLAND20" style={{ textTransform: 'uppercase' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '7px' }}>Tegund</label>
                      <select className="input-dark" value={discountForm.type} onChange={e => setDiscountForm(p => ({ ...p, type: e.target.value as 'percentage' | 'fixed' }))} style={{ cursor: 'pointer' }}>
                        <option value="percentage">Prósenta (%)</option>
                        <option value="fixed">Föst upphæð (kr.)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '7px' }}>{discountForm.type === 'percentage' ? 'Prósenta (%)' : 'Upphæð (kr.)'} *</label>
                      <input className="input-dark" type="number" value={discountForm.value || ''} onChange={e => setDiscountForm(p => ({ ...p, value: Number(e.target.value) }))} required min="0" />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '7px' }}>Lágmarks pöntun (kr.)</label>
                      <input className="input-dark" type="number" value={discountForm.min_order_isk || ''} onChange={e => setDiscountForm(p => ({ ...p, min_order_isk: Number(e.target.value) }))} placeholder="0" />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '7px' }}>Hámarks notkun</label>
                      <input className="input-dark" type="number" value={discountForm.max_uses} onChange={e => setDiscountForm(p => ({ ...p, max_uses: e.target.value }))} placeholder="Ótakmarkað" />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '7px' }}>Lýsing</label>
                      <input className="input-dark" value={discountForm.description} onChange={e => setDiscountForm(p => ({ ...p, description: e.target.value }))} placeholder="10% velkominn afsláttur" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn-gold btn-gold-fill" disabled={saving}>{saving ? 'Vista...' : 'Búa til kóða'}</button>
                    <button type="button" onClick={() => setShowDiscountForm(false)} className="btn-ghost">Hætta við</button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {discounts.map(d => (
                <div key={d.id} style={{ background: 'var(--black-card)', border: `1px solid ${d.active ? 'var(--black-border)' : 'transparent'}`, padding: '14px 18px', display: 'grid', gridTemplateColumns: '160px 1fr 80px 100px 80px 120px', gap: '12px', alignItems: 'center', opacity: d.active ? 1 : 0.5 }}>
                  <span style={{ color: 'var(--gold)', fontSize: '0.88rem', letterSpacing: '0.12em', fontFamily: 'Cormorant Garamond' }}>{d.code}</span>
                  <div>
                    <div style={{ color: '#fff', fontSize: '0.82rem' }}>{d.description || '—'}</div>
                    {d.min_order_isk > 0 && <div style={{ color: 'var(--white-muted)', fontSize: '0.68rem' }}>Lágmark: {d.min_order_isk.toLocaleString('is-IS')} kr.</div>}
                  </div>
                  <span style={{ color: 'var(--white)', fontSize: '0.82rem' }}>{d.type === 'percentage' ? `${d.value}%` : `${d.value.toLocaleString('is-IS')} kr.`}</span>
                  <span style={{ color: 'var(--white-muted)', fontSize: '0.72rem' }}>{d.uses_count} / {d.max_uses ?? '∞'}</span>
                  <span style={{ color: d.active ? '#4caf50' : 'var(--white-muted)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{d.active ? 'Virkt' : 'Óvirkt'}</span>
                  <button onClick={() => toggleDiscount(d.id, !d.active)} className="btn-ghost" style={{ padding: '4px 12px', fontSize: '0.6rem' }}>
                    {d.active ? 'Slökkva' : 'Kveikja'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== MESSAGES TAB ===== */}
        {tab === 'messages' && (
          <div>
            <h1 style={{ fontSize: '2rem', color: '#fff', marginBottom: '24px' }}>Skilaboð ({messages.length})</h1>
            {messages.length === 0 ? (
              <p style={{ color: 'var(--white-muted)', textAlign: 'center', padding: '60px', fontSize: '0.88rem' }}>Engin skilaboð ennþá.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ background: msg.is_read ? 'var(--black-card)' : '#0a0a06', border: `1px solid ${msg.is_read ? 'var(--black-border)' : 'rgba(201,168,76,0.2)'}`, padding: '18px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <span style={{ color: '#fff', fontFamily: 'Cormorant Garamond', fontSize: '1.1rem' }}>{msg.name}</span>
                        <span style={{ color: 'var(--gold)', fontSize: '0.75rem', marginLeft: '12px' }}>{msg.email}</span>
                        {!msg.is_read && <span style={{ marginLeft: '10px', background: 'var(--gold)', color: '#000', fontSize: '0.52rem', padding: '2px 7px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Nýtt</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--white-muted)', fontSize: '0.7rem' }}>{new Date(msg.created_at).toLocaleDateString('is-IS')}</span>
                        {!msg.is_read && <button onClick={() => markRead(msg.id)} className="btn-gold" style={{ padding: '3px 10px', fontSize: '0.58rem' }}>Lesið</button>}
                      </div>
                    </div>
                    <p style={{ color: 'var(--white-muted)', fontSize: '0.83rem', lineHeight: 1.6 }}>{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
