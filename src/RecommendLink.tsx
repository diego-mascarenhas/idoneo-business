function RecommendIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
      <path d="M18 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
      <path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
      <path d="M8.7 10.7l6.6 -3.4" />
      <path d="M8.7 13.3l6.6 3.4" />
    </svg>
  )
}

export function RecommendLink({
  href = '/affiliates',
  size = 'header',
}: {
  href?: string
  size?: 'header' | 'cta'
}) {
  const sizeClass =
    size === 'cta'
      ? 'rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]'
      : 'rounded-full border border-[var(--border)] bg-[var(--chip)] px-2.5 py-1 text-[11px] font-semibold text-[var(--cta-strong)] hover:border-[var(--cta-strong)]'

  return (
    <a
      href={href}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 transition ${sizeClass}`}
    >
      <RecommendIcon className={size === 'cta' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      Recomendar
    </a>
  )
}
