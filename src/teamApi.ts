import { getBusinessHttp } from './http'
import type { TeamAdmin, TeamAdminInput, TeamAdminUpdateInput } from './profileTypes'

export async function fetchTeamAdmins(listQuery = 'assistant=1'): Promise<TeamAdmin[]> {
  const data = await getBusinessHttp().request<{ success: boolean; users: TeamAdmin[] }>(
    `/users?${listQuery}`,
  )
  return data.users ?? []
}

export async function createTeamAdmin(payload: TeamAdminInput): Promise<TeamAdmin> {
  const data = await getBusinessHttp().request<{ success: boolean; user: TeamAdmin }>('/users', {
    method: 'POST',
    body: payload,
  })
  return data.user
}

export async function updateTeamAdmin(
  id: number,
  payload: TeamAdminUpdateInput,
): Promise<{ success: boolean; message: string; user: TeamAdmin }> {
  return getBusinessHttp().request(`/users/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function removeTeamAdmin(id: number): Promise<void> {
  await getBusinessHttp().request(`/users/${id}`, { method: 'DELETE' })
}

export async function updateTeamAdminPassword(
  id: number,
  payload: { password: string; password_confirmation: string },
): Promise<{ success: boolean; message: string }> {
  return getBusinessHttp().request(`/users/${id}/password`, {
    method: 'PUT',
    body: payload,
  })
}

export async function sendTeamAdminPasswordReset(
  id: number,
): Promise<{ success: boolean; message: string }> {
  return getBusinessHttp().request(`/users/${id}/password-reset`, {
    method: 'POST',
    body: {
      frontend_url: typeof window === 'undefined' ? undefined : window.location.origin,
    },
  })
}
