import { Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-pixel)',
          fontSize: 11,
        }}
      >
        &gt; finna
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
