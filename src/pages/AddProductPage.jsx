import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function AddProductPage({ product, onDone, onCancel }) {
  const [name, setName] = useState(product?.name || '')
  const [brand, setBrand] = useState(product?.brand || '')
  const [expiry, setExpiry] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [ingredients, setIngredients] = useState(product?.ingredients || '')
  const [imageUrl, setImageUrl] = useState(product?.image_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('product-images').upload(path, file)
    if (upErr) { setError('Errore upload immagine'); setUploading(false); return }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    setImageUrl(data.publicUrl)
    setUploading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Inserisci il nome del prodotto'); return }
    if (!expiry) { setError('Inserisci la data di scadenza'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error: dbErr } = await supabase.from('pantry_items').insert({
      user_id: user.id,
      barcode: product?.barcode || null,
      name: name.trim(),
      brand: brand.trim(),
      expiry_date: expiry,
      quantity: parseInt(quantity) || 1,
      ingredients,
      nutrients: product?.nutrients || {},
      image_url: imageUrl || null,
    })
    if (dbErr) { setError(dbErr.message); setSaving(false); return }
    onDone()
  }

  const nutrients = product?.nutrients || {}
  const hasNutrients = Object.values(nutrients).some(v => v !== null)

  return (
    <div style={{ padding: '0 0 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
        <button onClick={onCancel} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '4px 0', fontWeight: 400 }}>← Indietro</button>
        <span style={{ fontWeight: 700, fontSize: 17, flex: 1 }}>Aggiungi prodotto</span>
      </div>

      <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Immagine */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {imageUrl ? (
            <img src={imageUrl} alt="" style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 12, border: '1px solid var(--border)' }} />
          ) : (
            <div onClick={() => fileRef.current?.click()}
              style={{ width: 120, height: 120, borderRadius: 12, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, cursor: 'pointer', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: 32 }}>📷</span>
              <span style={{ fontSize: 12 }}>Aggiungi foto</span>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImageUpload} />
          {imageUrl && <button type="button" onClick={() => fileRef.current?.click()} style={{ background: 'var(--gray-light)', color: 'var(--text)', fontSize: 13, padding: '6px 14px' }}>
            {uploading ? 'Caricamento...' : 'Cambia foto'}
          </button>}
        </div>

        {/* Campi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Nome prodotto *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="es. Latte intero" required />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Marca</label>
          <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="es. Parmalat" />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Scadenza *</label>
            <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} required />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Quantità</label>
            <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
        </div>

        {ingredients && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Ingredienti</label>
            <textarea value={ingredients} onChange={e => setIngredients(e.target.value)} rows={4} style={{ resize: 'vertical', fontSize: 13 }} />
          </div>
        )}

        {hasNutrients && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Valori nutrizionali (per 100g)</p>
            <div style={{ background: 'var(--gray-light)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['Energia', nutrients.energy_kcal, 'kcal'],
                ['Grassi', nutrients.fat, 'g'],
                ['di cui saturi', nutrients.saturated_fat, 'g'],
                ['Carboidrati', nutrients.carbohydrates, 'g'],
                ['di cui zuccheri', nutrients.sugars, 'g'],
                ['Fibre', nutrients.fiber, 'g'],
                ['Proteine', nutrients.proteins, 'g'],
                ['Sale', nutrients.salt, 'g'],
              ].filter(([, v]) => v !== null).map(([label, value, unit]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{Number(value).toFixed(1)} {unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}

        <button type="submit" disabled={saving} style={{ background: 'var(--green)', color: '#fff', marginTop: 4 }}>
          {saving ? 'Salvataggio...' : 'Aggiungi alla dispensa'}
        </button>
      </form>
    </div>
  )
}
