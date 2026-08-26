export function formatTokens(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value)
}

export function formatCompact(value: number): string {
  const amount = Math.abs(value)
  if (amount < 1000) {
    return formatTokens(value)
  }
  if (amount < 1_000_000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`
  }

  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
}

export function formatCost(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(cents / 100)
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`
  }
}

export function formatUsagePeriod(start?: string | null, end?: string | null): string | null {
  if (!start || !end) {
    return null
  }

  const from = new Date(start)
  const to = new Date(end)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return null
  }

  const sameDay =
    from.getFullYear() === to.getFullYear() &&
    from.getMonth() === to.getMonth() &&
    from.getDate() === to.getDate()
  if (sameDay) {
    return from.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const sameYear = from.getFullYear() === to.getFullYear()
  const startLabel = from.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
  const endLabel = to.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return `${startLabel} – ${endLabel}`
}
