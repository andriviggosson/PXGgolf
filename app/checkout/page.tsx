'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/CartContext'
import { SiteNav } from '@/components/SiteNav'
import { PxgLogo } from '@/components/PxgLogo'
import { validateDiscountCode, calculateDiscount, createOrder } from '@/lib/data'
import { DiscountCode } from '@/lib/supabase'

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart()
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' })
  const [discountInput, setDiscountInput] = useState('')
  const [discount, setDiscount] = useState<DiscountCode | null>(null)
  const [discountError, setDiscountError] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [orderDone, setOrderDone] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState('')

  const discountAmount = discount ? calculateDiscount(discount, subtotal) : 0
  const total = subtotal - discountAmount

  const applyCode = async () => {
    if (!discountInput.trim()) return
    setDiscountLoading(true)
    setDiscountError('')
    const result = await validateDiscountCode(discountInput.trim(), subtotal)
    if (result.valid && result.discount) {
      setDiscount(result.discount)
    } else {
      setDiscountError(result.error ?? 'Ógildur kóði')
      setDiscount(null)
    }
    setDiscountLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const order = await createOrder({
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        shippingAddress: form.address,
        items: items.map(i => ({ id: i.id, name: i.name, slug: i.slug, price_isk: i.price_isk, quantity: i.quantity, variant: i.variant, image_url: i.image_url })),
        subtotalIsk: subtotal,
        discountIsk: discountAmount,
        discountCode: discount?.code ?? null,
        totalIsk: total,
        notes: form.notes,
      })
      setOrderDone(order.order_number)
      clear()
    } catch (err) {
      setSubmitError('Eitthvað fór úrskeiðis. Reyndu aftur eða hafðu samband við okkur.')
    }
    setSubmitting(false)
  }

  if (orderDone) return (
    <div style={{ background: 'var(--black)', minHeight: '100vh' }}>
      <SiteNav />
      <div style={{ paddingTop: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '60px 40px', maxWidth: '500px' }}>
          <div style={{ color: 'var(--gold)', fontSize: '4rem', fontFamily: 'Cormorant Garamond', marginBottom: '24px' }}>✓</div>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--white)', marginBottom: '16px', fontWeight: 300 }}>Pöntun móttekin!</h1>
          <p style={{ color: 'var(--gold)', fontSize: '0.8rem', letterSpacing: '0.2em', marginBottom: '24px' }}>
            PÖNTUNARNÚMER: {orderDone}
          </p>
          <p style={{ color: 'var(--white-muted)', lineHeight: 1.7, marginBottom: '40px', fontSize: '0.88rem' }}>
            Við höfum sent staðfestingu á netfangið þitt. Við munum hafa samband við þig fljótlega til að staðfesta pöntunina og ræða sendingarupplýsingar.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/products" className="btn-gold btn-gold-fill">Halda áfram að versla</Link>
            <Link href="/" className="btn-ghost">Forsíða</Link>
          </div>
        </div>
      </div>
    </div>
  )

  if (items.length === 0) return (
    <div style={{ background: 'var(--black)', minHeight: '100vh' }}>
      <SiteNav />
      <div style={{ paddingTop: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '60px 40px' }}>
          <PxgLogo height={36} color="black" />
          <h2 style={{ color: 'var(--white)', marginTop: '24px', marginBottom: '12px', fontSize: '1.8rem' }}>Körfan er tóm</h2>
          <Link href="/products" className="btn-gold btn-gold-fill" style={{ marginTop: '8px' }}>Skoða vörur</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh' }}>
      <SiteNav />
      <div style={{ paddingTop: '68px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 40px' }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <div className="breadcrumb" style={{ marginBottom: '12px' }}>
              <Link href="/">Forsíða</Link><span>—</span>
              <Link href="/products">Vörur</Link><span>—</span>
              <span style={{ color: 'var(--white)' }}>Greiðsla</span>
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--white)', fontWeight: 300 }}>Greiðsla</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px', alignItems: 'start' }}>

              {/* Left: Customer info */}
              <div>
                {/* Contact */}
                <div style={{ background: 'var(--black-card)', border: '1px solid var(--black-border)', padding: '32px', marginBottom: '20px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-1px', left: '32px', right: '32px', height: '1px', background: 'var(--gold)' }} />
                  <h2 style={{ color: 'var(--white)', fontSize: '1.3rem', marginBottom: '20px' }}>Samskiptaupplýsingar</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Fullt nafn *</label>
                      <input className="input-dark" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Jón Jónsson" />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Netfang *</label>
                      <input className="input-dark" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="jon@email.is" />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Símanúmer</label>
                    <input className="input-dark" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+354 555 1234" />
                  </div>
                </div>

                {/* Shipping */}
                <div style={{ background: 'var(--black-card)', border: '1px solid var(--black-border)', padding: '32px', marginBottom: '20px' }}>
                  <h2 style={{ color: 'var(--white)', fontSize: '1.3rem', marginBottom: '20px' }}>Sendingarupplýsingar</h2>
                  <div>
                    <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Heimilisfang *</label>
                    <textarea className="input-dark" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} required placeholder="Laugavegur 1&#10;101 Reykjavík" rows={3} style={{ resize: 'vertical' }} />
                  </div>
                  <p style={{ color: 'var(--white-muted)', fontSize: '0.72rem', marginTop: '10px', letterSpacing: '0.04em', lineHeight: 1.5 }}>
                    Sendingarkostnaður er 0–3.500 kr. eftir þyngd. Við munum staðfesta sendingarupplýsingar í tölvupósti.
                  </p>
                </div>

                {/* Notes */}
                <div style={{ background: 'var(--black-card)', border: '1px solid var(--black-border)', padding: '32px' }}>
                  <h2 style={{ color: 'var(--white)', fontSize: '1.3rem', marginBottom: '20px' }}>Athugasemd (valfrjálst)</h2>
                  <textarea className="input-dark" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="T.d. sérstakar óskir um pöntun..." rows={3} style={{ resize: 'vertical' }} />
                </div>
              </div>

              {/* Right: Order summary */}
              <div style={{ position: 'sticky', top: '88px' }}>
                <div style={{ background: 'var(--black-card)', border: '1px solid var(--black-border)', padding: '28px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-1px', left: '0', right: '0', height: '1px', background: 'var(--gold)' }} />
                  <h2 style={{ color: 'var(--white)', fontSize: '1.2rem', marginBottom: '20px' }}>Pöntun</h2>

                  {/* Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {items.map(item => (
                      <div key={`${item.id}__${item.variant}`} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ width: '52px', height: '52px', background: '#060606', border: '1px solid var(--black-border)', flexShrink: 0, overflow: 'hidden' }}>
                          {item.image_url
                            ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PxgLogo height={12} color="black" /></div>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: 'var(--white)', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                          {item.variant && <div style={{ color: 'var(--white-muted)', fontSize: '0.7rem' }}>{item.variant}</div>}
                          <div style={{ color: 'var(--white-muted)', fontSize: '0.7rem' }}>Magn: {item.quantity}</div>
                        </div>
                        <div style={{ color: 'var(--gold)', fontSize: '0.9rem', fontFamily: 'Cormorant Garamond', flexShrink: 0 }}>
                          {(item.price_isk * item.quantity).toLocaleString('is-IS')} kr.
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Discount code */}
                  <div style={{ borderTop: '1px solid var(--black-border)', paddingTop: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        className="input-dark"
                        value={discountInput}
                        onChange={e => { setDiscountInput(e.target.value.toUpperCase()); setDiscountError('') }}
                        placeholder="Afsláttarkóði"
                        style={{ flex: 1, padding: '10px 12px', fontSize: '0.78rem' }}
                        disabled={!!discount}
                      />
                      {discount ? (
                        <button type="button" onClick={() => { setDiscount(null); setDiscountInput('') }} className="btn-ghost" style={{ padding: '10px 14px', fontSize: '0.68rem', flexShrink: 0 }}>✕</button>
                      ) : (
                        <button type="button" onClick={applyCode} className="btn-gold" style={{ padding: '10px 16px', fontSize: '0.68rem', flexShrink: 0 }} disabled={discountLoading}>
                          {discountLoading ? '...' : 'Nota'}
                        </button>
                      )}
                    </div>
                    {discountError && <p style={{ color: '#e55', fontSize: '0.72rem' }}>{discountError}</p>}
                    {discount && <p style={{ color: '#5c5', fontSize: '0.72rem' }}>✓ {discount.description ?? `${discount.type === 'percentage' ? discount.value + '%' : discount.value.toLocaleString('is-IS') + ' kr.'} afsláttur`}</p>}
                  </div>

                  {/* Totals */}
                  <div style={{ borderTop: '1px solid var(--black-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--white-muted)', fontSize: '0.78rem' }}>Millisamtals</span>
                      <span style={{ color: 'var(--white)', fontSize: '0.78rem' }}>{subtotal.toLocaleString('is-IS')} kr.</span>
                    </div>
                    {discountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#5c5', fontSize: '0.78rem' }}>Afsláttur ({discount?.code})</span>
                        <span style={{ color: '#5c5', fontSize: '0.78rem' }}>−{discountAmount.toLocaleString('is-IS')} kr.</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--white-muted)', fontSize: '0.78rem' }}>Sending</span>
                      <span style={{ color: 'var(--white-muted)', fontSize: '0.78rem' }}>Verður staðfest</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--black-border)', paddingTop: '12px', marginTop: '4px' }}>
                      <span style={{ color: 'var(--white)', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Samtals</span>
                      <span style={{ color: 'var(--gold)', fontFamily: 'Cormorant Garamond', fontSize: '1.5rem', fontWeight: 300 }}>{total.toLocaleString('is-IS')} kr.</span>
                    </div>
                  </div>

                  {submitError && <p style={{ color: '#e55', fontSize: '0.75rem', marginTop: '12px', lineHeight: 1.5 }}>{submitError}</p>}

                  <button type="submit" className="btn-gold btn-gold-fill"
                    style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '0.75rem', marginTop: '20px' }}
                    disabled={submitting}>
                    {submitting ? <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', marginRight: '8px' }} />Sendir pöntun...</> : `Senda pöntun — ${total.toLocaleString('is-IS')} kr.`}
                  </button>

                  <p style={{ color: 'var(--white-muted)', fontSize: '0.65rem', textAlign: 'center', marginTop: '12px', lineHeight: 1.5, letterSpacing: '0.04em' }}>
                    Með því að senda pöntun samþykkir þú skilmála okkar. Við greiðum í gegnum reikning.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
