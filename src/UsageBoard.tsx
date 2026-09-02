'use client'

import { billedUsageTotals, presentClientUsage } from './clientUsage'
import {
  catalogModelHref,
  catalogRateLabel,
  matchCatalogModel,
  MODEL_CATALOG_PAGE,
  type CatalogModel,
} from './modelCatalog'
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

export function UsageBoard({
  data,
  catalog = [],
}: {
  data: WhatsAppLineUsage
  catalog?: CatalogModel[]
}) {
  const view = presentClientUsage(data, catalog)
  const period = formatUsagePeriod(view.period_start, view.period_end) ?? 'Período actual'
  const sources = view.sources ?? []
  const billed = billedUsageTotals(view)
  const messages = view.whatsapp

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Kpi label="Tokens" value={formatCompact(billed.tokens)} delay={1} />
        <Kpi label="Tokens · valor" value={formatCost(billed.amount_cents, view.currency)} delay={2} />
        <Kpi label="Mensajes" value={formatTokens(messages?.messages_sent ?? view.totals.replies)} delay={3} />
        <Kpi
          label="Mensajes · valor"
          value={formatCost(messages?.our_amount_cents ?? 0, messages?.currency ?? view.currency)}
          delay={4}
        />
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
                  <th className="px-4 py-2 text-center font-medium">Llamadas</th>
                  <th className="px-4 py-2 text-right font-medium">Tokens</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source, index) => (
                  <SourceRow key={source.module_name} source={source} currency={view.currency} color={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--border)] text-sm">
                  <th className="px-4 py-2.5 text-left font-semibold">Total</th>
                  <th className="px-4 py-2.5 text-center font-semibold tabular-nums">
                    {formatTokens(sources.reduce((sum, source) => sum + source.count, 0))}
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold tabular-nums">{formatCompact(billed.tokens)}</th>
                  <th className="px-4 py-2.5 text-right font-semibold tabular-nums">
                    {formatCost(billed.amount_cents, view.currency)}
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>

      {view.by_model.length > 0 && (
        <Panel className="p-4 rise-in-delay-1">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <div className="flex min-w-0 items-baseline gap-2">
              <h2 className="font-display text-base font-semibold">Modelos</h2>
              <a
                href={MODEL_CATALOG_PAGE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center rounded-full border border-[var(--border)] bg-[var(--chip)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--cta-strong)] no-underline transition hover:border-[var(--cta-strong)]"
              >
                Todos
              </a>
            </div>
            <p className="text-xs text-[var(--muted)]">{period}</p>
          </div>
          <div className="space-y-2">
            {view.by_model.map((row) => (
              <ModelRow key={row.model} row={row} currency={view.currency} catalog={catalog} />
            ))}
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
        {view.lines.length === 0 ? (
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
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                  <th className="px-4 py-2 text-right font-medium">Última</th>
                </tr>
              </thead>
              <tbody>
                {view.lines.map((line) => (
                  <LineRow key={line.phone} line={line} currency={view.currency} catalog={catalog} />
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
      <td className="px-4 py-2.5 text-center tabular-nums">{formatTokens(source.count)}</td>
      <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatCompact(source.tokens_used)}</td>
      <td className="px-4 py-2.5 text-right tabular-nums">{formatCost(source.amount_cents, currency)}</td>
    </tr>
  )
}

function ModelRow({
  row,
  currency,
  catalog,
}: {
  row: UsageByModel
  currency: string
  catalog: CatalogModel[]
}) {
  const match = matchCatalogModel(row.model, catalog)
  const rates = catalogRateLabel(match)
  const label = match?.name ?? modelLabel(row.model)

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <a
        href={catalogModelHref(row.model, match)}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 no-underline hover:underline"
        title={row.model !== label ? row.model : undefined}
      >
        <p className="min-w-0 truncate font-medium text-[var(--cta-strong)]">{label}</p>
        {rates ? (
          <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">{rates} · millón</p>
        ) : null}
      </a>
      <p className="shrink-0 tabular-nums text-[var(--muted)]">
        {formatCompact(row.total_tokens)} · {formatCost(row.amount_cents, currency)}
      </p>
    </div>
  )
}

function LineRow({
  line,
  currency,
  catalog,
}: {
  line: UsageLine
  currency: string
  catalog: CatalogModel[]
}) {
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
        <div className="flex flex-col gap-0.5">
          {(line.models.length > 0 ? line.models : [line.model]).map((model, index) => (
            <p
              key={model}
              className={index === 0 ? 'text-xs' : 'text-[11px] text-[var(--muted)]'}
            >
              <ModelCatalogLink model={model} catalog={catalog} />
            </p>
          ))}
        </div>
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums">{formatCompact(line.prompt_tokens)}</td>
      <td className="px-4 py-2.5 text-right tabular-nums">{formatCompact(line.completion_tokens)}</td>
      <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatCompact(line.total_tokens)}</td>
      <td className="px-4 py-2.5 text-right tabular-nums">{formatCost(line.amount_cents, currency)}</td>
      <td className="px-4 py-2.5 text-right text-xs text-[var(--muted)]">{formatWhen(line.last_at)}</td>
    </tr>
  )
}

function ModelCatalogLink({ model, catalog }: { model: string; catalog: CatalogModel[] }) {
  const match = matchCatalogModel(model, catalog)
  const label = match?.name ?? modelLabel(model)

  return (
    <a
      href={catalogModelHref(model, match)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--cta-strong)] no-underline hover:underline"
      title={model !== label ? model : undefined}
    >
      {label}
    </a>
  )
}
