export function formatUsd(value: number, fractionDigits = 0): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits })
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits })
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`
}

export function shortAddress(value: string): string {
  return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value
}

export function formatToken(value: number, token: string): string {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${token}`
}
