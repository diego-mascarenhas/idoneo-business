import { getBusinessHttp } from './http'
import type { BusinessAsset, BusinessProfile, BusinessProfileUpdate } from './types'

export async function fetchBusinessProfile(): Promise<BusinessProfile> {
  const data = await getBusinessHttp().request<{ success: boolean; data: BusinessProfile }>(
    '/team/business-profile',
  )
  return data.data
}

export async function updateBusinessProfile(
  payload: BusinessProfileUpdate,
): Promise<BusinessProfile> {
  const data = await getBusinessHttp().request<{ success: boolean; data: BusinessProfile }>(
    '/team/business-profile',
    { method: 'PUT', body: payload },
  )
  return data.data
}

export async function uploadBusinessAsset(
  role: 'logo' | 'image',
  file: File,
): Promise<BusinessAsset> {
  const body = new FormData()
  body.append('role', role)
  body.append('file', file)
  const data = await getBusinessHttp().form<{ success: boolean; data: BusinessAsset }>(
    '/team/business-profile/assets',
    body,
  )
  return data.data
}

export async function deleteBusinessAsset(path: string): Promise<BusinessProfile> {
  const data = await getBusinessHttp().request<{ success: boolean; data: BusinessProfile }>(
    '/team/business-profile/assets',
    { method: 'DELETE', body: { path } },
  )
  return data.data
}

export async function generateBusinessSummary(): Promise<BusinessProfile> {
  const data = await getBusinessHttp().request<{ success: boolean; data: BusinessProfile }>(
    '/team/business-profile/summary',
    { method: 'POST' },
  )
  return data.data
}

export async function queueBusinessInsights(): Promise<BusinessProfile> {
  const data = await getBusinessHttp().request<{ success: boolean; data: BusinessProfile }>(
    '/team/business-profile/insights',
    { method: 'POST' },
  )
  return data.data
}

export async function fetchBusinessAssetFile(
  path: string,
  name?: string | null,
): Promise<File> {
  const blob = await getBusinessHttp().blob(
    `/team/business-profile/assets?path=${encodeURIComponent(path)}`,
  )
  const filename = name || path.split('/').pop() || 'marca.png'

  return new File([blob], filename, { type: blob.type || 'image/png' })
}
