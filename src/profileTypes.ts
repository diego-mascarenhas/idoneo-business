export type ProfileUser = {
  id?: number
  name: string
  email: string
  phone?: string | null
  profile_photo_url?: string | null
  role?: string | null
  current_team?: { id: number; name: string } | null
}

export type ProfileSaved = {
  success: boolean
  message: string
  user: ProfileUser
}

export type BillingFields = {
  has_stripe_customer: boolean
  individual_name: string
  business_name: string
  country: string
  phone: string
  tax_id: string
}

export type BillingPayload = {
  team: { id: number; name: string }
  billing: BillingFields
}

export type BillingUpdateInput = {
  individual_name: string
  business_name?: string | null
  country: string
  phone: string
  tax_id: string
}

export type ProfilePlanContext = {
  billingReady: boolean
  holderName?: string
  name: string
}

export type TeamAdmin = {
  id: number
  name: string
  email: string
  role?: string | null
  roles?: string[]
}

export type TeamMemberRole = 'admin' | 'collaborator'

export type TeamAdminInput = {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: TeamMemberRole
}
