import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export type RangeKey = 'mtd' | '7d' | '30d' | '90d' | 'custom'

export interface ApiWindow {
  start: string
  end: string
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function resolvePreset(range: RangeKey): ApiWindow {
  const end = new Date()
  const start = new Date()
  switch (range) {
    case 'mtd':
      start.setDate(1)
      break
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    case '90d':
      start.setDate(start.getDate() - 90)
      break
    default:
      start.setDate(1)
  }
  return { start: iso(start), end: iso(end) }
}

export function useDateRange() {
  const [searchParams, setSearchParams] = useSearchParams()
  const range = (searchParams.get('window') as RangeKey) || 'mtd'
  const customStart = searchParams.get('start') ?? undefined
  const customEnd = searchParams.get('end') ?? undefined

  const apiWindow: ApiWindow = useMemo(() => {
    if (range === 'custom' && customStart && customEnd) {
      return { start: customStart, end: customEnd }
    }
    return resolvePreset(range)
  }, [range, customStart, customEnd])

  const setRange = (r: RangeKey) => setSearchParams({ window: r })
  const setCustom = (start: string, end: string) =>
    setSearchParams({ window: 'custom', start, end })

  return { range, apiWindow, setRange, setCustom }
}
