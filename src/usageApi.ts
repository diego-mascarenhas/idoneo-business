import { getBusinessHttp } from './http'
import type { WhatsAppLineUsage } from './usageTypes'

export async function fetchWhatsAppLineUsage(): Promise<WhatsAppLineUsage> {
  const data = await getBusinessHttp().request<{ success: boolean; data: WhatsAppLineUsage }>(
    '/assistant/usage',
  )

  return data.data
}
