'use client'

import { useId, useState, type ReactNode } from 'react'

const inputClass =
  'w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-3.5 py-2.5 pr-11 outline-none focus:ring-2 focus:ring-[var(--accent)]'

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.4 5.5A9.8 9.8 0 0 1 12 5c7 0 10 7 10 7a16.8 16.8 0 0 1-3.2 4.4" />
        <path d="M6.7 6.7C3.8 8.6 2 12 2 12s3 7 10 7a9.8 9.8 0 0 0 4.4-1" />
      </svg>
    )
  }

  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  error,
  aside,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  error?: string
  aside?: ReactNode
}) {
  const [visible, setVisible] = useState(false)
  const inputId = useId()

  return (
    <div className="block text-sm">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="font-medium text-[var(--muted)]">
          {label}
        </label>
        {aside}
      </div>
      <span className="relative block">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] transition hover:text-[var(--text)]"
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        >
          <EyeIcon open={visible} />
        </button>
      </span>
      {error && <p className="mt-1.5 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  )
}
