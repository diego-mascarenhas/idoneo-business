import { getBusinessHttp } from './http'

export type AffiliateCatalog =
  | 'assistant'
  | 'platform'
  | 'mailer'
  | 'shop'
  | 'ads'
  | 'projects'
  | 'affiliates'
  | 'estimator'

export type AffiliatePlan = {
  id: string
  name: string
  checkout_url?: string
  referral_url?: string | null
  catalog?: string
}

export type AffiliateInvitation = {
  id: number
  invitee_name: string
  invitee_email: string
  plan_id: string
  plan_name: string
  sent_at?: string | null
  opened_at?: string | null
  clicked_at?: string | null
  invited_by?: string | null
  status: string
}

export type AffiliateReferral = {
  id: string
  name: string
  email?: string | null
  plan_name?: string | null
  sent_at?: string | null
  opened_at?: string | null
  clicked_at?: string | null
  contracted: boolean
  contracted_at?: string | null
  commission_cents: number
  commission_percent: number
  currency?: string | null
  status: string
}

export type AffiliateCommission = {
  id: number
  currency: string
  commission_percent: number
  commission_amount_cents: number
  created_at?: string | null
  counterparty_team?: string | null
}

export type AffiliateDashboard = {
  eligible: boolean
  reason?: string | null
  referral_code: string | null
  commission_percent: number
  plans: AffiliatePlan[]
  invitations: AffiliateInvitation[]
  referrals?: AffiliateReferral[]
  commissions_as_referrer: AffiliateCommission[]
  totals_as_referrer: Record<string, { paid_cents: number; commission_cents: number }>
}

type DashboardResponse = {
  success: boolean
  data: AffiliateDashboard
}

type InviteResponse = {
  success: boolean
  message: string
  data: AffiliateInvitation
}

export async function fetchAffiliateDashboard(catalog?: AffiliateCatalog): Promise<AffiliateDashboard> {
  const query = catalog ? `?catalog=${catalog}` : ''
  const response = await getBusinessHttp().request<DashboardResponse>(`/affiliates/dashboard${query}`)
  return response.data
}

export async function setupAffiliateStripe(): Promise<{ success: boolean; message: string }> {
  return getBusinessHttp().request('/affiliates/setup-stripe', {
    method: 'POST',
  })
}

export async function sendAffiliateInvitation(payload: {
  invite_name: string
  invite_email: string
  invite_plan: string
  catalog?: AffiliateCatalog
}): Promise<InviteResponse> {
  return getBusinessHttp().request('/affiliates/invitations', {
    method: 'POST',
    body: payload,
  })
}

type ClaimResponse = {
  success: boolean
  message: string
  data: AffiliateReferral
}

export async function claimAffiliateReferral(subscriptionCode: string): Promise<ClaimResponse> {
  return getBusinessHttp().request('/affiliates/claim', {
    method: 'POST',
    body: { subscription_code: subscriptionCode },
  })
}
