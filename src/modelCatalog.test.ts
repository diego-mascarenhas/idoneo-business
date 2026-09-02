import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  catalogCostCents,
  catalogModelHref,
  applyMarkup,
  catalogRateLabel,
  formatMarkupPercent,
  formatMillionPrice,
  matchCatalogModel,
  MODEL_CATALOG_PAGE,
  normalizeModelKey,
  normalizeOpenRouterModel,
  type CatalogModel,
} from './modelCatalog.ts'

const haiku: CatalogModel = {
  id: 'anthropic/claude-haiku-4.5',
  name: 'Anthropic: Claude Haiku 4.5',
  context_length: 200000,
  modality: 'text+image+file->text',
  prompt_per_million: 1,
  completion_per_million: 5,
}

const haikuBatch: CatalogModel = {
  ...haiku,
  id: 'anthropic/claude-haiku-4.5:batch',
  name: 'Anthropic: Claude Haiku 4.5 (batch)',
  prompt_per_million: 0.5,
  completion_per_million: 2.5,
}

describe('model catalog matching', () => {
  it('maps an Anthropic snapshot id to the OpenRouter catalog row', () => {
    const match = matchCatalogModel('claude-haiku-4-5-20251001', [haikuBatch, haiku])

    assert.equal(match?.id, 'anthropic/claude-haiku-4.5')
    assert.equal(match?.name, 'Anthropic: Claude Haiku 4.5')
  })

  it('prefers the non-batch row', () => {
    assert.equal(matchCatalogModel('claude-haiku-4.5', [haikuBatch, haiku])?.id, haiku.id)
  })

  it('skips cheapest and empty ids', () => {
    assert.equal(matchCatalogModel('cheapest', [haiku]), null)
    assert.equal(matchCatalogModel('', [haiku]), null)
  })

  it('falls back to Whisper list rates when the catalog omits audio models', () => {
    const match = matchCatalogModel('whisper-1', [haiku])

    assert.equal(match?.id, 'openai/whisper-1')
    assert.equal(match?.name, 'OpenAI: Whisper')
    assert.equal(catalogRateLabel(match), 'Entrada $6,00 · Salida $6,00')
  })

  it('normalizes dated Anthropic ids', () => {
    assert.equal(normalizeModelKey('claude-haiku-4-5-20251001'), 'claude-haiku-4.5')
    assert.equal(normalizeModelKey('anthropic/claude-haiku-4.5:batch'), 'claude-haiku-4.5')
  })
})

describe('model catalog labels', () => {
  it('links to the Idoneo catalog with a search query', () => {
    assert.equal(
      catalogModelHref('claude-haiku-4-5-20251001', haiku),
      `${MODEL_CATALOG_PAGE}?q=${encodeURIComponent('anthropic/claude-haiku-4.5')}`,
    )
  })

  it('formats catalog prices like the models page', () => {
    assert.equal(formatMillionPrice(1), '$1,00')
    assert.equal(formatMillionPrice(5), '$5,00')
    assert.equal(formatMillionPrice(0), 'Gratis')
    assert.equal(catalogRateLabel(haiku), 'Entrada $1,00 · Salida $5,00')
    assert.equal(applyMarkup(1, 50), 1.5)
    assert.equal(formatMarkupPercent(50), '+50%')
  })

  it('normalizes OpenRouter token prices to dollars per million', () => {
    const model = normalizeOpenRouterModel({
      id: 'anthropic/claude-haiku-4.5',
      name: 'Anthropic: Claude Haiku 4.5',
      context_length: 200000,
      architecture: { modality: 'text+image+file->text' },
      pricing: { prompt: '0.000001', completion: '0.000005' },
    })

    assert.equal(model.prompt_per_million, 1)
    assert.equal(model.completion_per_million, 5)
  })

  it('prices doubled tokens at the catalog market rate', () => {
    assert.equal(catalogCostCents(200_000, 0, haiku, 1), 20)
    assert.equal(catalogCostCents(200_000, 10_000, haiku, 1), 25)
  })
})
