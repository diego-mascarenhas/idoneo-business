import { formatCompact } from './usageFormat'
import { InfoIcon } from './InfoIcon'
import type { TokenUsage, TokenUsageModule, WhatsAppUsage } from './usageTypes'

const MODULE_COLORS = ['#1f5c45', '#d4a017', '#5d8a74', '#c06c4a', '#6b8cae', '#8e6bb0']

function slicesWithTokens(modules: TokenUsageModule[]): TokenUsageModule[] {
  return modules.filter((module) => module.tokens_used > 0)
}

type DonutSlice = {
  key: string
  label: string
  value: number
  color: string
}

function Donut({ slices, used }: { slices: DonutSlice[]; used: number }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="relative mx-auto h-32 w-32">
      <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="var(--chip)"
          strokeWidth="14"
        />
        {total > 0
          ? slices.map((slice) => {
              const length = (slice.value / total) * circumference
              const dashOffset = -offset
              offset += length

              return (
                <circle
                  key={slice.key}
                  cx="48"
                  cy="48"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="14"
                  strokeDasharray={`${length} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                />
              )
            })
          : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-semibold leading-none">{formatCompact(used)}</span>
        <span className="mt-1 text-[11px] text-[var(--muted)]">Total tokens</span>
      </div>
    </div>
  )
}

export function TokenUsagePanel({
  usage,
  whatsapp,
  helpHref,
}: {
  usage?: TokenUsage
  whatsapp?: WhatsAppUsage
  helpHref?: string
}) {
  const tokenUsage = usage ?? {
    total_calls: 0,
    total_tokens_saved: 0,
    average_savings: 0,
    total_tokens_used: 0,
    total_tokens_without_toon: 0,
    by_module: [],
    amount_due_cents: 0,
    currency: 'EUR',
    rate_per_million: 9,
  }
  const messagesSent = whatsapp?.messages_sent ?? 0
  const modules = slicesWithTokens(tokenUsage.by_module)
  const hasUsage = tokenUsage.total_calls > 0 || tokenUsage.total_tokens_used > 0
  const slices: DonutSlice[] = modules.map((module, index) => ({
    key: module.module_name,
    label: module.module_name,
    value: module.tokens_used,
    color: MODULE_COLORS[index % MODULE_COLORS.length],
  }))

  return (
    <div className="border-t border-[var(--border)] pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Uso de API y Tokens + Ahorro</h3>
          {helpHref ? (
            <a
              href={helpHref}
              className="rounded-full p-1 text-[var(--muted)] transition hover:bg-[var(--chip)] hover:text-[var(--cta-strong)]"
              aria-label="Cómo se cobran la IA, el MCP de IDONEO y WhatsApp"
              title="Cómo se cobra"
            >
              <InfoIcon className="h-4 w-4" />
            </a>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          IA, MCP de IDONEO y mensajes enviados. Se facturan aparte del plan.
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-center">
          <p className="text-[11px] text-[var(--muted)]">Llamadas</p>
          <p className="text-sm font-semibold">{formatCompact(tokenUsage.total_calls)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-center">
          <p className="text-[11px] text-[var(--muted)]">Mensajes</p>
          <p className="text-sm font-semibold">{formatCompact(messagesSent)}</p>
        </div>
      </div>

      {hasUsage && slices.length > 0 ? (
        <div className="mt-4 space-y-3">
          <Donut slices={slices} used={tokenUsage.total_tokens_used} />
          <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1">
            {slices.map((slice) => (
              <li key={slice.key} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: slice.color }}
                />
                <span>{slice.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-xs text-[var(--muted)]">Todavía no hay consumo de tokens.</p>
      )}

      <div className="mt-4 border-t border-[var(--border)] pt-[2.5px]">
        <div className="h-1 overflow-hidden rounded-full bg-[var(--chip)]">
          <div
            className="h-full rounded-full bg-[var(--success)]"
            style={{ width: `${Math.min(100, Math.max(0, tokenUsage.average_savings))}%` }}
          />
        </div>
        <div className="mt-[1px] flex justify-between gap-2 text-[11px] leading-none text-[var(--muted)]">
          <span>Usados: {formatCompact(tokenUsage.total_tokens_used)}</span>
          <span>
            Ahorrados: {formatCompact(tokenUsage.total_tokens_saved)} (
            {new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(tokenUsage.average_savings)}%)
          </span>
        </div>
      </div>
    </div>
  )
}
