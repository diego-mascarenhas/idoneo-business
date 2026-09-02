export const MODEL_CATALOG_PAGE = 'https://mcp.idoneo.dev/models'
export const MODEL_CATALOG_JSON = 'https://mcp.idoneo.dev/models.json'
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models'

export type CatalogModel = {
  id: string
  name: string
  context_length: number
  modality: string
  prompt_per_million: number | null
  completion_per_million: number | null
}

type OpenRouterModel = {
  id?: string
  name?: string
  context_length?: number
  architecture?: { modality?: string }
  pricing?: { prompt?: string | number | null; completion?: string | number | null }
}

const FALLBACK_MODELS: CatalogModel[] = [
  {
    id: 'openai/whisper-1',
    name: 'OpenAI: Whisper',
    context_length: 0,
    modality: 'audio->text',
    prompt_per_million: 6,
    completion_per_million: 6,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'OpenAI: GPT-4o-mini',
    context_length: 128000,
    modality: 'text+image->text',
    prompt_per_million: 0.15,
    completion_per_million: 0.6,
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Anthropic: Claude Haiku 4.5',
    context_length: 200000,
    modality: 'text+image+file->text',
    prompt_per_million: 1,
    completion_per_million: 5,
  },
]

export function catalogModelHref(used: string, match?: CatalogModel | null): string {
  const query = match?.id || used
  return `${MODEL_CATALOG_PAGE}?q=${encodeURIComponent(query)}`
}

export function matchCatalogModel(used: string, models: CatalogModel[]): CatalogModel | null {
  const raw = used.trim()
  if (raw === '' || raw.toLowerCase() === 'cheapest') {
    return null
  }

  const exact = models.find((model) => model.id === raw)
  if (exact) {
    return exact
  }

  const wanted = normalizeModelKey(raw)
  if (wanted === '') {
    return null
  }

  const ranked = models
    .map((model) => ({ model, score: catalogMatchScore(wanted, model) }))
    .filter((row) => row.score > 0)
    .sort((left, right) => right.score - left.score || left.model.id.localeCompare(right.model.id))

  return ranked[0]?.model ?? matchFallbackModel(wanted)
}

function matchFallbackModel(wanted: string): CatalogModel | null {
  return (
    FALLBACK_MODELS.find((model) => {
      const idKey = normalizeModelKey(model.id)
      return idKey === wanted || idKey.endsWith(`/${wanted}`)
    }) ?? null
  )
}

export function formatMillionPrice(value: number | null): string {
  if (value === null) {
    return '—'
  }
  if (value === 0) {
    return 'Gratis'
  }

  const digits = value < 0.01 ? 4 : 2
  return `$${value.toLocaleString('es-ES', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

export function applyMarkup(price: number | null, markupPercent: number): number | null {
  if (price === null) {
    return null
  }

  return Math.round(price * (1 + Math.max(0, markupPercent) / 100) * 10_000) / 10_000
}

export function formatMarkupPercent(markupPercent: number): string | null {
  if (markupPercent <= 0) {
    return null
  }

  const label = Number.isInteger(markupPercent)
    ? String(markupPercent)
    : markupPercent.toLocaleString('es-ES', { maximumFractionDigits: 1 })

  return `+${label}%`
}

export function catalogRateLabel(model: CatalogModel | null): string | null {
  if (!model) {
    return null
  }

  return `Entrada ${formatMillionPrice(model.prompt_per_million)} · Salida ${formatMillionPrice(model.completion_per_million)}`
}

export function catalogCostCents(
  promptTokens: number,
  completionTokens: number,
  model: CatalogModel | null,
  usdToDisplay = 1,
): number | null {
  if (!model || model.prompt_per_million === null || model.completion_per_million === null) {
    return null
  }

  const usd =
    (Math.max(0, promptTokens) / 1_000_000) * model.prompt_per_million +
    (Math.max(0, completionTokens) / 1_000_000) * model.completion_per_million

  return Math.round(usd * Math.max(0, usdToDisplay) * 100)
}

export async function fetchModelCatalog(): Promise<CatalogModel[]> {
  const fromMcp = await readCatalogJson(MODEL_CATALOG_JSON)
  if (fromMcp.length > 0) {
    return fromMcp
  }

  return fetchOpenRouterCatalog()
}

export function normalizeOpenRouterModel(model: OpenRouterModel): CatalogModel {
  return {
    id: String(model.id ?? ''),
    name: String(model.name ?? model.id ?? 'Unknown'),
    context_length: Number(model.context_length ?? 0),
    modality: String(model.architecture?.modality ?? ''),
    prompt_per_million: dollarsPerMillion(model.pricing?.prompt),
    completion_per_million: dollarsPerMillion(model.pricing?.completion),
  }
}

function catalogMatchScore(wanted: string, model: CatalogModel): number {
  const idKey = normalizeModelKey(model.id)
  const nameKey = normalizeModelKey(model.name)
  if (idKey !== wanted && nameKey !== wanted && !idKey.endsWith(`/${wanted}`)) {
    return 0
  }

  let score = idKey === wanted || idKey.endsWith(`/${wanted}`) ? 100 : 60
  if (model.id.includes(':')) {
    score -= 40
  }
  if (model.id.startsWith('~')) {
    score -= 20
  }

  return score
}

export function normalizeModelKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^~/, '')
    .replace(/:\w+$/, '')
    .replace(/^[^/]+\//, '')
    .replace(/-\d{8}$/, '')
    .replace(/_/g, '-')
    .replace(/(\d)-(\d)/g, '$1.$2')
}

function dollarsPerMillion(pricePerToken: string | number | null | undefined): number | null {
  if (pricePerToken === null || pricePerToken === undefined || pricePerToken === '') {
    return null
  }
  const amount = typeof pricePerToken === 'number' ? pricePerToken : Number(pricePerToken)
  if (!Number.isFinite(amount)) {
    return null
  }

  return Math.round(amount * 1_000_000 * 10_000) / 10_000
}

async function readCatalogJson(url: string): Promise<CatalogModel[]> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return []
    }

    const payload = (await response.json()) as { models?: unknown }
    if (!Array.isArray(payload.models)) {
      return []
    }

    return payload.models.filter(isCatalogModel)
  } catch {
    return []
  }
}

async function fetchOpenRouterCatalog(): Promise<CatalogModel[]> {
  try {
    const response = await fetch(OPENROUTER_MODELS_URL)
    if (!response.ok) {
      return []
    }

    const payload = (await response.json()) as { data?: OpenRouterModel[] }
    return (payload.data ?? [])
      .map(normalizeOpenRouterModel)
      .filter((model) => model.id !== '')
  } catch {
    return []
  }
}

function isCatalogModel(value: unknown): value is CatalogModel {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const row = value as CatalogModel
  return typeof row.id === 'string' && typeof row.name === 'string'
}
