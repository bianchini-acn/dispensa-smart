import { useEffect, useRef, useState } from 'react'
import Quagga from '@ericblade/quagga2'
import { fetchProductByBarcode } from '../lib/openfoodfacts'

export default function ScanPage({ onScanned, onCancel }) {
  const [status, setStatus] = useState('scanning') // scanning | loading | error | manual
  const [errorMsg, setErrorMsg] = useState('')
  const [detectState, setDetectState] = useState('idle') // idle | detecting | confirmed
  const [attempts, setAttempts] = useState(0)
  const [showManualBarcode, setShowManualBarcode] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)
  const doneRef = useRef(false)
  const resultsBuffer = useRef([])
  const attemptTimerRef = useRef(null)

  useEffect(() => {
    if (status !== 'scanning') return

    Quagga.init({
      inputStream: {
        name: 'Live',
        type: 'LiveStream',
        target: document.querySelector('#quagga-video'),
        constraints: { facingMode: 'environment', width: { min: 640 }, height: { min: 480 } },
      },
      locator: { patchSize: 'medium', halfSample: true },
      numOfWorkers: 2,
      frequency: 10,
      decoder: {
        readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'code_128_reader'],
      },
      locate: true,
    }, err => {
      if (err) { setStatus('error'); setErrorMsg(err.message || 'Errore fotocamera'); return }
      Quagga.start()
    })

    Quagga.onProcessed(result => {
      if (doneRef.current) return
      if (result?.boxes?.length > 0 || result?.box) {
        setDetectState('detecting')
        clearTimeout(attemptTimerRef.current)
        attemptTimerRef.current = setTimeout(() => setDetectState('idle'), 800)
      }
    })

    Quagga.onDetected(async result => {
      if (doneRef.current) return
      const code = result.codeResult.code
      if (!code) return

      resultsBuffer.current.push(code)
      if (resultsBuffer.current.length < 3) return

      const counts = {}
      resultsBuffer.current.forEach(c => { counts[c] = (counts[c] || 0) + 1 })
      const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]

      if (best[1] < 2) {
        resultsBuffer.current = resultsBuffer.current.slice(-2)
        setAttempts(prev => {
          const next = prev + 1
          if (next >= 3) setShowManualBarcode(true)
          return next
        })
        return
      }

      doneRef.current = true
      setDetectState('confirmed')
      setTimeout(async () => {
        Quagga.stop()
        setStatus('loading')
        try {
          const product = await fetchProductByBarcode(best[0])
          onScanned(product || { barcode: best[0], name: '', brand: '', image_url: null, ingredients: '', nutrients: {} })
        } catch {
          onScanned({ barcode: best[0], name: '', brand: '', image_url: null, ingredients: '', nutrients: {} })
        }
      }, 300)
    })

    return () => {
      clearTimeout(attemptTimerRef.current)
      try { Quagga.stop() } catch (_) {}
    }
  }, [status])

  async function handleManualBarcodeSearch(e) {
    e.preventDefault()
    if (!manualCode.trim()) return
    setSearching(true)
    setSearchError('')
    try {
      const product = await fetchProductByBarcode(manualCode.trim())
      if (product) {
        onScanned(product)
      } else {
        setSearchError('Prodotto non trovato. Puoi inserirlo manualmente.')
      }
    } catch {
      setSearchError('Errore di rete. Riprova.')
    }
    setSearching(false)
  }

  function handleFullManual() {
    onScanned({ barcode: manualCode || null, name: '', brand: '', image_url: null, ingredients: '', nutrients: {} })
  }

  const borderColor =
    detectState === 'confirmed' ? '#4ade80' :
    detectState === 'detecting' ? '#facc15' :
    'rgba(255,255,255,0.7)'

  const hint =
    detectState === 'confirmed' ? '✅ Codice rilevato!' :
    detectState === 'detecting' ? '🔍 Rilevamento in corso...' :
    'Inquadra il codice a barre'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#000' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#111' }}>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 17 }}>Scansiona barcode</span>
        <button onClick={onCancel} style={{ background: 'transparent', color: '#aaa', padding: '4px 8px', fontSize: 15 }}>✕ Annulla</button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div id="quagga-video" style={{ width: '100%', height: '100%' }} />

        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{
            width: 260, height: 120,
            border: `2.5px solid ${borderColor}`,
            borderRadius: 8,
            boxShadow: `0 0 0 1000px rgba(0,0,0,0.45), 0 0 12px ${borderColor}`,
            transition: 'border-color 0.15s, box-shadow 0.15s'
          }} />
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

      <div style={{ padding: '16px 20px', background: '#111', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{
          textAlign: 'center', fontSize: 13,
          color: detectState === 'confirmed' ? '#4ade80' : detectState === 'detecting' ? '#facc15' : '#888',
          transition: 'color 0.2s'
        }}>{hint}</p>

        {/* Dopo 3 tentativi: inserimento manuale del codice */}
        {showManualBarcode && (
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ color: '#facc15', fontSize: 13, textAlign: 'center' }}>
              ⚠️ Codice non letto. Inseriscilo a mano:
            </p>
            <form onSubmit={handleManualBarcodeSearch} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={manualCode}
                onChange={e => { setManualCode(e.target.value.replace(/\D/g, '')); setSearchError('') }}
                placeholder="es. 8001120757753"
                style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}
                inputMode="numeric"
                autoFocus
              />
              <button type="submit" disabled={searching || !manualCode.trim()}
                style={{ background: 'var(--green)', color: '#fff', padding: '10px 16px', fontSize: 14, flexShrink: 0 }}>
                {searching ? '...' : '🔍'}
              </button>
            </form>
            {searchError && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ color: '#f87171', fontSize: 13 }}>{searchError}</p>
                <button onClick={handleFullManual}
                  style={{ background: 'var(--green)', color: '#fff', fontSize: 13 }}>
                  ✏️ Inserisci prodotto manualmente
                </button>
              </div>
            )}
            <button onClick={() => { setShowManualBarcode(false); setAttempts(0); resultsBuffer.current = []; doneRef.current = false }}
              style={{ background: 'transparent', color: '#888', fontSize: 12, padding: '4px 0' }}>
              Riprova con la fotocamera
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
