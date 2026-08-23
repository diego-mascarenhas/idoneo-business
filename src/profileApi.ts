import { getBusinessHttp } from './http'
import type { BillingPayload, BillingUpdateInput, ProfileSaved, ProfileUser } from './profileTypes'

export async function fetchProfileUser(): Promise<ProfileUser> {
  return getBusinessHttp().request('/auth/user')
}

export async function updateProfile(payload: {
  name: string
  email: string
  phone?: string | null
}): Promise<ProfileSaved> {
  return getBusinessHttp().request('/auth/profile', {
    method: 'PUT',
    body: payload,
  })
}

export async function updatePassword(payload: {
  password: string
  password_confirmation: string
}): Promise<{ success: boolean; message: string }> {
  return getBusinessHttp().request('/auth/password', {
    method: 'PUT',
    body: payload,
  })
}

export async function fetchBilling(): Promise<BillingPayload> {
  const data = await getBusinessHttp().request<{ success: boolean; data: BillingPayload }>('/billing')
  return data.data
}

export async function updateBilling(
  payload: BillingUpdateInput,
): Promise<{ success: boolean; message: string; warning?: string; data: BillingPayload }> {
  return getBusinessHttp().request('/billing', {
    method: 'PUT',
    body: payload,
  })
}

export async function fetchProfilePhotoBlob(): Promise<Blob | null> {
  try {
    const blob = await getBusinessHttp().blob(`/auth/profile-photo?t=${Date.now()}`)
    return blob.size >= 50 ? blob : null
  } catch {
    return null
  }
}

export async function updateProfilePhoto(photo: File): Promise<ProfileSaved> {
  const body = new FormData()
  body.append('photo', photo)
  return getBusinessHttp().form('/auth/profile-photo', body)
}

export async function deleteProfilePhoto(): Promise<ProfileSaved> {
  return getBusinessHttp().request('/auth/profile-photo', { method: 'DELETE' })
}
