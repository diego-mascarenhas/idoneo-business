import { catalogCostCents, matchCatalogModel, type CatalogModel } from './modelCatalog.ts'
import type { UsageByModel, UsageLine, UsageSource, WhatsAppLineUsage } from './usageTypes.ts'

export const DEFAULT_CLIENT_TOKEN_MULTIPLIER = 2

export function scaleClientTokens(value: number, multiplier = DEFAULT_CLIENT_TOKEN_MULTIPLIER): number {
  return Math.round(Math.max(0, value) * Math.max(1, multiplier))
}

export function presentClientUsage(
  data: WhatsAppLineUsage,
  catalog: CatalogModel[],
): WhatsAppLineUsage {
  if (data.client_presented) {
    return data
  }

  const multiplier = data.token_multiplier ?? DEFAULT_CLIENT_TOKEN_MULTIPLIER
  const fx = data.usd_to_display ?? 1
  const fallback = matchCatalogModel(data.default_model, catalog)

  const lines = data.lines.map((line) => presentLine(line, catalog, fallback, multiplier, fx))
  const byModel = (data.by_model.length > 0 ? data.by_model : byModelFromLines(data.lines)).map((row) =>
    presentModel(row, catalog, fallback, multiplier, fx),
  )
  const sources = (data.sources ?? []).map((source) => presentSource(source, fallback, multiplier, fx))
  const presented: WhatsAppLineUsage = {
    ...data,
    totals: {
      ...data.totals,
      prompt_tokens: scaleClientTokens(data.totals.prompt_tokens, multiplier),
      completion_tokens: scaleClientTokens(data.totals.completion_tokens, multiplier),
      total_tokens: scaleClientTokens(data.totals.total_tokens, multiplier),
      tokens_saved: scaleClientTokens(data.totals.tokens_saved ?? 0, multiplier),
      amount_cents: lines.reduce((sum, line) => sum + line.amount_cents, 0),
    },
    sources,
    by_model: byModel,
    lines,
  }
  const billed = billedUsageTotals({
    ...presented,
    all: {
      calls: data.all?.calls ?? 0,
      tokens: scaleClientTokens(data.all?.tokens ?? data.totals.total_tokens, multiplier),
      tokens_saved: scaleClientTokens(data.all?.tokens_saved ?? 0, multiplier),
      amount_cents:
        catalogCostCents(
          scaleClientTokens(data.all?.tokens ?? data.totals.total_tokens, multiplier),
          0,
          fallback,
          fx,
        ) ?? scaleClientTokens(data.all?.amount_cents ?? data.totals.amount_cents, multiplier),
      saved_cents: data.all?.saved_cents,
    },
  })

  return {
    ...presented,
    all: {
      calls: data.all?.calls ?? 0,
      tokens: billed.tokens,
      tokens_saved: scaleClientTokens(data.all?.tokens_saved ?? 0, multiplier),
      amount_cents: billed.amount_cents,
      saved_cents: data.all?.saved_cents,
    },
  }
}

export function billedUsageTotals(data: WhatsAppLineUsage): { tokens: number; amount_cents: number } {
  const modelTokens = data.by_model.reduce((sum, row) => sum + row.total_tokens, 0)
  const modelAmount = data.by_model.reduce((sum, row) => sum + row.amount_cents, 0)
  const extra = (data.sources ?? []).filter((source) => !sourceCoveredByModels(source.module_name, data.by_model))
  const extraTokens = extra.reduce((sum, source) => sum + source.tokens_used, 0)
  const extraAmount = extra.reduce((sum, source) => sum + source.amount_cents, 0)

  if (modelTokens > 0 || modelAmount > 0) {
    return {
      tokens: modelTokens + extraTokens,
      amount_cents: modelAmount + extraAmount,
    }
  }

  return {
    tokens: data.all?.tokens ?? data.totals.total_tokens,
    amount_cents: data.all?.amount_cents ?? data.totals.amount_cents,
  }
}

export function sourceCoveredByModels(moduleName: string, models: UsageByModel[]): boolean {
  const name = moduleName.trim().toLowerCase()
  if (name === 'chat') {
    return models.some((row) => !isAuxiliaryModel(row.model))
  }
  if (name === 'ocr') {
    return models.some((row) => isOcrModel(row.model))
  }

  return false
}

function isAuxiliaryModel(model: string): boolean {
  const key = model.toLowerCase()

  return key.includes('whisper') || isOcrModel(model)
}

function isOcrModel(model: string): boolean {
  const key = model.toLowerCase()

  return key.includes('gpt-4o-mini') || key.includes('ocr')
}

function presentLine(
  line: UsageLine,
  catalog: CatalogModel[],
  fallback: CatalogModel | null,
  multiplier: number,
  fx: number,
): UsageLine {
  const prompt = scaleClientTokens(line.prompt_tokens, multiplier)
  const completion = scaleClientTokens(line.completion_tokens, multiplier)
  const match = matchCatalogModel(line.model, catalog) ?? fallback

  return {
    ...line,
    prompt_tokens: prompt,
    completion_tokens: completion,
    total_tokens: scaleClientTokens(line.total_tokens, multiplier),
    tokens_saved: scaleClientTokens(line.tokens_saved ?? 0, multiplier),
    amount_cents: catalogCostCents(prompt, completion, match, fx) ?? line.amount_cents,
  }
}

function presentModel(
  row: UsageByModel,
  catalog: CatalogModel[],
  fallback: CatalogModel | null,
  multiplier: number,
  fx: number,
): UsageByModel {
  const prompt = scaleClientTokens(row.prompt_tokens ?? 0, multiplier)
  const completion = scaleClientTokens(row.completion_tokens ?? 0, multiplier)
  const match = matchCatalogModel(row.model, catalog) ?? fallback

  return {
    ...row,
    prompt_tokens: prompt,
    completion_tokens: completion,
    total_tokens: scaleClientTokens(row.total_tokens, multiplier),
    tokens_saved: scaleClientTokens(row.tokens_saved ?? 0, multiplier),
    amount_cents: catalogCostCents(prompt, completion, match, fx) ?? row.amount_cents,
  }
}

function presentSource(
  source: UsageSource,
  fallback: CatalogModel | null,
  multiplier: number,
  fx: number,
): UsageSource {
  const tokens = scaleClientTokens(source.tokens_used, multiplier)

  return {
    ...source,
    tokens_used: tokens,
    tokens_saved: scaleClientTokens(source.tokens_saved ?? 0, multiplier),
    amount_cents: catalogCostCents(tokens, 0, fallback, fx) ?? source.amount_cents,
  }
}

function byModelFromLines(lines: UsageLine[]): UsageByModel[] {
  const grouped = new Map<string, UsageByModel>()

  for (const line of lines) {
    const current = grouped.get(line.model) ?? {
      model: line.model,
      replies: 0,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      tokens_saved: 0,
      amount_cents: 0,
    }
    current.replies += line.replies
    current.prompt_tokens = (current.prompt_tokens ?? 0) + line.prompt_tokens
    current.completion_tokens = (current.completion_tokens ?? 0) + line.completion_tokens
    current.total_tokens += line.total_tokens
    current.tokens_saved = (current.tokens_saved ?? 0) + (line.tokens_saved ?? 0)
    grouped.set(line.model, current)
  }

  return [...grouped.values()]
}
