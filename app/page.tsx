'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Club, Category } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { submitContact } from '@/lib/data'
import { PxgLogo } from '@/components/PxgLogo'
import { SiteNav } from '@/components/SiteNav'
import { useCart } from '@/components/CartContext'

function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view') }),
      { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
    )
    document.querySelectorAll('.reveal, .reveal-left').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  })
}

function ProductCard({ club }: { club: Club }) {
  const { addItem } = useCart()
  const price = club.price_isk ?? 0

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      id: club.id, name: club.name, slug: club.slug,
      price_isk: price, image_url: club.image_url,
      category: club.category, product_type: club.product_type ?? 'equipment',
    })
  }

  return (
    <Link href={`/products/${club.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="product-card">
        <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#060606' }}>
          {club.image_url ? (
            <img src={club.image_url} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #060606 0%, #0f0f0f 50%, #080500 100%)',
            }}>
              <PxgLogo height={28} color="rgba(201,168,76,0.12)" />
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(club.is_featured || club.featured) && <span className="badge badge-gold">Úrval</span>}
            {club.is_new && <span className="badge badge-white">Nýtt</span>}
          </div>
          {!club.in_stock && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="badge badge-dark">Uppselt</span>
            </div>
          )}
          {club.in_stock && (
            <div className="quick-add" onClick={handleAdd}>Bæta í körfu</div>
          )}
        </div>
        <div style={{ padding: '18px 20px 20px' }}>
          <div style={{ color: 'var(--gold)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6px' }}>
            {club.category}
          </div>
          <h3 style={{ color: 'var(--white)', fontSize: '1.05rem', marginBottom: '6px', lineHeight: 1.2, fontWeight: 300 }}>{club.name}</h3>
          {club.short_description && (
            <p style={{ color: 'var(--white-muted)', fontSize: '0.78rem', lineHeight: 1.5, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {club.short_description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', color: 'var(--gold)', fontWeight: 300 }}>
              {price.toLocaleString('is-IS')} kr.
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Category visual config
const CAT_VISUALS: Record<string, { grad: string; emoji: string }> = {
  driver:           { grad: 'linear-gradient(135deg, #0d0800 0%, #1a0e00 50%, #0d0800 100%)', emoji: '🏌️' },
  fairway:          { grad: 'linear-gradient(135deg, #030d03 0%, #0a1a0a 50%, #030d03 100%)', emoji: '⛳' },
  hybrid:           { grad: 'linear-gradient(135deg, #04080d 0%, #0a1420 50%, #04080d 100%)', emoji: '🎯' },
  iron:             { grad: 'linear-gradient(135deg, #080808 0%, #141414 50%, #080808 100%)', emoji: '⚙️' },
  wedge:            { grad: 'linear-gradient(135deg, #0a0600 0%, #1a1000 50%, #0a0600 100%)', emoji: '✦' },
  putter:           { grad: 'linear-gradient(135deg, #030808 0%, #061818 50%, #030808 100%)', emoji: '🏆' },
  'mens-apparel':   { grad: 'linear-gradient(135deg, #060508 0%, #0f0a14 50%, #060508 100%)', emoji: '👔' },
  'womens-apparel': { grad: 'linear-gradient(135deg, #080508 0%, #140a14 50%, #080508 100%)', emoji: '✨' },
  bags:             { grad: 'linear-gradient(135deg, #040404 0%, #0e0e0e 50%, #040404 100%)', emoji: '🎒' },
  accessories:      { grad: 'linear-gradient(135deg, #060600 0%, #121200 50%, #060600 100%)', emoji: '💎' },
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Club[]>([])
  const [newArrivals, setNewArrivals] = useState<Club[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const formRef = useRef<HTMLFormElement>(null)

  useReveal()

  useEffect(() => {
    const load = async () => {
      const [{ data: feat }, { data: newItems }, { data: cats }] = await Promise.all([
        supabase.from('clubs').select('*, categories(*)').eq('is_featured', true).order('sort_order').limit(8),
        supabase.from('clubs').select('*, categories(*)').eq('is_new', true).order('sort_order').limit(6),
        supabase.from('categories').select('*').order('sort_order'),
      ])
      if (feat) setFeatured(feat)
      if (newItems) setNewArrivals(newItems)
      if (cats) setCategories(cats)
    }
    load()
  }, [])

  const handleContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setContactStatus('sending')
    const fd = new FormData(e.currentTarget)
    try {
      await submitContact(fd.get('name') as string, fd.get('email') as string, fd.get('message') as string)
      setContactStatus('sent')
      formRef.current?.reset()
    } catch { setContactStatus('error') }
  }

  const catNums: Record<string, string> = {
    driver: '01', fairway: '02', hybrid: '03', iron: '04',
    wedge: '05', putter: '06', 'mens-apparel': '07',
    'womens-apparel': '08', bags: '09', accessories: '10',
  }

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh' }}>
      <SiteNav />

      {/* ===== HERO ===== */}
      <section style={{ height: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        {/* Multi-layer dark background */}
        <div style={{ position: 'absolute', inset: 0, background: '#000' }} />

        {/* Atmospheric light — top right warm */}
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: '70vw', height: '70vw',
          background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* Atmospheric light — bottom left cool */}
        <div style={{
          position: 'absolute', bottom: '-30%', left: '-15%',
          width: '60vw', height: '60vw',
          background: 'radial-gradient(circle, rgba(30,50,30,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Giant watermark PXG text */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', overflow: 'hidden',
        }}>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(200px, 30vw, 420px)',
            color: 'transparent',
            WebkitTextStroke: '1px rgba(201,168,76,0.06)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            userSelect: 'none',
            transform: 'translateY(5%)',
          }}>PXG</span>
        </div>

        {/* Fine grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025,
          backgroundImage: `
            linear-gradient(rgba(201,168,76,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          pointerEvents: 'none',
        }} />

        {/* Diagonal accent line */}
        <div style={{
          position: 'absolute', top: 0, right: '30%', width: '1px', height: '100%',
          background: 'linear-gradient(to bottom, transparent, rgba(201,168,76,0.15) 30%, rgba(201,168,76,0.15) 70%, transparent)',
          pointerEvents: 'none',
        }} />

        {/* Hero Content */}
        <div style={{ position: 'relative', width: '100%', padding: '0 clamp(24px, 8vw, 140px)', zIndex: 2 }}>
          <div style={{ maxWidth: '780px' }}>
            {/* Eyebrow */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '40px',
              animation: 'fadeIn 1s ease 0.2s both',
            }}>
              <div style={{ width: '48px', height: '1px', background: 'var(--gold)', transformOrigin: 'left', animation: 'lineGrow 0.8s ease 0.4s both' }} />
              <span style={{ color: 'var(--gold)', fontSize: '0.62rem', letterSpacing: '0.4em', textTransform: 'uppercase', fontFamily: 'Barlow Condensed' }}>
                Parsons Xtreme Golf — Ísland
              </span>
            </div>

            {/* Logo */}
            <div style={{ marginBottom: '36px', animation: 'fadeIn 1s ease 0.5s both' }}>
              <PxgLogo height={72} />
            </div>

            {/* Headline */}
            <div style={{ marginBottom: '28px', animation: 'fadeIn 1s ease 0.7s both' }}>
              <h1 style={{
                fontSize: 'clamp(3rem, 8vw, 7rem)',
                lineHeight: 0.9,
                letterSpacing: '-0.02em',
                fontWeight: 300,
              }}>
                <span style={{ display: 'block', color: 'var(--white)', fontStyle: 'italic', fontSize: '0.6em', marginBottom: '10px', letterSpacing: '0.04em' }}>
                  Kylfur í
                </span>
                <span className="gold-shimmer">Heimsklassa.</span>
              </h1>
            </div>

            <p style={{
              color: 'var(--white-muted)', fontSize: '1rem', lineHeight: 1.8,
              maxWidth: '460px', marginBottom: '48px',
              animation: 'fadeIn 1s ease 0.9s both',
              fontFamily: 'Barlow Condensed', fontWeight: 300, letterSpacing: '0.06em',
            }}>
              Handsmíðaðar golfkylfur í heimsklassa — hannaðar án tillits til kostnaðar. Nú fáanlegar á Íslandi.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', animation: 'fadeIn 1s ease 1.1s both' }}>
              <Link href="/products" className="btn-gold btn-gold-fill" style={{ padding: '16px 48px', fontSize: '0.75rem' }}>
                Skoða vörur
              </Link>
              <a href="#um-pxg" className="btn-gold" style={{ padding: '16px 48px', fontSize: '0.75rem' }}>
                Um PXG
              </a>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: '36px', right: 'clamp(24px, 5vw, 80px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 2,
          animation: 'fadeIn 1s ease 1.5s both',
        }}>
          <span style={{ color: 'var(--white-muted)', fontSize: '0.55rem', letterSpacing: '0.35em', textTransform: 'uppercase', writingMode: 'vertical-lr' }}>Skruna</span>
          <div style={{ width: '1px', height: '64px', background: 'linear-gradient(to bottom, var(--gold), transparent)' }} />
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <div style={{
        background: 'var(--black-card)',
        borderTop: '1px solid var(--black-border)', borderBottom: '1px solid var(--black-border)',
        padding: '28px 40px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 'clamp(40px, 10vw, 120px)', flexWrap: 'wrap' }}>
          {[
            { num: '200+', label: 'Tour leikendur' },
            { num: '2014', label: 'Stofnað' },
            { num: '100%', label: 'Handsmíðað' },
            { num: '#1', label: 'Gæðakylfur' },
          ].map((s, i) => (
            <div key={s.num} className={`reveal reveal-d${i + 1}`} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', color: 'var(--gold)', fontWeight: 300 }}>{s.num}</div>
              <div style={{ color: 'var(--white-muted)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== CATEGORIES GRID ===== */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 60px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="reveal" style={{ marginBottom: '52px' }}>
            <div className="section-label"><span>Vöruflokkur</span></div>
            <h2 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', color: 'var(--white)', fontWeight: 300 }}>Allt sem þú þarft</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '3px' }}>
            {categories.slice(0, 10).map((cat, i) => {
              const spanMap = [5, 4, 3, 4, 4, 4, 3, 5, 6, 6]
              const colSpan = spanMap[i] || 4
              const vis = CAT_VISUALS[cat.slug] || { grad: 'linear-gradient(135deg, #080808, #141414)', emoji: '✦' }
              const num = catNums[cat.slug] ?? String(i + 1).padStart(2, '0')
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  style={{ gridColumn: `span ${colSpan}`, textDecoration: 'none' }}
                >
                  <div
                    className={`reveal reveal-d${Math.min(i + 1, 6)} cat-tile`}
                    style={{
                      background: vis.grad,
                      padding: 'clamp(28px, 3.5vw, 52px) clamp(24px, 3vw, 44px)',
                      position: 'relative', cursor: 'pointer', overflow: 'hidden',
                      minHeight: 'clamp(160px, 20vw, 220px)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                      border: '1px solid rgba(255,255,255,0.04)',
                      transition: 'border-color 0.35s ease',
                    }}
                  >
                    {/* Background number watermark */}
                    <div style={{
                      position: 'absolute', top: '-10px', left: '16px',
                      fontFamily: 'Cormorant Garamond', fontSize: 'clamp(80px, 10vw, 130px)',
                      color: 'rgba(201,168,76,0.05)', fontWeight: 300, lineHeight: 1,
                      pointerEvents: 'none', userSelect: 'none',
                    }}>
                      {num}
                    </div>

                    {/* Gold bottom border slide-in */}
                    <div className="cat-border" style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
                      background: 'var(--gold)', transform: 'scaleX(0)', transformOrigin: 'left',
                      transition: 'transform 0.35s ease',
                    }} />

                    {/* Content */}
                    <div style={{ position: 'relative' }}>
                      <h3 style={{ color: 'var(--white)', fontSize: 'clamp(1.1rem, 2.2vw, 1.6rem)', marginBottom: '8px', fontWeight: 300, letterSpacing: '0.04em' }}>
                        {cat.name}
                      </h3>
                      <p style={{ color: 'var(--white-muted)', fontSize: '0.76rem', letterSpacing: '0.04em', lineHeight: 1.5 }}>
                        {cat.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="cat-arrow" style={{
                      position: 'absolute', top: '20px', right: '22px',
                      width: '32px', height: '32px', border: '1px solid rgba(201,168,76,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--gold)', fontSize: '0.9rem',
                      transition: 'all 0.3s ease',
                    }}>↗</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section style={{ padding: '0 clamp(20px, 5vw, 60px) clamp(60px, 8vw, 100px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="reveal" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '44px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div className="section-label"><span>Úrval</span></div>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: 'var(--white)', fontWeight: 300 }}>Vinsælustu vörurnar</h2>
            </div>
            <Link href="/products?featured=1" className="btn-ghost" style={{ padding: '10px 24px', fontSize: '0.68rem' }}>
              Sjá allt →
            </Link>
          </div>

          {featured.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--white-muted)', letterSpacing: '0.1em', border: '1px solid var(--black-border)' }}>
              <PxgLogo height={32} color="#222" />
              <p style={{ marginTop: '20px', fontSize: '0.85rem' }}>
                Engar vörur ennþá — <Link href="/admin" style={{ color: 'var(--gold)' }}>farðu í Admin til að setja upp</Link>
              </p>
            </div>
          ) : (
            <div className="product-grid">
              {featured.map(club => <ProductCard key={club.id} club={club} />)}
            </div>
          )}
        </div>
      </section>

      {/* ===== GEN8 FEATURE BANNER ===== */}
      <section style={{
        margin: '0 clamp(20px, 5vw, 60px) clamp(60px, 8vw, 100px)',
        position: 'relative', overflow: 'hidden',
        background: 'var(--black-card)',
        border: '1px solid var(--black-border)',
      }}>
        {/* Gold top border */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold) 30%, var(--gold) 70%, transparent)' }} />

        {/* Dot pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: `radial-gradient(circle, #C9A84C 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />

        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center', padding: 'clamp(48px, 7vw, 96px) clamp(32px, 6vw, 80px)' }}>
          <div className="reveal-left">
            <div className="section-label"><span>Nýjasta tækni</span></div>
            <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: 'var(--white)', marginBottom: '20px', lineHeight: 0.9, fontWeight: 300 }}>
              Gen8
              <br />
              <span className="gold-shimmer" style={{ fontStyle: 'italic' }}>Tímabilið<br />hefst</span>
            </h2>
            <p style={{ color: 'var(--white-muted)', lineHeight: 1.8, marginBottom: '36px', fontSize: '0.88rem' }}>
              Nýjasta kynslóð PXG kylfna — þynnsti face í sögu fyrirtækisins, explosive ball speed, og endurskoðað þyngdarkerfi.
            </p>
            <Link href="/products?category=driver" className="btn-gold btn-gold-fill" style={{ padding: '14px 36px' }}>
              Skoða Gen8 kylfur
            </Link>
          </div>
          <div className="reveal">
            {[
              { title: 'Ultra-þynnur face', desc: 'Ný framleiðsluaðferð sem gerir mögulegt enn þynnara face — explosive ball speed á öllum svæðum.' },
              { title: 'Endurskoðað þyngdarkerfi', desc: 'Patentaðar InertMass™ þyngdir endurstaðsettar fyrir optimal CG og maximum forgiveness.' },
              { title: 'Tour-prófað', desc: '200+ Tour leikendur nota PXG — þ.m.t. vinnarar á PGA Tour, LPGA og DP World Tour.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '20px', marginBottom: i < 2 ? '32px' : 0, padding: i < 2 ? '0 0 32px' : '0', borderBottom: i < 2 ? '1px solid var(--black-border)' : 'none' }}>
                <div style={{ color: 'var(--gold)', fontFamily: 'Cormorant Garamond', fontSize: '1.5rem', minWidth: '36px', flexShrink: 0, fontWeight: 300, opacity: 0.7 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <h4 style={{ color: 'var(--white)', fontSize: '0.82rem', letterSpacing: '0.12em', marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'Barlow Condensed', fontWeight: 600 }}>{item.title}</h4>
                  <p style={{ color: 'var(--white-muted)', fontSize: '0.82rem', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== NEW ARRIVALS ===== */}
      {newArrivals.length > 0 && (
        <section style={{ padding: '0 clamp(20px, 5vw, 60px) clamp(60px, 8vw, 100px)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div className="reveal" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div className="section-label"><span>Nýjungar</span></div>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: 'var(--white)', fontWeight: 300 }}>Nýlegar vörur</h2>
              </div>
              <Link href="/products?new=1" className="btn-ghost" style={{ padding: '10px 24px', fontSize: '0.68rem' }}>Sjá allt →</Link>
            </div>
            <div className="h-scroll" style={{ gap: '16px' }}>
              {newArrivals.map((club, i) => (
                <div key={club.id} className={`reveal reveal-d${Math.min(i + 1, 5)}`} style={{ minWidth: '240px', maxWidth: '280px', flexShrink: 0 }}>
                  <ProductCard club={club} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== ABOUT PXG ===== */}
      <section id="um-pxg" style={{ padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 60px)', background: 'var(--black-soft)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(40px, 8vw, 100px)', alignItems: 'center' }}>
            <div className="reveal-left">
              <div className="section-label"><span>Um PXG</span></div>
              <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', color: 'var(--white)', marginBottom: '28px', lineHeight: 1.0, fontWeight: 300 }}>
                Af hverju
                <br />
                <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>PXG?</span>
              </h2>
              <p style={{ color: 'var(--white-muted)', lineHeight: 1.8, marginBottom: '20px', fontSize: '0.88rem' }}>
                Parsons Xtreme Golf (PXG) var stofnað árið 2014 af Bob Parsons með eitt markmið: Búa til bestu golfkylfur í heiminum — án tillits til kostnaðar.
              </p>
              <p style={{ color: 'var(--white-muted)', lineHeight: 1.8, marginBottom: '36px', fontSize: '0.88rem' }}>
                Með patentaðar tækniúrlausnir, handsmíðaðar kylfur og óendanlegan leit að fullkomnun, hefur PXG breytt golfheiminum. Nú er hægt að fá þessar undrakylfur hér á Íslandi.
              </p>
              <Link href="/products" className="btn-gold">Skoða vörur</Link>
            </div>
            <div className="reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
              {[
                { label: 'Stofnað', value: '2014' },
                { label: 'Tour vinningar', value: '100+' },
                { label: 'Patent', value: '60+' },
                { label: 'Lönd', value: '30+' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: '#0a0a0a',
                  padding: 'clamp(24px, 4vw, 44px)',
                  textAlign: 'center',
                  border: '1px solid var(--black-border)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0, opacity: i % 2 === 0 ? 0.6 : 0,
                    background: 'linear-gradient(135deg, transparent 60%, rgba(201,168,76,0.04))',
                  }} />
                  <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'var(--gold)', fontWeight: 300, position: 'relative' }}>{s.value}</div>
                  <div style={{ color: 'var(--white-muted)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '8px', position: 'relative' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="samband" style={{ padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 60px)', background: 'var(--black-card)', borderTop: '1px solid var(--black-border)' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
          <div className="reveal">
            <div className="section-label" style={{ justifyContent: 'center' }}><span>Hafa samband</span></div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', color: 'var(--white)', marginBottom: '14px', fontWeight: 300 }}>Spyrðu okkur</h2>
            <p style={{ color: 'var(--white-muted)', marginBottom: '40px', lineHeight: 1.7, fontSize: '0.88rem' }}>
              Óviss um hvaða kylfur henta þér? Við hjálpum þér að finna réttu vörurnar.
            </p>
          </div>

          {contactStatus === 'sent' ? (
            <div className="form-success" style={{ border: '1px solid rgba(201,168,76,0.2)', padding: '48px', background: 'rgba(201,168,76,0.02)' }}>
              <div style={{ color: 'var(--gold)', fontSize: '2.5rem', marginBottom: '16px', fontFamily: 'Cormorant Garamond' }}>✓</div>
              <h3 style={{ color: 'var(--white)', fontSize: '1.5rem', marginBottom: '10px', fontWeight: 300 }}>Takk!</h3>
              <p style={{ color: 'var(--white-muted)', fontSize: '0.85rem', lineHeight: 1.7 }}>Við höfum samband við þig fljótlega.</p>
              <button onClick={() => setContactStatus('idle')} className="btn-gold" style={{ marginTop: '24px' }}>Senda annað</button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleContact} className="reveal"
              style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input className="input-dark" name="name" placeholder="Nafn" required />
                <input className="input-dark" name="email" type="email" placeholder="Netfang" required />
              </div>
              <textarea className="input-dark" name="message" placeholder="Hvernig getum við hjálpað þér?" rows={4} style={{ resize: 'vertical' }} />
              {contactStatus === 'error' && <p style={{ color: '#e55', fontSize: '0.78rem' }}>Eitthvað fór úrskeiðis. Reyndu aftur.</p>}
              <button type="submit" className="btn-gold btn-gold-fill" disabled={contactStatus === 'sending'} style={{ alignSelf: 'flex-start' }}>
                {contactStatus === 'sending' ? 'Sendi...' : 'Senda skilaboð'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: '#030303', borderTop: '1px solid var(--black-border)', padding: 'clamp(40px, 6vw, 60px) clamp(20px, 5vw, 60px) 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', marginBottom: '48px' }}>
            <div>
              <PxgLogo height={22} />
              <p style={{ color: 'var(--white-muted)', fontSize: '0.78rem', lineHeight: 1.8, marginTop: '20px', maxWidth: '260px' }}>
                Opinber dreifingaraðili PXG á Íslandi. Allar vörur eru handsmíðaðar og sendast frá Bandaríkjunum.
              </p>
            </div>
            {[
              { title: 'Vörur', links: [
                { label: 'Tæki', href: '/products?product_type=equipment' },
                { label: 'Klæðnaður', href: '/products?product_type=apparel' },
                { label: 'Aukahlutir', href: '/products?product_type=accessory' },
                { label: 'Nýjungar', href: '/products?new=1' },
              ]},
              { title: 'Upplýsingar', links: [
                { label: 'Um PXG', href: '/#um-pxg' },
                { label: 'Hafa samband', href: '/#samband' },
                { label: 'Skila stefna', href: '#' },
                { label: 'Sendingar', href: '#' },
              ]},
              { title: 'Þjónusta', links: [
                { label: 'PXG.com', href: 'https://www.pxg.com' },
                { label: 'Custom Fitting', href: '/#samband' },
                { label: 'Algengar spurningar', href: '/#samband' },
                { label: 'Admin', href: '/admin' },
              ]},
            ].map(col => (
              <div key={col.title}>
                <div style={{ color: 'var(--white)', fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '18px', fontWeight: 600 }}>{col.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {col.links.map(link => (
                    <a key={link.label} href={link.href}
                      style={{ color: 'var(--white-muted)', fontSize: '0.8rem', textDecoration: 'none', transition: 'color 0.2s', letterSpacing: '0.04em' }}
                      onMouseEnter={e => ((e.target as HTMLAnchorElement).style.color = 'var(--gold)')}
                      onMouseLeave={e => ((e.target as HTMLAnchorElement).style.color = 'var(--white-muted)')}>
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--black-border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ color: '#333', fontSize: '0.68rem', letterSpacing: '0.06em' }}>© 2025 PXG Ísland. Öll réttindi áskilin.</span>
            <span style={{ color: '#333', fontSize: '0.65rem', letterSpacing: '0.04em' }}>PXG is a registered trademark of Parsons Xtreme Golf, LLC.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
