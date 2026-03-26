'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { use } from 'react'
import { Club } from '@/lib/supabase'
import { getClubBySlug, getRelatedClubs } from '@/lib/data'
import { PxgLogo } from '@/components/PxgLogo'
import { SiteNav } from '@/components/SiteNav'
import { useCart } from '@/components/CartContext'

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [club, setClub] = useState<Club | null>(null)
  const [related, setRelated] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const { addItem } = useCart()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await getClubBySlug(slug)
      setClub(data)
      if (data?.category_id) {
        const rel = await getRelatedClubs(data.category_id, data.id)
        setRelated(rel)
      }
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SiteNav />
      <span className="spinner" style={{ width: '32px', height: '32px' }} />
    </div>
  )

  if (!club) return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      <SiteNav />
      <PxgLogo height={36} color="#1a1a1a" />
      <p style={{ color: 'var(--white-muted)', letterSpacing: '0.1em' }}>Vara ekki fundin</p>
      <Link href="/products" className="btn-gold">Til baka</Link>
    </div>
  )

  const images = [club.image_url, ...(club.extra_images || [])].filter(Boolean) as string[]
  const variants = club.variants?.options ?? club.variants?.sizes ?? []
  const price = club.price_isk ?? 0

  const handleAddToCart = () => {
    if (variants.length > 0 && !selectedVariant) return
    addItem({
      id: club.id, name: club.name, slug: club.slug,
      price_isk: price, image_url: club.image_url,
      category: club.category, product_type: club.product_type ?? 'equipment',
      variant: selectedVariant ?? undefined,
    }, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh' }}>
      <SiteNav />

      <div style={{ paddingTop: '68px' }}>
        {/* Breadcrumb */}
        <div style={{ padding: '20px 40px', borderBottom: '1px solid var(--black-border)', background: 'var(--black-soft)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div className="breadcrumb">
              <Link href="/">Forsíða</Link>
              <span>—</span>
              <Link href="/products">Vörur</Link>
              <span>—</span>
              <Link href={`/products?category=${club.categories?.slug}`}>{club.category}</Link>
              <span>—</span>
              <span style={{ color: 'var(--white)' }}>{club.name}</span>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start' }}>

            {/* Images */}
            <div>
              {/* Main image */}
              <div style={{ position: 'relative', aspectRatio: '4/3', background: '#060606', border: '1px solid var(--black-border)', overflow: 'hidden', marginBottom: '12px' }}>
                {images.length > 0 ? (
                  <img
                    src={images[activeImage]}
                    alt={club.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s ease' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                    <PxgLogo height={48} color="#111" />
                    <span style={{ color: 'var(--white-muted)', fontSize: '0.7rem', letterSpacing: '0.15em' }}>Mynd ekki til staðar</span>
                  </div>
                )}
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(club.is_featured || club.featured) && <span className="badge badge-gold">Úrval</span>}
                  {club.is_new && <span className="badge badge-white">Nýtt</span>}
                </div>
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      style={{ width: '72px', height: '72px', border: `1px solid ${activeImage === i ? 'var(--gold)' : 'var(--black-border)'}`, background: '#060606', cursor: 'pointer', overflow: 'hidden', flexShrink: 0, transition: 'border-color 0.2s' }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}

              {/* PXG link */}
              {club.pxg_url && (
                <a href={club.pxg_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '16px', color: 'var(--white-muted)', fontSize: '0.7rem', letterSpacing: '0.1em', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => ((e.target as HTMLAnchorElement).style.color = 'var(--gold)')}
                  onMouseLeave={e => ((e.target as HTMLAnchorElement).style.color = 'var(--white-muted)')}>
                  ↗ Skoða á PXG.com
                </a>
              )}
            </div>

            {/* Product info */}
            <div style={{ position: 'sticky', top: '88px' }}>
              <div style={{ color: 'var(--gold)', fontSize: '0.62rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '10px' }}>
                {club.category}
              </div>

              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'var(--white)', fontWeight: 300, marginBottom: '16px', lineHeight: 1.0 }}>
                {club.name}
              </h1>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '24px' }}>
                <span style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', color: 'var(--gold)', fontWeight: 300 }}>
                  {price.toLocaleString('is-IS')} kr.
                </span>
                {club.price_usd && (
                  <span style={{ color: 'var(--white-muted)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    (${club.price_usd} USD)
                  </span>
                )}
              </div>

              {club.short_description && (
                <p style={{ color: 'var(--white-muted)', lineHeight: 1.7, marginBottom: '28px', fontSize: '0.88rem', borderLeft: '2px solid var(--gold)', paddingLeft: '16px' }}>
                  {club.short_description}
                </p>
              )}

              {/* Variants */}
              {variants.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ color: 'var(--white)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
                    {club.product_type === 'apparel' ? 'Stærð' : 'Val'}
                    {selectedVariant && <span style={{ color: 'var(--gold)', marginLeft: '8px' }}>— {selectedVariant}</span>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {variants.map((v: string) => (
                      <button
                        key={v}
                        onClick={() => setSelectedVariant(selectedVariant === v ? null : v)}
                        className={`variant-btn${selectedVariant === v ? ' selected' : ''}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  {variants.length > 0 && !selectedVariant && (
                    <p style={{ color: 'var(--white-muted)', fontSize: '0.7rem', marginTop: '8px', letterSpacing: '0.05em' }}>Vinsamlegast veldu {club.product_type === 'apparel' ? 'stærð' : 'val'}</p>
                  )}
                </div>
              )}

              {/* Colors if apparel */}
              {club.variants?.colors && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ color: 'var(--white)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Litur</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {club.variants.colors.map((c: string) => (
                      <span key={c} style={{ color: 'var(--white-muted)', fontSize: '0.75rem', padding: '4px 12px', border: '1px solid var(--black-border)' }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Qty + Add to cart */}
              {club.in_stock ? (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
                  {/* Qty */}
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--black-border)' }}>
                    <button onClick={() => setQty(Math.max(1, qty - 1))}
                      style={{ background: 'none', border: 'none', color: 'var(--white-muted)', cursor: 'pointer', width: '40px', height: '48px', fontSize: '1.2rem', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--white)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--white-muted)')}>−</button>
                    <span style={{ color: 'var(--white)', width: '40px', textAlign: 'center', fontSize: '0.9rem' }}>{qty}</span>
                    <button onClick={() => setQty(qty + 1)}
                      style={{ background: 'none', border: 'none', color: 'var(--white-muted)', cursor: 'pointer', width: '40px', height: '48px', fontSize: '1.2rem', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--white)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--white-muted)')}>+</button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="btn-gold btn-gold-fill"
                    style={{ flex: 1, justifyContent: 'center', padding: '14px', fontSize: '0.72rem', transition: 'all 0.25s' }}
                    disabled={variants.length > 0 && !selectedVariant}
                  >
                    {added ? '✓ Bætt í körfu' : `Bæta í körfu — ${(price * qty).toLocaleString('is-IS')} kr.`}
                  </button>
                </div>
              ) : (
                <div style={{ border: '1px solid var(--black-border)', padding: '14px', textAlign: 'center', color: 'var(--white-muted)', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: '20px' }}>
                  UPPSELT
                </div>
              )}

              <a href="/#samband" className="btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginBottom: '32px', fontSize: '0.7rem' }}>
                Spurningar? Hafðu samband
              </a>

              {/* Specs */}
              {club.specs && Object.keys(club.specs).length > 0 && (
                <div style={{ borderTop: '1px solid var(--black-border)', paddingTop: '24px', marginBottom: '24px' }}>
                  <div style={{ color: 'var(--white)', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 600 }}>Tæknileg gögn</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(club.specs).map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--black-border)' }}>
                        <span style={{ color: 'var(--white-muted)', fontSize: '0.78rem', textTransform: 'capitalize', letterSpacing: '0.05em' }}>{key.replace(/_/g, ' ')}</span>
                        <span style={{ color: 'var(--white)', fontSize: '0.78rem', textAlign: 'right', maxWidth: '55%' }}>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {club.description && (
                <div style={{ borderTop: '1px solid var(--black-border)', paddingTop: '24px' }}>
                  <div style={{ color: 'var(--white)', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 600 }}>Lýsing</div>
                  <p style={{ color: 'var(--white-muted)', lineHeight: 1.8, fontSize: '0.85rem' }}>{club.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <div style={{ marginTop: '80px', borderTop: '1px solid var(--black-border)', paddingTop: '60px' }}>
              <div style={{ marginBottom: '32px' }}>
                <div className="section-label"><span>Tengdar vörur</span></div>
                <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: 'var(--white)' }}>Þér gæti líkað</h2>
              </div>
              <div className="product-grid">
                {related.map(c => (
                  <Link key={c.id} href={`/products/${c.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="product-card">
                      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#060606' }}>
                        {c.image_url ? <img src={c.image_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PxgLogo height={24} color="#111" /></div>}
                      </div>
                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ color: 'var(--gold)', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>{c.category}</div>
                        <h3 style={{ color: 'var(--white)', fontSize: '0.95rem', fontWeight: 300 }}>{c.name}</h3>
                        <span style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.1rem', color: 'var(--gold)' }}>{(c.price_isk ?? 0).toLocaleString('is-IS')} kr.</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
