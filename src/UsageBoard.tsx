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
import { formatCompact, formatCost, formatTokens, formatTranscriptionMinutes, formatUsagePeriod } from './usageFormat'
import type { UsageByModel, UsageChargeLine, UsageLine, UsageSource, UsageStorageLine, WhatsAppLineUsage } from './usageTypes'

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
      <div className="grid grid-cols-3 gap-2.5">
        <Kpi label="AI · MCP" value={formatCost(billed.amount_cents, view.currency)} delay={1} />
        <Kpi
          label="Transcripción"
          value={formatCost(view.transcription?.amount_due_cents ?? 0, view.transcription?.currency ?? view.currency)}
          delay={2}
        />
        <Kpi
          label="Mensajes"
          value={formatCost(messages?.our_amount_cents ?? 0, messages?.currency ?? view.currency)}
          delay={3}
        />
        <Kpi
          label="Emails"
          value={formatCost(view.mailer?.amount_due_cents ?? 0, view.mailer?.currency ?? view.currency)}
          delay={4}
        />
        <Kpi
          label="Prospección"
          value={formatCost(view.prospect?.amount_due_cents ?? 0, view.prospect?.currency ?? view.currency)}
        />
        <Kpi
          label="Almacenamiento"
          value={formatCost(view.storage?.amount_due_cents ?? 0, view.storage?.currency ?? view.currency)}
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
          <div className="min-w-0">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Origen</th>
                  <th className="px-4 py-2 text-center font-medium">AI</th>
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
        <Panel className="overflow-hidden p-0 rise-in-delay-1">
          <div className="flex items-baseline justify-between gap-3 px-4 py-3">
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
          <div className="min-w-0">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">Modelo</th>
                  <th className="px-4 py-2 text-right font-medium">Tokens</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {view.by_model.map((row) => (
                  <ModelRow key={row.model} row={row} currency={view.currency} catalog={catalog} />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--border)] text-sm">
                  <th className="px-4 py-2.5 text-left font-semibold">Total</th>
                  <th className="px-4 py-2.5 text-right font-semibold tabular-nums">
                    {formatCompact(view.by_model.reduce((sum, row) => sum + row.total_tokens, 0))}
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold tabular-nums">
                    {formatCost(
                      view.by_model.reduce((sum, row) => sum + row.amount_cents, 0),
                      view.currency,
                    )}
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>
      )}

      <ChargeList
        title="Transcripción"
        empty="Todavía no hay audio transcrito."
        quantityLabel="Duración"
        rows={view.transcriptions ?? []}
        currency={view.transcription?.currency ?? view.currency}
        period={period}
        quantity={(row) => formatTranscriptionMinutes({ audio_seconds: row.count })}
      />

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
          <div className="min-w-0">
            <table className="w-full text-left text-sm">
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

      <ChargeList
        title="Emails"
        empty="Todavía no hay emails en este período."
        quantityLabel="Envíos"
        rows={view.emails ?? []}
        currency={view.mailer?.currency ?? view.currency}
        period={period}
        quantity={(row) => formatTokens(row.count)}
      />
      <ChargeList
        title="Prospección"
        empty="Todavía no hay créditos de prospección en este período."
        quantityLabel="Créditos"
        rows={view.prospects ?? []}
        currency={view.prospect?.currency ?? view.currency}
        period={period}
        quantity={(row) => formatTokens(row.count)}
      />
      <StorageList
        rows={view.storage_sources ?? []}
        currency={view.storage?.currency ?? view.currency}
        period={period}
      />
    </div>
  )
}

function ChargeList({
  title,
  empty,
  quantityLabel,
  rows,
  currency,
  period,
  quantity,
}: {
  title: string
  empty: string
  quantityLabel: string
  rows: UsageChargeLine[]
  currency: string
  period: string
  quantity: (row: UsageChargeLine) => string
}) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        <p className="text-xs text-[var(--muted)]">{period}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-[var(--muted)]">{empty}</p>
      ) : (
        <div className="min-w-0">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-2 font-medium">Origen</th>
                <th className="px-4 py-2 text-right font-medium">{quantityLabel}</th>
                <th className="px-4 py-2 text-right font-medium">Valor</th>
                <th className="px-4 py-2 text-right font-medium">Última</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.label}-${row.at ?? ''}`} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-4 py-2.5 font-medium break-words">{row.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{quantity(row)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatCost(row.amount_cents, currency)}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-[var(--muted)]">{formatWhen(row.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

function StorageList({
  rows,
  currency,
  period,
}: {
  rows: UsageStorageLine[]
  currency: string
  period: string
}) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
        <h2 className="font-display text-base font-semibold">Almacenamiento</h2>
        <p className="text-xs text-[var(--muted)]">{period}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-[var(--muted)]">Todavía no hay archivos almacenados.</p>
      ) : (
        <div className="min-w-0">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-2 font-medium">Origen</th>
                <th className="px-4 py-2 text-right font-medium">Tamaño</th>
                <th className="px-4 py-2 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-4 py-2.5 font-medium">{row.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{row.formatted_size}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatCost(row.amount_cents, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
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
    <div className={`widget-solid rise-in px-4 py-3 ${delayClass}`}>
      <p className="truncate text-[11px] font-medium leading-none text-[var(--muted)]">{label}</p>
      <p className="mt-1.5 text-right font-display text-[1.45rem] font-semibold tabular-nums leading-none">
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
    <tr className="border-b border-[var(--border)] last:border-b-0">
      <td className="px-4 py-2.5">
        <a
          href={catalogModelHref(row.model, match)}
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline hover:underline"
          title={row.model !== label ? row.model : undefined}
        >
          <p className="font-medium text-[var(--cta-strong)]">{label}</p>
          {rates ? <p className="mt-0.5 text-[11px] text-[var(--muted)]">{rates} · millón</p> : null}
        </a>
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatCompact(row.total_tokens)}</td>
      <td className="px-4 py-2.5 text-right tabular-nums">{formatCost(row.amount_cents, currency)}</td>
    </tr>
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
