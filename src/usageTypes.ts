export type TokenUsageModule = {
  module_name: string
  count: number
  tokens_used: number
  tokens_saved: number
}

export type TokenUsage = {
  total_calls: number
  total_tokens_saved: number
  average_savings: number
  total_tokens_used: number
  total_tokens_without_toon: number
  by_module: TokenUsageModule[]
  period_start?: string | null
  period_end?: string | null
  amount_due_cents?: number
  currency?: string
  rate_per_million?: number
}

export type WhatsAppUsage = {
  messages_sent: number
  our_amount_cents?: number
  reference_amount_cents?: number
  saved_amount_cents?: number
  average_savings?: number
  our_rate?: number
  reference_rate?: number
  currency?: string
  period_start?: string | null
  period_end?: string | null
  period_messages_sent?: number
  amount_due_cents?: number
}

export type UsageLine = {
  phone: string
  name: string
  contact_id: number | null
  replies: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  tokens_saved?: number
  amount_cents: number
  saved_cents?: number
  model: string
  models: string[]
  last_at: string | null
  inbox_href: string
}

export type UsageByModel = {
  model: string
  replies: number
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens: number
  tokens_saved?: number
  amount_cents: number
  saved_cents?: number
}

export type UsageSource = {
  module_name: string
  count: number
  tokens_used: number
  tokens_saved?: number
  amount_cents: number
  saved_cents?: number
}

export type UsageAll = {
  calls: number
  tokens: number
  tokens_saved?: number
  amount_cents: number
  saved_cents?: number
}

export type WhatsAppLineUsage = {
  period_days: number
  period_start: string
  period_end: string
  rate_per_million?: number
  markup_percent?: number
  token_multiplier?: number
  usd_to_display?: number
  client_presented?: boolean
  currency: string
  default_model: string
  totals: {
    lines: number
    replies: number
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    tokens_saved?: number
    amount_cents: number
    saved_cents?: number
  }
  all?: UsageAll
  sources?: UsageSource[]
  by_model: UsageByModel[]
  lines: UsageLine[]
  whatsapp?: {
    messages_sent: number
    our_amount_cents: number
    our_rate: number
    currency: string
  }
}
