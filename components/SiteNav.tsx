'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PxgLogo } from './PxgLogo'
import { useCart } from './CartContext'

const NAV_CATEGORIES = [
  { label: 'Tæki', items: [
    { name: 'Drivers', slug: 'driver' },
    { name: 'Fairway Woods', slug: 'fairway' },
    { name: 'Hybrids', slug: 'hybrid' },
    { name: 'Járn', slug: 'iron' },
    { name: 'Wedges', slug: 'wedge' },
    { name: 'Putters', slug: 'putter' },
  ]},
  { label: 'Klæðnaður', items: [
    { name: 'Herraleikföt', slug: 'mens-apparel' },
    { name: 'Damaleikföt', slug: 'womens-apparel' },
  ]},
  { label: 'Aukahlutir', items: [
    { name: 'Golf Töskur', slug: 'bags' },
    { name: 'Aukahlutir', slug: 'accessories' },
  ]},
]

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { count, openCart } = useCart()
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const isTransparent = pathname === '/' && !scrolled

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: isTransparent ? 'transparent' : 'rgba(0,0,0,0.97)',
        borderBottom: isTransparent ? 'none' : '1px solid var(--black-border)',
        backdropFilter: isTransparent ? 'none' : 'blur(12px)',
        transition: 'all 0.35s ease',
        height: '68px',
      }}
      onMouseLeave={() => setMenuOpen(false)}
    >
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 40px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PxgLogo height={20} />
          <span style={{ color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.35em', textTransform: 'uppercase', borderLeft: '1px solid var(--black-border)', paddingLeft: '12px', fontWeight: 300 }}>
            Ísland
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div
            onMouseEnter={() => setMenuOpen(true)}
            style={{ position: 'relative' }}
          >
            <button
              className={`nav-link${menuOpen ? ' active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Barlow Condensed' }}
            >
              Vörur ↓
            </button>
          </div>
          <Link href="/products" className={`nav-link${pathname === '/products' ? ' active' : ''}`}>Allar vörur</Link>
          <a href="/#um-pxg" className="nav-link">Um PXG</a>
          <a href="/#samband" className="nav-link">Samband</a>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={openCart}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--white-muted)', position: 'relative', padding: '4px', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--white)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--white-muted)')}
            aria-label="Opna körfu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>
          <Link href="/admin" style={{ color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textDecoration: 'none', textTransform: 'uppercase', transition: 'color 0.2s' }}
            onMouseEnter={e => ((e.target as HTMLAnchorElement).style.color = 'var(--white)')}
            onMouseLeave={e => ((e.target as HTMLAnchorElement).style.color = 'var(--white-muted)')}>
            Admin
          </Link>
        </div>
      </div>

      {/* Mega menu */}
      <div className={`mega-menu${menuOpen ? ' open' : ''}`} onMouseEnter={() => setMenuOpen(true)}>
        {NAV_CATEGORIES.map(group => (
          <div key={group.label}>
            <div style={{ color: 'var(--gold)', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 600 }}>
              {group.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {group.items.map(item => (
                <Link
                  key={item.slug}
                  href={`/products?category=${item.slug}`}
                  onClick={() => setMenuOpen(false)}
                  style={{ color: 'var(--white-muted)', fontSize: '0.85rem', textDecoration: 'none', letterSpacing: '0.05em', fontFamily: 'Cormorant Garamond', transition: 'color 0.2s' }}
                  onMouseEnter={e => ((e.target as HTMLAnchorElement).style.color = 'var(--white)')}
                  onMouseLeave={e => ((e.target as HTMLAnchorElement).style.color = 'var(--white-muted)')}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'flex-end' }}>
          <div style={{ color: 'var(--gold)', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Fljótlegar tenglar</div>
          <Link href="/products" onClick={() => setMenuOpen(false)} className="btn-gold" style={{ padding: '10px 24px', fontSize: '0.68rem' }}>Skoða allar vörur</Link>
          <a href="/#samband" onClick={() => setMenuOpen(false)} className="btn-ghost" style={{ padding: '10px 24px', fontSize: '0.68rem' }}>Hafa samband</a>
        </div>
      </div>
    </nav>
  )
}
