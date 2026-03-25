'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useCart } from './CartContext'
import { PxgLogo } from './PxgLogo'

export function CartDrawer() {
  const { items, count, subtotal, removeItem, updateQty, closeCart, isOpen } = useCart()

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.7)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'all' : 'none',
          transition: 'opacity 0.3s ease',
          backdropFilter: isOpen ? 'blur(4px)' : 'none',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
        width: 'min(420px, 100vw)',
        background: '#0a0a0a',
        borderLeft: '1px solid var(--black-border)',
        display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px', borderBottom: '1px solid var(--black-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ color: 'var(--white)', fontSize: '0.9rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Barlow Condensed', fontWeight: 600 }}>
              Körfa
            </span>
            {count > 0 && (
              <span style={{ marginLeft: '10px', background: 'var(--gold)', color: 'var(--black)', fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', letterSpacing: '0.08em' }}>
                {count}
              </span>
            )}
          </div>
          <button onClick={closeCart} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--white-muted)', fontSize: '1.4rem', lineHeight: 1, padding: '4px' }}>
            ✕
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 28px' }}>
              <PxgLogo height={28} color="#1e1e1e" />
              <p style={{ color: 'var(--white-muted)', fontSize: '0.85rem', marginTop: '20px', letterSpacing: '0.08em' }}>
                Körfan þín er tóm
              </p>
              <button onClick={closeCart} className="btn-gold" style={{ marginTop: '24px', padding: '10px 28px', fontSize: '0.7rem' }}>
                Halda áfram að versla
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.id}__${item.variant}`} style={{
                display: 'flex', gap: '14px', padding: '16px 28px',
                borderBottom: '1px solid var(--black-border)',
              }}>
                {/* Image */}
                <div style={{ width: '72px', height: '72px', background: '#060606', border: '1px solid var(--black-border)', flexShrink: 0, overflow: 'hidden' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PxgLogo height={14} color="#1e1e1e" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--gold)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {item.category}
                  </div>
                  <Link href={`/products/${item.slug}`} onClick={closeCart}
                    style={{ color: 'var(--white)', fontSize: '0.9rem', fontFamily: 'Cormorant Garamond', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </Link>
                  {item.variant && (
                    <div style={{ color: 'var(--white-muted)', fontSize: '0.72rem', marginTop: '2px', letterSpacing: '0.05em' }}>{item.variant}</div>
                  )}

                  {/* Qty + Price row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--black-border)' }}>
                      <button onClick={() => updateQty(item.id, item.quantity - 1, item.variant)}
                        style={{ background: 'none', border: 'none', color: 'var(--white-muted)', cursor: 'pointer', width: '28px', height: '28px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ color: 'var(--white)', fontSize: '0.8rem', width: '24px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1, item.variant)}
                        style={{ background: 'none', border: 'none', color: 'var(--white-muted)', cursor: 'pointer', width: '28px', height: '28px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: 'var(--gold)', fontFamily: 'Cormorant Garamond', fontSize: '1.1rem', fontWeight: 300 }}>
                        {(item.price_isk * item.quantity).toLocaleString('is-IS')} kr.
                      </span>
                      <button onClick={() => removeItem(item.id, item.variant)}
                        style={{ background: 'none', border: 'none', color: 'var(--white-muted)', cursor: 'pointer', fontSize: '0.9rem', padding: '2px', lineHeight: 1, transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#e55')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--white-muted)')}>✕</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '20px 28px', borderTop: '1px solid var(--black-border)', background: '#060606' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: 'var(--white-muted)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Samtals</span>
              <span style={{ color: 'var(--white)', fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', fontWeight: 300 }}>
                {subtotal.toLocaleString('is-IS')} kr.
              </span>
            </div>
            <p style={{ color: 'var(--white-muted)', fontSize: '0.68rem', marginBottom: '16px', letterSpacing: '0.05em', lineHeight: 1.5 }}>
              Sendingarkostnaður er reiknaður við checkout. Hægt að nota afsláttarkóða við greiðslu.
            </p>
            <Link href="/checkout" onClick={closeCart} className="btn-gold btn-gold-fill"
              style={{ display: 'flex', justifyContent: 'center', padding: '14px', fontSize: '0.75rem', letterSpacing: '0.2em', marginBottom: '10px' }}>
              Greiða — {subtotal.toLocaleString('is-IS')} kr.
            </Link>
            <button onClick={closeCart} className="btn-gold"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '10px', fontSize: '0.7rem' }}>
              Halda áfram að versla
            </button>
          </div>
        )}
      </div>
    </>
  )
}
