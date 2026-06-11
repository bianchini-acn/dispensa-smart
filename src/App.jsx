import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import AuthPage from './pages/AuthPage'
import PantryPage from './pages/PantryPage'
import ScanPage from './pages/ScanPage'
import AddProductPage from './pages/AddProductPage'
import Nav from './components/Nav'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('pantry') // pantry | scan | add
  const [scannedProduct, setScannedProduct] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: 'var(--green)', fontSize: 18 }}>Caricamento...</div>
  if (!session) return <AuthPage />

  function handleScanned(product) {
    setScannedProduct(product)
    setPage('add')
  }

  function handleProductAdded() {
    setScannedProduct(null)
    setPage('pantry')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {page === 'pantry' && <PantryPage />}
        {page === 'scan' && <ScanPage onScanned={handleScanned} onCancel={() => setPage('pantry')} />}
        {page === 'add' && <AddProductPage product={scannedProduct} onDone={handleProductAdded} onCancel={() => setPage('pantry')} />}
      </div>
      {page !== 'scan' && <Nav current={page} onChange={setPage} />}
    </div>
  )
}
