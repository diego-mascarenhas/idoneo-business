'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError } from './http'
import { Panel } from './Panel'
import { TeamAdminsCard } from './TeamAdminsCard'
import { fetchUserTeams, switchCurrentTeam } from './teamApi'
import type { UserTeam } from './profileTypes'

function switchError(error: unknown): string {
  if (error instanceof ApiError && error.message) {
    return error.message
  }

  return 'No se pudo cambiar de equipo.'
}

export function TeamPage({
  currentUserId,
  canManageTeam,
  refreshUser,
  title = 'Equipo',
  cardTitle = 'Equipo',
  description = 'Quienes pueden entrar a las apps del equipo, con rol de administrador o colaborador.',
  listQuery = 'assistant=1',
}: {
  currentUserId?: number
  canManageTeam: boolean
  refreshUser: () => Promise<void>
  title?: string
  cardTitle?: string
  description?: string
  listQuery?: string
}) {
  const queryClient = useQueryClient()
  const [switchingId, setSwitchingId] = useState<number | null>(null)
  const teamsQuery = useQuery({
    queryKey: ['user-teams'],
    queryFn: fetchUserTeams,
  })
  const teams = teamsQuery.data ?? []
  const current = teams.find((team) => team.is_current) ?? null

  const changeTeam = useMutation({
    mutationFn: (team: UserTeam) => switchCurrentTeam(team.id),
    onMutate: (team) => {
      setSwitchingId(team.id)
    },
    onSuccess: async () => {
      await refreshUser()
      await queryClient.invalidateQueries()
      window.location.reload()
    },
    onError: () => {
      setSwitchingId(null)
    },
  })

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      <p className="mt-1 text-[var(--muted)]">
        {current?.name ?? (teamsQuery.isLoading ? 'Cargando equipos…' : 'Sin equipo actual')}
      </p>

      {teams.length > 1 && (
        <Panel className="mt-6 space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold">Tus equipos</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Elegí el equipo con el que querés trabajar. El resto de la app pasa a ese equipo.
            </p>
          </div>
          <ul className="space-y-2">
            {teams.map((team) => {
              const pending = switchingId === team.id

              return (
                <li key={team.id}>
                  <button
                    type="button"
                    disabled={team.is_current || switchingId !== null}
                    onClick={() => changeTeam.mutate(team)}
                    className={[
                      'flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition disabled:opacity-70',
                      team.is_current
                        ? 'border-[var(--accent)] bg-[var(--chip)]'
                        : 'border-[var(--border)] hover:bg-[var(--chip)]',
                    ].join(' ')}
                  >
                    <span className="font-medium">{team.name}</span>
                    <span className="shrink-0 text-xs text-[var(--muted)]">
                      {pending ? 'Cambiando…' : team.is_current ? 'Actual' : 'Elegir'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {changeTeam.isError && (
            <p className="text-sm text-red-600">{switchError(changeTeam.error)}</p>
          )}
        </Panel>
      )}

      {canManageTeam && (
        <div className="mt-6">
          <TeamAdminsCard
            currentUserId={currentUserId}
            title={cardTitle}
            description={description}
            listQuery={listQuery}
          />
        </div>
      )}
    </div>
  )
}
