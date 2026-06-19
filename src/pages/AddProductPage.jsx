import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { extractNutrientsFromImage } from '../lib/ocr'

export default function AddProductPage({ product, onDone, onCancel }) {
  const [name, setName] = useState(product?.name || '')
  const [brand, setBrand] = useState(product?.brand || '')
  const [expiry, setExpiry] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [ingredients, setIngredients] = useState(product?.ingredients || '')
  const [imageUrl, setImageUrl] = useState(product?.image_url || '')
  const [nutrients, setNutrients] = useState(product?.nutrients || {})
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ocrProgress, setOcrProgress] = useState(null) // null | 0-100
  const fileRef = useRef()
  const ocrRef = useRef()

  const isManual = !product?.barcode

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

  async function handleOcrScan(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrProgress(0)
    setError('')
    try {
      const extracted = await extractNutrientsFromImage(file, setOcrProgress)
      setNutrients(extracted)
    } catch {
      setError('Errore nella lettura della tabella. Riprova con una foto più nitida.')
    }
    setOcrProgress(null)
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
      nutrients,
      image_url: imageUrl || null,
    })
    if (dbErr) { setError(dbErr.message); setSaving(false); return }
    onDone()
  }

  const hasNutrients = Object.values(nutrients).some(v => v !== null && v !== undefined)

  const nutrientFields = [
    { key: 'energy_kcal', label: 'Energia', unit: 'kcal' },
    { key: 'fat', label: 'Grassi', unit: 'g' },
    { key: 'saturated_fat', label: 'di cui saturi', unit: 'g' },
    { key: 'carbohydrates', label: 'Carboidrati', unit: 'g' },
    { key: 'sugars', label: 'di cui zuccheri', unit: 'g' },
    { key: 'fiber', label: 'Fibre', unit: 'g' },
    { key: 'proteins', label: 'Proteine', unit: 'g' },
    { key: 'salt', label: 'Sale', unit: 'g' },
  ]

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
        <button onClick={onCancel} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '4px 0', fontWeight: 400 }}>← Indietro</button>
        <span style={{ fontWeight: 700, fontSize: 17, flex: 1 }}>
          {isManual ? '✏️ Inserimento manuale' : '➕ Aggiungi prodotto'}
        </span>
      </div>

      <form onSubmit={handleSave} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Foto prodotto */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {imageUrl ? (
            <img src={imageUrl} alt="" style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 12, border: '1px solid var(--border)' }} />
          ) : (
            <div onClick={() => fileRef.current?.click()}
              style={{ width: 120, height: 120, borderRadius: 12, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, cursor: 'pointer', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: 32 }}>📷</span>
              <span style={{ fontSize: 12 }}>Foto prodotto</span>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImageUpload} />
          {imageUrl && (
            <button type="button" onClick={() => fileRef.current?.click()} style={{ background: 'var(--gray-light)', color: 'var(--text)', fontSize: 13, padding: '6px 14px' }}>
              {uploading ? 'Caricamento...' : 'Cambia foto'}
            </button>
          )}
        </div>

        {/* Nome */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Nome prodotto *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="es. Latte intero" required />
        </div>

        {/* Marca */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Marca</label>
          <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="es. Parmalat" />
        </div>

        {/* Scadenza + Quantità */}
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

        {/* Ingredienti */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Ingredienti</label>
          <textarea value={ingredients} onChange={e => setIngredients(e.target.value)} rows={3} placeholder="Opzionale" style={{ resize: 'vertical', fontSize: 13 }} />
        </div>

        {/* Valori nutrizionali */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Valori nutrizionali (per 100g)</label>
          </div>

          {/* Bottone OCR */}
          <input ref={ocrRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleOcrScan} />
          <button type="button" onClick={() => ocrRef.current?.click()}
            style={{ background: 'var(--green-light)', color: 'var(--green)', fontSize: 13, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            📸 Fotografa tabella nutrizionale
          </button>

          {ocrProgress !== null && (
            <div style={{ background: 'var(--gray-light)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ background: 'var(--green)', height: 6, width: `${ocrProgress}%`, transition: 'width 0.3s' }} />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px 10px' }}>
                Lettura in corso... {ocrProgress}%
              </p>
            </div>
          )}

          {/* Campi modificabili */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {nutrientFields.map(({ key, label, unit }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>{label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={nutrients[key] ?? ''}
                    onChange={e => setNutrients(n => ({ ...n, [key]: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                    placeholder="—"
                    style={{ width: 80, textAlign: 'right', padding: '6px 8px', fontSize: 13 }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 28 }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}

        <button type="submit" disabled={saving} style={{ background: 'var(--green)', color: '#fff', marginTop: 4 }}>
          {saving ? 'Salvataggio...' : 'Aggiungi alla dispensa'}
        </button>
      </form>
    </div>
  )
}
