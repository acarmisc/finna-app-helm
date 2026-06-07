export function Placeholder({ name }: { name: string }) {
  return (
    <div style={{ padding: 24, fontFamily: 'var(--font-mono)' }}>
      <h1 style={{ fontFamily: 'var(--font-pixel)', fontSize: 16 }}>{name}</h1>
      <p style={{ color: 'var(--fg-muted)' }}>// placeholder — implemented in Phase 1</p>
    </div>
  )
}
