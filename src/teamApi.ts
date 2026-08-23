import { getBusinessHttp } from './http'
import type { TeamAdmin, TeamAdminInput } from './profileTypes'

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

export async function removeTeamAdmin(id: number): Promise<void> {
  await getBusinessHttp().request(`/users/${id}`, { method: 'DELETE' })
}
