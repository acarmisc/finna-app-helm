import { formatDistanceToNow, format } from 'date-fns'

export function timeAgo(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

export function absDate(iso: string): string {
  return format(new Date(iso), "MMM d, yyyy HH:mm 'UTC'")
}

export const EM_DASH = '—'

export function durationFmt(seconds?: number): string {
  if (seconds == null) return EM_DASH
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}
