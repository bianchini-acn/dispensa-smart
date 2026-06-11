import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0)
  const exp = new Date(dateStr); exp.setHours(0,0,0,0)
  return Math.round((exp - today) / 86400000)
}

export default function PantryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | urgent | ok | expired

  useEffect(() => { loadItems() }, [])

  async function loadItems() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('pantry_items').select('*').eq('user_id', user.id).order('expiry_date', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }

  async function handleDelete(id) {
    await supabase.from('pantry_items').delete().eq('id', id)
    setItems(items.filter(i => i.id !== id))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const filtered = items.filter(item => {
    const d = daysUntil(item.expiry_date)
    if (filter === 'expired') return d < 0
    if (filter === 'urgent') return d >= 0 && d <= 3
    if (filter === 'ok') return d > 3
    return true
  })

  const expiredCount = items.filter(i => daysUntil(i.expiry_date) < 0).length
  const urgentCount = items.filter(i => { const d = daysUntil(i.expiry_date); return d >= 0 && d <= 3 }).length

  return (
    <div>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>🥦 Dispensa</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{items.length} prodotti</p>
        </div>
        <button onClick={handleLogout} style={{ background: 'var(--gray-light)', color: 'var(--text-muted)', fontSize: 13, padding: '6px 12px' }}>Esci</button>
      </div>

      {(expiredCount > 0 || urgentCount > 0) && (
        <div style={{ margin: '12px 20px', background: urgentCount > 0 ? 'var(--yellow-light)' : 'var(--red-light)', borderRadius: 10, padding: '10px 14px' }}>
          {expiredCount > 0 && <p style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600 }}>⚠️ {expiredCount} prodotto/i scaduto/i</p>}
          {urgentCount > 0 && <p style={{ color: 'var(--yellow)', fontSize: 13, fontWeight: 600 }}>🔔 {urgentCount} prodotto/i in scadenza entro 3 giorni</p>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, padding: '12px 20px', overflowX: 'auto' }}>
        {[['all', 'Tutti'], ['urgent', '⏰ In scadenza'], ['expired', '❌ Scaduti'], ['ok', '✅ OK']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ background: filter === val ? 'var(--green)' : 'var(--gray-light)', color: filter === val ? '#fff' : 'var(--text)', whiteSpace: 'nowrap', fontSize: 13, padding: '7px 14px', flexShrink: 0 }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Caricamento...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
            <p style={{ fontWeight: 600 }}>Nessun prodotto</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Scansiona un prodotto per aggiungerlo</p>
          </div>
        ) : (
          filtered.map(item => <ProductCard key={item.id} item={item} onDelete={handleDelete} />)
        )}
      </div>
    </div>
  )
}
