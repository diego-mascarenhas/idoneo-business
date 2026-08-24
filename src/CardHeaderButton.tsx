'use client'

import type { ButtonHTMLAttributes } from 'react'

type CardHeaderButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

/**
 * Small pill action that sits on the right of a card header, next to the title.
 * Stays on the header line at any width: the title block shrinks, this does not.
 */
export function CardHeaderButton({ className = '', type = 'button', ...props }: CardHeaderButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--chip)] px-2.5 py-1 text-[11px] font-semibold text-[var(--cta-strong)] transition hover:border-[var(--cta-strong)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}
