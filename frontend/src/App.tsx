import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { AppShell } from '@/layouts/AppShell'
import { Placeholder } from '@/components/_Placeholder'

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Placeholder name="Login" />} />
          <Route path="/auth/callback" element={<Placeholder name="Auth Callback" />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Placeholder name="Dashboard" />} />
            <Route path="/projects" element={<Placeholder name="Projects" />} />
            <Route path="/projects/:slug" element={<Placeholder name="Project Detail" />} />
            <Route path="/costs" element={<Placeholder name="Cost Explorer" />} />
            <Route path="/configs" element={<Placeholder name="Cloud Configs" />} />
            <Route path="/configs/new" element={<Placeholder name="New Config" />} />
            <Route path="/configs/:id" element={<Placeholder name="Edit Config" />} />
            <Route path="/extractors" element={<Placeholder name="Extractors" />} />
            <Route path="/alerts" element={<Placeholder name="Alerts" />} />
            <Route path="/settings" element={<Placeholder name="Settings" />} />
            <Route index element={<Navigate to="/dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
