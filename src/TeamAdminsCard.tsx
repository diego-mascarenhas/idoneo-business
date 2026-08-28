'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { ApiError } from './http'
import { CardHeaderButton } from './CardHeaderButton'
import { Panel } from './Panel'
import { PasswordField } from './PasswordField'
import { SelectField } from './SelectField'
import {
  createTeamAdmin,
  fetchTeamAdmins,
  removeTeamAdmin,
  sendTeamAdminPasswordReset,
  updateTeamAdmin,
} from './teamApi'
import type { TeamAdmin, TeamMemberRole } from './profileTypes'

const BASIC_ROLES: Array<{ value: TeamMemberRole; label: string }> = [
  { value: 'admin', label: 'Administrador' },
  { value: 'collaborator', label: 'Colaborador' },
]

const inputClass =
  'w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[var(--accent)]'
const rowButtonClass =
  'rounded-2xl border border-[var(--border)] px-3 py-1.5 text-sm font-medium disabled:opacity-60'
const secondaryButtonClass =
  'rounded-2xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold disabled:opacity-60'

function fieldError(error: unknown, field: string): string | undefined {
  if (!(error instanceof ApiError) || !error.body || typeof error.body !== 'object') {
    return undefined
  }
  const errors = (error.body as { errors?: Record<string, string[]> }).errors
  return errors?.[field]?.[0]
}

function accessLabel(member: TeamAdmin): string {
  const roles = (member.roles ?? []).map((role) => role.toLowerCase())
  const primary = (member.role ?? '').toLowerCase()
  if (roles.includes('collaborator') && !roles.includes('admin') && !roles.includes('root')) {
    return 'Colaborador'
  }
  if (primary === 'collaborator') {
    return 'Colaborador'
  }
  if (roles.includes('root') || primary === 'root' || primary === 'owner') {
    return 'Propietario'
  }

  return 'Administrador'
}

export function TeamAdminsCard({
  currentUserId,
  title = 'Equipo',
  description = 'Quienes pueden entrar a las apps del equipo, con rol de administrador o colaborador.',
  listQuery = 'assistant=1',
}: {
  currentUserId?: number
  title?: string
  description?: string
  listQuery?: string
}) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TeamMemberRole>('collaborator')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [editingUser, setEditingUser] = useState<TeamAdmin | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState<TeamMemberRole>('collaborator')
  const [editPassword, setEditPassword] = useState('')
  const [editPasswordConfirmation, setEditPasswordConfirmation] = useState('')
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const usersQuery = useQuery({
    queryKey: ['team-admins', listQuery],
    queryFn: () => fetchTeamAdmins(listQuery),
  })

  const create = useMutation({
    mutationFn: () =>
      createTeamAdmin({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role,
      }),
    onSuccess: async () => {
      closeForm()
      await queryClient.invalidateQueries({ queryKey: ['team-admins'] })
    },
  })

  function memberRole(member: TeamAdmin): TeamMemberRole {
    return accessLabel(member) === 'Colaborador' ? 'collaborator' : 'admin'
  }

  function closeForm() {
    setAdding(false)
    setName('')
    setEmail('')
    setRole('collaborator')
    setPassword('')
    setPasswordConfirmation('')
  }

  const remove = useMutation({
    mutationFn: (id: number) => removeTeamAdmin(id),
    onSuccess: async () => {
      setActionMessage(null)
      await queryClient.invalidateQueries({ queryKey: ['team-admins'] })
    },
  })

  const saveEdit = useMutation({
    mutationFn: () => {
      if (!editingUser) {
        throw new Error('Elegí un usuario.')
      }
      return updateTeamAdmin(editingUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        ...(editingUser.is_owner ? {} : { role: editRole }),
        ...(editPassword
          ? { password: editPassword, password_confirmation: editPasswordConfirmation }
          : {}),
      })
    },
    onSuccess: async (res) => {
      setActionMessage(res.message || 'Usuario actualizado.')
      closeEdit()
      await queryClient.invalidateQueries({ queryKey: ['team-admins'] })
    },
  })

  const sendReset = useMutation({
    mutationFn: (id: number) => sendTeamAdminPasswordReset(id),
    onSuccess: (res) => {
      setActionMessage(res.message || 'Enviamos el enlace de restauración.')
    },
  })

  function openEdit(member: TeamAdmin) {
    setActionMessage(null)
    setAdding(false)
    setEditingUser(member)
    setEditName(member.name)
    setEditEmail(member.email)
    setEditRole(memberRole(member))
    setEditPassword('')
    setEditPasswordConfirmation('')
    saveEdit.reset()
  }

  function closeEdit() {
    setEditingUser(null)
    setEditName('')
    setEditEmail('')
    setEditRole('collaborator')
    setEditPassword('')
    setEditPasswordConfirmation('')
    saveEdit.reset()
  }

  const rows = useMemo(() => {
    const users = usersQuery.data ?? []
    const term = search.trim().toLowerCase()
    if (!term) {
      return users
    }
    return users.filter(
      (admin) =>
        admin.name.toLowerCase().includes(term) || admin.email.toLowerCase().includes(term),
    )
  }, [search, usersQuery.data])

  return (
    <Panel className="space-y-5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
        </div>
        {!adding && !editingUser && (
          <CardHeaderButton
            onClick={() => {
              create.reset()
              closeEdit()
              setAdding(true)
            }}
          >
            Agregar usuario
          </CardHeaderButton>
        )}
      </div>

      {adding && (
        <form
          className="grid gap-3 rounded-2xl border border-[var(--border)] p-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            create.mutate()
          }}
        >
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--muted)]">Nombre</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
            {fieldError(create.error, 'name') && (
              <p className="mt-1 text-xs text-[var(--danger)]">{fieldError(create.error, 'name')}</p>
            )}
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--muted)]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
            {fieldError(create.error, 'email') && (
              <p className="mt-1 text-xs text-[var(--danger)]">{fieldError(create.error, 'email')}</p>
            )}
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-[var(--muted)]">Rol</span>
            <SelectField
              value={role}
              onChange={(value) => setRole(value as TeamMemberRole)}
              options={BASIC_ROLES}
            />
            {fieldError(create.error, 'role') && (
              <p className="mt-1 text-xs text-[var(--danger)]">{fieldError(create.error, 'role')}</p>
            )}
          </label>
          <PasswordField
            label="Contraseña"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            error={fieldError(create.error, 'password')}
          />
          <PasswordField
            label="Confirmar contraseña"
            value={passwordConfirmation}
            onChange={setPasswordConfirmation}
            autoComplete="new-password"
          />
          <div className="sm:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={create.isPending}
                className="rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {create.isPending ? 'Agregando…' : 'Agregar usuario'}
              </button>
              <button
                type="button"
                onClick={() => {
                  create.reset()
                  closeForm()
                }}
                className={`${secondaryButtonClass} text-[var(--muted)]`}
              >
                Cancelar
              </button>
            </div>
            {create.isError &&
              !fieldError(create.error, 'name') &&
              !fieldError(create.error, 'email') &&
              !fieldError(create.error, 'password') && (
                <p className="mt-2 text-sm text-[var(--danger)]">
                  {create.error instanceof ApiError
                    ? create.error.message
                    : 'No se pudo agregar el usuario.'}
                </p>
              )}
          </div>
        </form>
      )}

      <div className="space-y-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre o email"
          className={`${inputClass} text-sm`}
        />

        {usersQuery.isLoading && <p className="text-sm text-[var(--muted)]">Cargando equipo…</p>}

        {usersQuery.isError && (
          <p className="text-sm text-[var(--danger)]">
            {usersQuery.error instanceof ApiError
              ? usersQuery.error.message
              : 'No se pudo cargar el equipo.'}
          </p>
        )}

        {usersQuery.data && (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead className="bg-[var(--chip)] text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="px-3.5 py-2.5 font-medium">Nombre</th>
                  <th className="px-3.5 py-2.5 font-medium">Rol</th>
                  <th className="px-3.5 py-2.5 font-medium">Email</th>
                  <th className="px-3.5 py-2.5 font-medium text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3.5 py-6 text-center text-[var(--muted)]">
                      No hay integrantes para mostrar.
                    </td>
                  </tr>
                ) : (
                  rows.map((admin) => (
                    <tr key={admin.id} className="border-t border-[var(--border)]">
                      <td className="px-3.5 py-2.5 font-medium">{admin.name}</td>
                      <td className="px-3.5 py-2.5 text-[var(--muted)]">{accessLabel(admin)}</td>
                      <td className="px-3.5 py-2.5 text-[var(--muted)]">{admin.email}</td>
                      <td className="px-3.5 py-2.5 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(admin)}
                            className={rowButtonClass}
                          >
                            Editar
                          </button>
                          {currentUserId === admin.id ? (
                            <span className="px-3 py-1.5 text-sm text-[var(--muted)]">Vos</span>
                          ) : (
                            <button
                              type="button"
                              disabled={remove.isPending}
                              onClick={() => remove.mutate(admin.id)}
                              className={`${rowButtonClass} text-[var(--danger)]`}
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {editingUser && (
          <form
            className="grid gap-3 rounded-2xl border border-[var(--border)] p-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault()
              saveEdit.mutate()
            }}
          >
            <p className="sm:col-span-2 text-sm text-[var(--muted)]">
              Editando a <span className="font-medium text-[var(--text)]">{editingUser.name}</span>
            </p>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--muted)]">Nombre</span>
              <input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className={inputClass}
              />
              {fieldError(saveEdit.error, 'name') && (
                <p className="mt-1 text-xs text-[var(--danger)]">{fieldError(saveEdit.error, 'name')}</p>
              )}
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--muted)]">Email</span>
              <input
                type="email"
                value={editEmail}
                onChange={(event) => setEditEmail(event.target.value)}
                className={inputClass}
              />
              {fieldError(saveEdit.error, 'email') && (
                <p className="mt-1 text-xs text-[var(--danger)]">{fieldError(saveEdit.error, 'email')}</p>
              )}
            </label>
            {!editingUser.is_owner && (
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block font-medium text-[var(--muted)]">Rol</span>
                <SelectField
                  value={editRole}
                  onChange={(value) => setEditRole(value as TeamMemberRole)}
                  options={BASIC_ROLES}
                />
                {fieldError(saveEdit.error, 'role') && (
                  <p className="mt-1 text-xs text-[var(--danger)]">{fieldError(saveEdit.error, 'role')}</p>
                )}
              </label>
            )}
            <PasswordField
              label="Nueva contraseña (opcional)"
              value={editPassword}
              onChange={setEditPassword}
              autoComplete="new-password"
              error={fieldError(saveEdit.error, 'password')}
            />
            <PasswordField
              label="Confirmar contraseña"
              value={editPasswordConfirmation}
              onChange={setEditPasswordConfirmation}
              autoComplete="new-password"
            />
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saveEdit.isPending}
                className="rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saveEdit.isPending ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                disabled={sendReset.isPending}
                onClick={() => sendReset.mutate(editingUser.id)}
                className={secondaryButtonClass}
              >
                {sendReset.isPending ? 'Enviando…' : 'Enviar enlace de acceso'}
              </button>
              <button type="button" onClick={closeEdit} className={`${secondaryButtonClass} text-[var(--muted)]`}>
                Cancelar
              </button>
            </div>
            {saveEdit.isError &&
              !fieldError(saveEdit.error, 'name') &&
              !fieldError(saveEdit.error, 'email') &&
              !fieldError(saveEdit.error, 'password') && (
                <p className="sm:col-span-2 text-sm text-[var(--danger)]">
                  {saveEdit.error instanceof ApiError
                    ? saveEdit.error.message
                    : saveEdit.error instanceof Error
                      ? saveEdit.error.message
                      : 'No se pudo actualizar el usuario.'}
                </p>
              )}
          </form>
        )}

        {actionMessage && <p className="text-sm text-[var(--accent-strong)]">{actionMessage}</p>}

        {sendReset.isError && (
          <p className="text-sm text-[var(--danger)]">
            {sendReset.error instanceof ApiError
              ? sendReset.error.message
              : 'No se pudo enviar el enlace.'}
          </p>
        )}

        {remove.isError && (
          <p className="text-sm text-[var(--danger)]">
            {remove.error instanceof ApiError
              ? remove.error.message
              : 'No se pudo quitar el usuario.'}
          </p>
        )}
      </div>
    </Panel>
  )
}
