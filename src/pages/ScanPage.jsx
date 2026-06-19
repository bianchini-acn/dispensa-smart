import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { fetchProductByBarcode } from '../lib/openfoodfacts'

export default function ScanPage({ onScanned, onCancel }) {
  const [status, setStatus] = useState('scanning') // scanning | loading | error
  const [errorMsg, setErrorMsg] = useState('')
  const videoRef = useRef(null)
  const doneRef = useRef(false)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()

    reader.decodeFromConstraints(
      { video: { facingMode: 'environment' } },
      videoRef.current,
      async (result, err) => {
        if (!result || doneRef.current) return
        doneRef.current = true
        setStatus('loading')
        const barcode = result.getText()
        try {
          const product = await fetchProductByBarcode(barcode)
          onScanned(product || { barcode, name: '', brand: '', image_url: null, ingredients: '', nutrients: {} })
        } catch {
          onScanned({ barcode, name: '', brand: '', image_url: null, ingredients: '', nutrients: {} })
        }
      }
    ).catch(err => {
      setStatus('error')
      setErrorMsg(err?.message || 'Impossibile accedere alla fotocamera')
    })

    return () => { BrowserMultiFormatReader.releaseAllStreams() }
  }, [])

  function handleManual() {
    BrowserMultiFormatReader.releaseAllStreams()
    onScanned({ barcode: null, name: '', brand: '', image_url: null, ingredients: '', nutrients: {} })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#000' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#111' }}>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 17 }}>Scansiona barcode</span>
        <button onClick={onCancel} style={{ background: 'transparent', color: '#aaa', padding: '4px 8px', fontSize: 15 }}>✕ Annulla</button>
      </div>

      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted playsInline />

        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: 260, height: 120, border: '2px solid rgba(255,255,255,0.8)', borderRadius: 8, boxShadow: '0 0 0 1000px rgba(0,0,0,0.4)' }} />
        </div>

        {status === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#fff', fontSize: 16 }}>Ricerca prodotto...</div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
            <div style={{ color: '#f87171', fontSize: 15, textAlign: 'center' }}>{errorMsg}</div>
            <button onClick={onCancel} style={{ background: 'var(--green)', color: '#fff' }}>Torna indietro</button>
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px', background: '#111', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <p style={{ color: '#888', fontSize: 13 }}>Inquadra il codice a barre del prodotto</p>
        <button onClick={handleManual} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, padding: '10px 24px', width: '100%' }}>
          ✏️ Inserisci manualmente
        </button>
      </div>
    </div>
  )
}
