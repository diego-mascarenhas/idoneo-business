import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { billedUsageTotals, presentClientUsage, scaleClientTokens } from './clientUsage.ts'
import { catalogCostCents, type CatalogModel } from './modelCatalog.ts'
import type { WhatsAppLineUsage } from './usageTypes.ts'

const haiku: CatalogModel = {
  id: 'anthropic/claude-haiku-4.5',
  name: 'Anthropic: Claude Haiku 4.5',
  context_length: 200000,
  modality: 'text+image+file->text',
  prompt_per_million: 1,
  completion_per_million: 5,
}

function usageFixture(): WhatsAppLineUsage {
  return {
    period_days: 7,
    period_start: '2026-08-27T00:00:00Z',
    period_end: '2026-09-02T00:00:00Z',
    rate_per_million: 15,
    token_multiplier: 2,
    usd_to_display: 1,
    currency: 'USD',
    default_model: 'claude-haiku-4-5-20251001',
    totals: {
      lines: 1,
      replies: 1,
      prompt_tokens: 100_000,
      completion_tokens: 0,
      total_tokens: 100_000,
      amount_cents: 150,
    },
    all: {
      calls: 1,
      tokens: 100_000,
      amount_cents: 150,
    },
    sources: [
      {
        module_name: 'Chat',
        count: 1,
        tokens_used: 100_000,
        amount_cents: 150,
      },
    ],
    by_model: [
      {
        model: 'claude-haiku-4-5-20251001',
        replies: 1,
        prompt_tokens: 100_000,
        completion_tokens: 0,
        total_tokens: 100_000,
        amount_cents: 150,
      },
    ],
    lines: [
      {
        phone: '34600111222',
        name: 'Ana',
        contact_id: 1,
        replies: 1,
        prompt_tokens: 100_000,
        completion_tokens: 0,
        total_tokens: 100_000,
        amount_cents: 150,
        model: 'claude-haiku-4-5-20251001',
        models: ['claude-haiku-4-5-20251001'],
        last_at: null,
        inbox_href: '/inbox?phone=34600111222',
      },
    ],
  }
}

describe('client usage presentation', () => {
  it('doubles tokens so market rates match the billed amount', () => {
    const view = presentClientUsage(usageFixture(), [haiku])

    assert.equal(scaleClientTokens(100_000, 2), 200_000)
    assert.equal(scaleClientTokens(100_000), 1_000_000)
    assert.equal(view.lines[0]?.total_tokens, 200_000)
    assert.equal(view.by_model[0]?.total_tokens, 200_000)
    assert.equal(view.sources?.[0]?.tokens_used, 200_000)
    assert.equal(view.all?.tokens, 200_000)
    assert.equal(view.lines[0]?.amount_cents, catalogCostCents(200_000, 0, haiku, 1))
    assert.equal(view.lines[0]?.amount_cents, 20)
  })

  it('does not scale again when the API already presented client usage', () => {
    const view = presentClientUsage({ ...usageFixture(), client_presented: true }, [haiku])

    assert.equal(view.lines[0]?.total_tokens, 100_000)
    assert.equal(view.lines[0]?.amount_cents, 150)
    assert.equal(view.all?.tokens, 100_000)
  })

  it('bills the headline from catalog models, not the cheaper log estimate', () => {
    const view = presentClientUsage(
      {
        ...usageFixture(),
        client_presented: true,
        all: { calls: 1, tokens: 45_300, amount_cents: 5 },
        sources: [{ module_name: 'Chat', count: 1, tokens_used: 45_300, amount_cents: 5 }],
        by_model: [
          { model: 'claude-haiku-4-5-20251001', replies: 1, total_tokens: 538_800, amount_cents: 56 },
          { model: 'openai/gpt-4o-mini', replies: 0, total_tokens: 9700, amount_cents: 0 },
          { model: 'whisper-1', replies: 0, total_tokens: 8, amount_cents: 0 },
        ],
      },
      [haiku],
    )

    assert.deepEqual(billedUsageTotals(view), { tokens: 548_508, amount_cents: 56 })
  })

  it('adds log-only sources that models do not already cover', () => {
    const view = presentClientUsage(
      {
        ...usageFixture(),
        client_presented: true,
        sources: [
          { module_name: 'Chat', count: 1, tokens_used: 45_300, amount_cents: 5 },
          { module_name: 'Insights', count: 2, tokens_used: 10_000, amount_cents: 12 },
        ],
        by_model: [{ model: 'claude-haiku-4-5-20251001', replies: 1, total_tokens: 538_800, amount_cents: 56 }],
      },
      [haiku],
    )

    assert.deepEqual(billedUsageTotals(view), { tokens: 548_800, amount_cents: 68 })
  })

  it('replaces cheap Chat/OCR logs so origin rows add up to the headline', () => {
    const view = presentClientUsage(
      {
        ...usageFixture(),
        client_presented: true,
        all: { calls: 3, tokens: 33_200_000, amount_cents: 3002 },
        sources: [
          { module_name: 'Chat', count: 111, tokens_used: 19_300_000, amount_cents: 1694 },
          { module_name: 'OCR', count: 930, tokens_used: 13_900_000, amount_cents: 1223 },
          { module_name: 'Insights', count: 902, tokens_used: 6_100_000, amount_cents: 534 },
        ],
        by_model: [
          { model: 'claude-haiku-4-5-20251001', replies: 111, total_tokens: 26_600_000, amount_cents: 2398 },
          { model: 'openai/gpt-4o-mini', replies: 0, total_tokens: 356_500, amount_cents: 5 },
          { model: 'whisper-1', replies: 0, total_tokens: 123_600, amount_cents: 65 },
        ],
      },
      [haiku],
    )

    const originTokens = (view.sources ?? []).reduce((sum, source) => sum + source.tokens_used, 0)
    const originAmount = (view.sources ?? []).reduce((sum, source) => sum + source.amount_cents, 0)

    assert.equal(view.sources?.find((source) => source.module_name === 'Chat')?.tokens_used, 26_600_000)
    assert.equal(view.sources?.find((source) => source.module_name === 'OCR')?.tokens_used, 356_500)
    assert.equal(view.sources?.find((source) => source.module_name === 'Whisper')?.tokens_used, 123_600)
    assert.deepEqual(billedUsageTotals(view), { tokens: 33_180_100, amount_cents: 3002 })
    assert.equal(originTokens, view.all?.tokens)
    assert.equal(originAmount, view.all?.amount_cents)
    assert.equal(originTokens, billedUsageTotals(view).tokens)
  })
})
