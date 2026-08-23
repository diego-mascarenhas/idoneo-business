export type BusinessAsset = {
  path: string
  url: string
  width: number | null
  height: number | null
  original_name: string | null
  data_url?: string
}

export type BusinessProfile = {
  configured: boolean
  business_name: string | null
  business_industry: string | null
  business_location: string | null
  business_postal_code: string | null
  business_phone: string | null
  business_whatsapp: string | null
  business_website: string | null
  business_email: string | null
  contact_email: string | null
  business_tagline: string | null
  business_description: string | null
  address: string | null
  city: string | null
  country: string | null
  language: string | null
  twitter: string | null
  facebook: string | null
  instagram: string | null
  linkedin: string | null
  youtube: string | null
  tiktok: string | null
  whatsapp_url: string | null
  telegram: string | null
  pinterest: string | null
  threads: string | null
  first_name: string | null
  last_name: string | null
  birth_date: string | null
  birth_time: string | null
  landmark: string | null
  pincode: string | null
  business_challenge: string | null
  wants_to_deepen: string | null
  summary: string | null
  insights: Record<string, unknown> | null
  insights_loading: boolean
  insights_phase: string | null
  countries: string[]
  logo: BusinessAsset | null
  images: BusinessAsset[]
}

export type BusinessProfileUpdate = Partial<
  Omit<
    BusinessProfile,
    | 'configured'
    | 'logo'
    | 'images'
    | 'summary'
    | 'insights'
    | 'insights_loading'
    | 'insights_phase'
    | 'countries'
  >
>
