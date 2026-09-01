import { formatCompact, formatCost } from './usageFormat'
import { InfoIcon } from './InfoIcon'
import type { TokenUsage, WhatsAppUsage } from './usageTypes'

export function PeriodCharges({
  usage,
  whatsapp,
  usageHref,
}: {
  usage?: TokenUsage
  whatsapp?: WhatsAppUsage
  usageHref?: string
}) {
  if (!usage && !whatsapp) {
    return null
  }

  const currency = whatsapp?.currency || usage?.currency || 'EUR'
  const dueCents = (usage?.amount_due_cents ?? 0) + (whatsapp?.amount_due_cents ?? 0)

  return (
    <div className="rounded-2xl bg-[var(--accent-soft)] px-3 py-2.5">
      <div className="flex items-start justify-between gap-1">
        <p className="text-[11px] text-[var(--muted)]">A facturar este período</p>
        {usageHref ? (
          <a
            href={usageHref}
            className="-mr-1 -mt-0.5 rounded-full p-1 text-[var(--muted)] transition hover:bg-[var(--chip)] hover:text-[var(--cta-strong)]"
            aria-label="Ver consumo"
            title="Ver consumo"
          >
            <InfoIcon className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
      <p className="mt-1 text-lg font-semibold leading-none text-[var(--accent-strong)]">
        {formatCost(dueCents, currency)}
      </p>
      <p className="mt-1.5 text-[11px] text-[var(--muted)]">
        {formatCompact(whatsapp?.messages_sent ?? whatsapp?.period_messages_sent ?? 0)} msgs ·{' '}
        {formatCompact(usage?.total_tokens_used ?? 0)} tokens
      </p>
      <p className="mt-0.5 text-[11px] text-[var(--muted)]">
        Mensajes + IA y MCP de IDONEO, aparte del plan
      </p>
    </div>
  )
}
