export function money(n: number, decimals = 2): string {
  return (
    '$' +
    n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  )
}

export function moneyShort(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M'
  if (abs >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K'
  return money(n, 0)
}
