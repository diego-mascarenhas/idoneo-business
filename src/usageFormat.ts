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

export function formatTranscriptionMinutes(transcription?: {
  audio_seconds?: number
  formatted_duration?: string
} | null): string {
  const minutes = Math.round((transcriptionSeconds(transcription) / 60) * 10) / 10
  const text = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: Number.isInteger(minutes) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(minutes)

  return `${text} min`
}

function transcriptionSeconds(transcription?: {
  audio_seconds?: number
  formatted_duration?: string
} | null): number {
  if (typeof transcription?.audio_seconds === 'number' && Number.isFinite(transcription.audio_seconds)) {
    return Math.max(0, transcription.audio_seconds)
  }

  const match = (transcription?.formatted_duration ?? '').match(/([\d.,]+)\s*(s|min|h)/i)
  if (!match) {
    return 0
  }

  const value = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(value)) {
    return 0
  }

  const unit = match[2].toLowerCase()
  if (unit === 'min') {
    return value * 60
  }
  if (unit === 'h') {
    return value * 3600
  }

  return value
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
