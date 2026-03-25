'use client'
import { useState, useEffect } from 'react'
import { supabase, SiteContent } from '@/lib/supabase'

const SECTIONS = [
  { key: 'hero', label: 'Hero' },
  { key: 'stats', label: 'Tölur' },
  { key: 'about', label: 'Um PXG' },
  { key: 'contact', label: 'Samband' },
  { key: 'footer', label: 'Footer' },
]

export default function ContentEditor() {
  const [content, setContent] = useState<SiteContent[]>([])
  const [activeSection, setActiveSection] = useState('hero')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadContent() }, [])

  const loadContent = async () => {
    const { data } = await supabase.from('site_content').select('*').order('section')
    setContent(data || [])
  }

  const updateValue = (id: string, value: string) => {
    setContent(prev => prev.map(item => item.id === id ? { ...item, value } : item))
    setSaved(false)
  }

  const saveAll = async () => {
    setSaving(true)
    const items = content.filter(c => c.section === activeSection)
    for (const item of items) {
      await supabase.from('site_content').update({ value: item.value }).eq('id', item.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const sectionContent = content.filter(c => c.section === activeSection)

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)} style={{
            padding: '8px 18px', fontSize: '0.7rem', letterSpacing: '0.15em',
            textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
            background: activeSection === s.key ? 'var(--gold)' : 'transparent',
            color: activeSection === s.key ? '#000' : 'var(--white-muted)',
            border: `1px solid ${activeSection === s.key ? 'var(--gold)' : 'var(--black-border)'}`,
            fontFamily: 'Barlow Condensed',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sectionContent.map(item => (
          <div key={item.id}>
            <label style={{ display: 'block', color: 'var(--white-muted)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
              {item.key.replace(/_/g, ' ')}
            </label>
            {item.value.length > 80 || item.key.includes('paragraph') || item.key.includes('desc') || item.key.includes('description') ? (
              <textarea className="input-dark" value={item.value} onChange={e => updateValue(item.id, e.target.value)} rows={3} style={{ resize: 'vertical' }} />
            ) : (
              <input className="input-dark" value={item.value} onChange={e => updateValue(item.id, e.target.value)} />
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={saveAll} disabled={saving} className="btn-gold btn-gold-fill" style={{ opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Vista...' : 'Vista breytingar'}
        </button>
        {saved && <span style={{ color: '#4caf50', fontSize: '0.8rem' }}>Vistað!</span>}
      </div>
    </div>
  )
}
