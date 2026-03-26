'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Club, Category } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { PxgLogo } from '@/components/PxgLogo'
import { SiteNav } from '@/components/SiteNav'
import { useCart } from '@/components/CartContext'

const SORT_OPTIONS = [
  { value: 'sort_order', label: 'Tilgreint' },
  { value: 'price_asc', label: 'Verð: Lægst fyrst' },
  { value: 'price_desc', label: 'Verð: Hæst fyrst' },
  { value: 'name_asc', label: 'Nafn: A → Ö' },
]

const PLAYER_TYPES = ['Allir', 'All Players', 'Beginners', 'Advanced']

function ProductCard({ club }: { club: Club }) {
  const { addItem } = useCart()
  const price = club.price_isk ?? 0

  return (
    <Link href={`/products/${club.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="product-card" style={{ height: '100%' }}>
        <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#060606' }}>
          {club.image_url ? (
            <img src={club.image_url} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #060606, #0f0f0f)' }}>
              <PxgLogo height={28} color="Gold" />
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 50%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {(club.is_featured || club.featured) && <span className="badge badge-gold">Úrval</span>}
            {club.is_new && <span className="badge badge-white">Nýtt</span>}
          </div>
          {!club.in_stock && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="badge badge-dark">Uppselt</span>
            </div>
          )}
          {club.in_stock && (
            <div className="quick-add" onClick={e => { e.preventDefault(); addItem({ id: club.id, name: club.name, slug: club.slug, price_isk: price, image_url: club.image_url, category: club.category, product_type: club.product_type ?? 'equipment' }) }}>
              + Bæta í körfu
            </div>
          )}
        </div>
        <div style={{ padding: '16px 18px 18px' }}>
          <div style={{ color: 'var(--gold)', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '5px' }}>{club.category}</div>
          <h3 style={{ color: 'var(--white)', fontSize: '1rem', marginBottom: '5px', lineHeight: 1.2, fontWeight: 300 }}>{club.name}</h3>
          {club.short_description && (
            <p style={{ color: 'var(--white-muted)', fontSize: '0.75rem', lineHeight: 1.5, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {club.short_description}
            </p>
          )}
          <span style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.2rem', color: 'var(--gold)', fontWeight: 300 }}>
            {price.toLocaleString('is-IS')} kr.
          </span>
        </div>
      </div>
    </Link>
  )
}

function ProductsContent() {
  const sp = useSearchParams()
  const [clubs, setClubs] = useState<Club[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('sort_order')

  const activeCategory = sp.get('category') ?? 'all'
  const filterNew = sp.get('new') === '1'
  const filterFeatured = sp.get('featured') === '1'
  const filterType = sp.get('product_type') ?? 'all'

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('clubs').select('*, categories(*)').order('sort_order')
    setClubs(data || [])
    const { data: cats } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(cats || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Filter
  let filtered = clubs
  if (activeCategory !== 'all') {
    filtered = filtered.filter(c => c.categories?.slug === activeCategory)
  }
  if (filterNew) filtered = filtered.filter(c => c.is_new)
  if (filterFeatured) filtered = filtered.filter(c => c.is_featured || c.featured)
  if (filterType !== 'all') filtered = filtered.filter(c => c.product_type === filterType)

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sort === 'price_asc') return (a.price_isk ?? 0) - (b.price_isk ?? 0)
    if (sort === 'price_desc') return (b.price_isk ?? 0) - (a.price_isk ?? 0)
    if (sort === 'name_asc') return a.name.localeCompare(b.name)
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })

  const catName = categories.find(c => c.slug === activeCategory)?.name

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh' }}>
      <SiteNav />

      {/* Page header */}
      <div style={{ paddingTop: '68px', background: 'var(--black-card)', borderBottom: '1px solid var(--black-border)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 40px 32px' }}>
          <div className="breadcrumb" style={{ marginBottom: '16px' }}>
            <Link href="/">Forsíða</Link>
            <span>—</span>
            <span style={{ color: 'var(--white)' }}>Vörur</span>
            {catName && <><span>—</span><span style={{ color: 'var(--gold)' }}>{catName}</span></>}
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', color: 'var(--white)', fontWeight: 300 }}>
            {catName ?? (filterNew ? 'Nýjungar' : filterFeatured ? 'Úrvalsvörur' : filterType !== 'all' ? (filterType === 'apparel' ? 'Klæðnaður' : filterType === 'accessory' ? 'Aukahlutir' : 'Tæki') : 'Allar vörur')}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 40px' }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          {/* Category tabs */}
          <div className="h-scroll" style={{ flex: 1, minWidth: 0 }}>
            <Link href="/products" className={`cat-tab${activeCategory === 'all' ? ' active' : ''}`}>
              Allt <span className="cat-count">{clubs.length}</span>
            </Link>
            {[
              { slug: 'equipment', label: 'Tæki' },
              { slug: 'apparel', label: 'Klæðnaður' },
              { slug: 'accessory', label: 'Aukahlutir' },
            ].map(t => (
              <Link key={t.slug} href={`/products?product_type=${t.slug}`} className={`cat-tab${filterType === t.slug ? ' active' : ''}`}>
                {t.label}
                <span className="cat-count">{clubs.filter(c => c.product_type === t.slug).length}</span>
              </Link>
            ))}
            <div style={{ width: '1px', background: 'var(--black-border)', alignSelf: 'stretch', margin: '0 4px' }} />
            {categories.map(cat => (
              <Link key={cat.id} href={`/products?category=${cat.slug}`} className={`cat-tab${activeCategory === cat.slug ? ' active' : ''}`}>
                {cat.name}
                <span className="cat-count">{clubs.filter(c => c.categories?.slug === cat.slug).length}</span>
              </Link>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="input-dark"
            style={{ width: 'auto', minWidth: '180px', cursor: 'pointer' }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Results count */}
        <div style={{ color: 'var(--white-muted)', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '24px' }}>
          {loading ? 'Hleður...' : `${filtered.length} vörur`}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <span className="spinner" style={{ width: '32px', height: '32px' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <PxgLogo height={36} color="black" />
            <p style={{ color: 'var(--white-muted)', marginTop: '20px', fontSize: '0.88rem', letterSpacing: '0.1em' }}>Engar vörur fundust</p>
            <Link href="/products" className="btn-gold" style={{ marginTop: '20px', display: 'inline-flex' }}>Sjá allar vörur</Link>
          </div>
        ) : (
          <div className="product-grid">
            {filtered.map(club => <ProductCard key={club.id} club={club} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--black)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" /></div>}>
      <ProductsContent />
    </Suspense>
  )
}
