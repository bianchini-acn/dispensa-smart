import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login') // login | signup
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSent(true)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🥦</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)' }}>Dispensa Smart</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Tieni traccia delle scadenze</p>
      </div>

      {sent ? (
        <div style={{ background: 'var(--green-light)', borderRadius: 12, padding: 20, textAlign: 'center', color: 'var(--green)' }}>
          Controlla la tua email per confermare la registrazione!
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ background: 'var(--green)', color: '#fff', marginTop: 4 }}>
            {loading ? 'Attendere...' : mode === 'login' ? 'Accedi' : 'Registrati'}
          </button>
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            style={{ background: 'transparent', color: 'var(--green)', padding: '8px 0' }}>
            {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
          </button>
        </form>
      )}
    </div>
  )
}
