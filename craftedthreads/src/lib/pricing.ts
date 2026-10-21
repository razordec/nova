/** Convert minor units to display string. */
export function formatPrice(cents: number, currency: string = 'USD'): string {
  if (currency === 'JPY') return `¥${cents.toLocaleString()}`
  const sym = { USD: '$', GBP: '£', EUR: '€', CAD: 'C$', AUD: 'A$', PNG: 'PGK' }[currency] ?? '$'
  return `${sym}${(cents / 100).toFixed(2)}`
}

/** Convert minor units to a decimal number. */
export function toDecimal(cents: number): number {
  return cents / 100
}