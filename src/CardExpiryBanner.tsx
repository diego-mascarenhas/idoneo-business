'use client'

export type DefaultPaymentMethodStatus = {
  brand?: string
  last4?: string
  exp_month?: number
  exp_year?: number
  expired?: boolean
  expiring_soon?: boolean
  days_until_expiry?: number | null
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  )
}

function last4Label(last4?: string): string {
  const digits = (last4 ?? '').replace(/\D/g, '').slice(-4)
  return digits.length === 4 ? `···· ${digits}` : 'tu tarjeta'
}

function daysLeftLabel(days?: number | null): string {
  if (days == null) {
    return ''
  }
  if (days <= 0) {
    return 'vence hoy'
  }
  if (days === 1) {
    return 'vence en 1 día'
  }
  return `vence en ${days} días`
}

export function CardExpiryBanner({
  paymentMethod,
  href = '/profile',
  action = 'Actualizar tarjeta',
  onAction,
  pending = false,
}: {
  paymentMethod?: DefaultPaymentMethodStatus | null
  href?: string
  action?: string
  onAction?: () => void
  pending?: boolean
}) {
  if (!paymentMethod?.expired && !paymentMethod?.expiring_soon) {
    return null
  }

  const expired = Boolean(paymentMethod.expired)
  const card = last4Label(paymentMethod.last4)
  const colors = expired
    ? 'border-[var(--danger)]/20 bg-[var(--danger-soft)] text-[var(--danger)]'
    : 'border-[var(--warning)]/25 bg-[var(--warning-soft)]/50 text-[var(--warning-strong)]'

  const message = expired
    ? `${card} está vencida.`
    : `${card} ${daysLeftLabel(paymentMethod.days_until_expiry)}.`

  const className = `inline-flex w-max max-w-full items-center gap-2 overflow-hidden rounded-full border px-3 py-1.5 text-left text-xs font-medium leading-snug no-underline transition hover:bg-[var(--chip)] sm:text-sm disabled:opacity-60 ${colors}`
  const label = (
    <>
      <AlertIcon />
      <span className="min-w-0 truncate">
        {message}{' '}
        <span className="underline underline-offset-2">{pending ? 'Abriendo Stripe…' : action}</span>
      </span>
    </>
  )

  if (onAction) {
    return (
      <button type="button" className={className} onClick={onAction} disabled={pending}>
        {label}
      </button>
    )
  }

  return (
    <a href={href} className={className}>
      {label}
    </a>
  )
}
