import { useState } from 'react'

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0)
  const exp = new Date(dateStr); exp.setHours(0,0,0,0)
  return Math.round((exp - today) / 86400000)
}

function ExpiryBadge({ days }) {
  if (days < 0) return <span style={{ background: 'var(--red-light)', color: 'var(--red)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>Scaduto {Math.abs(days)}g fa</span>
  if (days === 0) return <span style={{ background: 'var(--red-light)', color: 'var(--red)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>Scade oggi!</span>
  if (days <= 3) return <span style={{ background: 'var(--yellow-light)', color: 'var(--yellow)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>Scade tra {days}g</span>
  return <span style={{ background: 'var(--green-light)', color: 'var(--green)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>Scade tra {days}g</span>
}

export default function ProductCard({ item, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const days = daysUntil(item.expiry_date)
  const hasNutrients = item.nutrients && Object.values(item.nutrients).some(v => v !== null)

  return (
    <div style={{ border: '1.5px solid var(--border)', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
      <div style={{ display: 'flex', gap: 12, padding: 14, cursor: 'pointer', alignItems: 'flex-start' }} onClick={() => setExpanded(!expanded)}>
        {item.image_url ? (
          <img src={item.image_url} alt="" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 8, flexShrink: 0, border: '1px solid var(--border)' }} />
        ) : (
          <div style={{ width: 60, height: 60, background: 'var(--gray-light)', borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🥫</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
          {item.brand && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.brand}</p>}
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ExpiryBadge days={days} />
            {item.quantity > 1 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>x{item.quantity}</span>}
          </div>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Scadenza: <strong style={{ color: 'var(--text)' }}>{new Date(item.expiry_date).toLocaleDateString('it-IT')}</strong>
          </div>

          {item.ingredients && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Ingredienti</p>
              <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{item.ingredients}</p>
            </div>
          )}

          {hasNutrients && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Valori nutrizionali (per 100g)</p>
              <div style={{ background: 'var(--gray-light)', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  ['Energia', item.nutrients.energy_kcal, 'kcal'],
                  ['Grassi', item.nutrients.fat, 'g'],
                  ['di cui saturi', item.nutrients.saturated_fat, 'g'],
                  ['Carboidrati', item.nutrients.carbohydrates, 'g'],
                  ['di cui zuccheri', item.nutrients.sugars, 'g'],
                  ['Fibre', item.nutrients.fiber, 'g'],
                  ['Proteine', item.nutrients.proteins, 'g'],
                  ['Sale', item.nutrients.salt, 'g'],
                ].filter(([, v]) => v !== null).map(([label, value, unit]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{Number(value).toFixed(1)} {unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ background: 'var(--red-light)', color: 'var(--red)', fontSize: 13 }}>
              Rimuovi dalla dispensa
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onDelete(item.id)} style={{ flex: 1, background: 'var(--red)', color: '#fff', fontSize: 13 }}>Conferma</button>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, background: 'var(--gray-light)', color: 'var(--text)', fontSize: 13 }}>Annulla</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
