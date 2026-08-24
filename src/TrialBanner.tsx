'use client'

import type { ReactNode } from 'react'

export type TrialAccess = {
  active?: boolean
  status?: 'paid' | 'trial' | 'expired'
  trial_ends_at?: string | null
}

export function remainingTrialLabel(endsAt?: string | null): string | null {
  if (!endsAt) {
    return null
  }

  const end = new Date(endsAt).getTime()
  if (Number.isNaN(end)) {
    return null
  }

  const hours = Math.max(0, Math.ceil((end - Date.now()) / 3_600_000))
  if (hours < 1) {
    return 'queda menos de 1 h'
  }

  return hours === 1 ? 'queda 1 h' : `quedan ${hours} h`
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  )
}

export function TrialBanner({
  access,
  productName,
  href = '/profile',
  trialAction = 'Contratar',
  expiredAction = 'Activar plan',
  expiredMessage,
}: {
  access?: TrialAccess | null
  productName: string
  href?: string
  trialAction?: string
  expiredAction?: string
  expiredMessage?: ReactNode
}) {
  if (!access || access.status === 'paid') {
    return null
  }

  const trialLeft = remainingTrialLabel(access.trial_ends_at)
  const expired = access.status === 'expired'
  const colors = expired
    ? 'border-[var(--danger)]/20 bg-[var(--danger-soft)] text-[var(--danger)]'
    : 'border-[var(--warning)]/25 bg-[var(--warning-soft)]/50 text-[var(--warning-strong)]'

  return (
    <a
      href={href}
      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-left text-xs font-medium leading-snug no-underline transition hover:bg-[var(--chip)] sm:text-sm ${colors}`}
    >
      <AlertIcon />
      <span className="min-w-0">
        {expired
          ? (expiredMessage ?? `La prueba de ${productName} terminó.`)
          : `Prueba ${productName}${trialLeft ? ` · ${trialLeft}` : ''}.`}{' '}
        <span className="underline underline-offset-2">{expired ? expiredAction : trialAction}</span>
      </span>
    </a>
  )
}
