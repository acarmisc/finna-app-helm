import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/features/auth/store'

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().accessToken
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  try {
    const r = await axios.post(
      import.meta.env.VITE_API_URL + '/api/v1/auth/refresh',
      {},
      { withCredentials: true },
    )
    const newToken = r.data.access_token as string
    useAuthStore.getState().setAccessToken(newToken)
    return newToken
  } catch {
    useAuthStore.getState().clear()
    window.location.href = '/login?expired=1'
    return null
  }
}

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const cfg = err.config as RetriableConfig | undefined
    if (err.response?.status === 401 && cfg && !cfg._retry) {
      cfg._retry = true
      if (!refreshing) {
        refreshing = refreshAccessToken().finally(() => {
          refreshing = null
        })
      }
      const newToken = await refreshing
      if (newToken) {
        cfg.headers.Authorization = `Bearer ${newToken}`
        return api(cfg)
      }
    }
    return Promise.reject(err)
  },
)
