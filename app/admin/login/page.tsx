'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Rangt netfang eða lykilorð.')
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div style={{
      background: 'var(--black)', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            width: '48px', height: '48px', background: 'var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <span style={{ fontFamily: 'Cormorant Garamond', fontWeight: 700, fontSize: '1.4rem', color: 'var(--black)' }}>P</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--white)', marginBottom: '8px' }}>PXG Admin</h1>
          <p style={{ color: 'var(--white-muted)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Skráðu þig inn til að halda áfram</p>
        </div>

        {/* Form */}
        <div style={{
          background: 'var(--black-card)',
          border: '1px solid var(--black-border)',
          padding: '40px',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: '-1px', left: '40px', right: '40px', height: '2px', background: 'var(--gold)' }} />

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Netfang
              </label>
              <input
                className="input-dark"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="þú@dæmi.is"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Lykilorð
              </label>
              <input
                className="input-dark"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p style={{ color: '#ff6b6b', fontSize: '0.8rem', letterSpacing: '0.05em' }}>{error}</p>
            )}

            <button
              type="submit"
              className="btn-gold btn-gold-fill"
              disabled={loading}
              style={{ marginTop: '8px', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Hinkraðu...' : 'Skrá inn'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
