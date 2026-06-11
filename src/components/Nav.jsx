export default function Nav({ current, onChange }) {
  return (
    <nav style={{ display: 'flex', borderTop: '1px solid var(--border)', background: '#fff', position: 'sticky', bottom: 0, zIndex: 20 }}>
      {[
        { id: 'pantry', icon: '🏠', label: 'Dispensa' },
        { id: 'scan', icon: '📷', label: 'Scansiona' },
      ].map(({ id, icon, label }) => (
        <button key={id} onClick={() => onChange(id)}
          style={{
            flex: 1, background: 'transparent', borderRadius: 0, padding: '10px 0',
            color: current === id ? 'var(--green)' : 'var(--text-muted)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            borderTop: current === id ? '2px solid var(--green)' : '2px solid transparent',
          }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <span style={{ fontSize: 11, fontWeight: current === id ? 700 : 400 }}>{label}</span>
        </button>
      ))}
    </nav>
  )
}
