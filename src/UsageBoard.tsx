'use client'

import { Panel } from './Panel'
import { formatCompact, formatCost, formatTokens, formatUsagePeriod } from './usageFormat'
import type { UsageByModel, UsageLine, UsageSource, WhatsAppLineUsage } from './usageTypes'

const SOURCE_COLORS = ['#1f5c45', '#d4a017', '#5d8a74', '#c06c4a', '#6b8cae', '#8e6bb0']

function formatWhen(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function modelLabel(model: string): string {
  return model === 'cheapest' ? 'Automático' : model
}

export function UsageBoard({ data }: { data: WhatsAppLineUsage }) {
  const period = formatUsagePeriod(data.period_start, data.period_end) ?? 'Período actual'
  const all = data.all
  const sources = data.sources ?? []
  const totalTokens = all?.tokens ?? data.totals.total_tokens
  const totalCost = all?.amount_cents ?? data.totals.amount_cents

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Kpi label="Tokens" value={formatCompact(totalTokens)} delay={1} />
        <Kpi
          label="Costo"
          value={formatCost(totalCost, data.currency)}
          hint={formatCompact(totalTokens)}
          delay={2}
        />
        <Kpi label="Llamadas" value={formatTokens(all?.calls ?? 0)} delay={3} />
        <Kpi label="Mensajes" value={formatTokens(data.totals.replies)} hint="enviados" delay={4} />
      </div>

      <Panel className="overflow-hidden p-0 rise-in-delay-1">
        <div className="flex items-baseline justify-between gap-3 px-4 py-3">
          <h2 className="font-display text-base font-semibold">Por origen</h2>
          <p className="text-xs text-[var(--muted)]">{period}</p>
        </div>
        {sources.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-[var(--muted)]">
            Todavía no hay consumo de OCR, Insights, Chat ni otras APIs.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-y border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Origen</th>
                  <th className="px-4 py-2 text-right font-medium">Llamadas</th>
                  <th className="px-4 py-2 text-right font-medium">Tokens</th>
                  <th className="px-4 py-2 text-right font-medium">Costo</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source, index) => (
                  <SourceRow key={source.module_name} source={source} currency={data.currency} color={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {data.by_model.length > 0 && (
        <Panel className="p-4 rise-in-delay-1">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-base font-semibold">Modelos</h2>
            <p className="text-xs text-[var(--muted)]">{period}</p>
          </div>
          <div className="space-y-2">
            {data.by_model.map((row) => (
              <ModelRow key={row.model} row={row} currency={data.currency} />
            ))}
          </div>
        </Panel>
      )}

      <Panel className="overflow-hidden p-0 rise-in-delay-2">
        <div className="flex items-baseline justify-between gap-3 px-4 py-3">
          <div>
            <h2 className="font-display text-base font-semibold">Mensajes por contacto</h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Respuestas del asistente por contacto. No incluye OCR ni Insights.
            </p>
          </div>
          <p className="text-xs text-[var(--muted)]">{period}</p>
        </div>
        {data.lines.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-[var(--muted)]">
            Todavía no hay consumo de tokens en mensajes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-y border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Contacto</th>
                  <th className="px-4 py-2 font-medium">Modelo</th>
                  <th className="px-4 py-2 text-right font-medium">In</th>
                  <th className="px-4 py-2 text-right font-medium">Out</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                  <th className="px-4 py-2 text-right font-medium">Costo</th>
                  <th className="px-4 py-2 text-right font-medium">Última</th>
                </tr>
              </thead>
              <tbody>
                {data.lines.map((line) => (
                  <LineRow key={line.phone} line={line} currency={data.currency} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

function Kpi({
  label,
  value,
  hint,
  delay,
}: {
  label: string
  value: string
  hint?: string
  delay?: 1 | 2 | 3 | 4
}) {
  const delayClass = delay ? `rise-in-delay-${delay}` : ''

  return (
    <div className={`stat-tile rise-in ${delayClass}`}>
      <p className="truncate text-[11px] font-medium leading-none text-[var(--muted)]">{label}</p>
      <p className="mt-1.5 font-display text-[1.45rem] font-semibold tabular-nums leading-none">
        {value}
        {hint ? (
          <span className="ml-1.5 align-baseline text-sm font-medium text-[var(--muted)]">
            · {hint}
          </span>
        ) : null}
      </p>
    </div>
  )
}

function SourceRow({
  source,
  currency,
  color,
}: {
  source: UsageSource
  currency: string
  color: string
}) {
  return (
    <tr className="border-b border-[var(--border)] last:border-b-0">
      <td className="px-4 py-2.5">
        <span className="inline-flex items-center gap-2 font-medium">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
          {source.module_name}
        </span>
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums">{formatTokens(source.count)}</td>
      <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatCompact(source.tokens_used)}</td>
      <td className="px-4 py-2.5 text-right tabular-nums">{formatCost(source.amount_cents, currency)}</td>
    </tr>
  )
}

function ModelRow({ row, currency }: { row: UsageByModel; currency: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <p className="min-w-0 truncate font-medium">{modelLabel(row.model)}</p>
      <p className="shrink-0 tabular-nums text-[var(--muted)]">
        {formatCompact(row.total_tokens)} · {formatCost(row.amount_cents, currency)}
      </p>
    </div>
  )
}

function LineRow({ line, currency }: { line: UsageLine; currency: string }) {
  return (
    <tr className="border-b border-[var(--border)] last:border-b-0">
      <td className="px-4 py-2.5">
        <a href={line.inbox_href} className="font-medium text-[var(--cta-strong)] no-underline hover:underline">
          {line.name}
        </a>
        <p className="text-xs text-[var(--muted)]">
          {line.phone} · {line.replies} {line.replies === 1 ? 'respuesta' : 'respuestas'}
        </p>
      </td>
      <td className="px-4 py-2.5">
        <p className="font-mono text-xs">{modelLabel(line.model)}</p>
        {line.models.length > 1 && (
          <p className="text-[11px] text-[var(--muted)]">{line.models.slice(1).map(modelLabel).join(' · ')}</p>
        )}
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums">{formatCompact(line.prompt_tokens)}</td>
      <td className="px-4 py-2.5 text-right tabular-nums">{formatCompact(line.completion_tokens)}</td>
      <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatCompact(line.total_tokens)}</td>
      <td className="px-4 py-2.5 text-right tabular-nums">{formatCost(line.amount_cents, currency)}</td>
      <td className="px-4 py-2.5 text-right text-xs text-[var(--muted)]">{formatWhen(line.last_at)}</td>
    </tr>
  )
}
