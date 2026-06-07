import { create } from 'zustand'

export type Provider = 'azure' | 'gcp' | 'llm' | 'aws' | 'ecb'

export interface User {
  id: string
  email: string
  name: string
  org_id: string
  role: 'admin' | 'member' | 'viewer'
  avatar_url?: string
  timezone: string
  locale: string
  created_at: string
}

interface AuthState {
  accessToken: string | null
  user: User | null
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  clear: () => void
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem('finna_user')
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: sessionStorage.getItem('finna_access_token'),
  user: loadUser(),
  setAccessToken: (token) => {
    sessionStorage.setItem('finna_access_token', token)
    set({ accessToken: token })
  },
  setUser: (user) => {
    localStorage.setItem('finna_user', JSON.stringify(user))
    set({ user })
  },
  clear: () => {
    sessionStorage.removeItem('finna_access_token')
    localStorage.removeItem('finna_user')
    set({ accessToken: null, user: null })
  },
}))
