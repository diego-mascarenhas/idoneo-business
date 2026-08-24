'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { BillingForm } from './BillingForm'
import { PasswordField } from './PasswordField'
import { Panel } from './Panel'
import { fetchBilling, updatePassword, updateProfile } from './profileApi'
import { ApiError } from './http'
import { ProfilePhotoField } from './ProfilePhotoField'
import { TeamAdminsCard } from './TeamAdminsCard'
import type { ProfilePlanContext, ProfileUser } from './profileTypes'

const inputClass =
  'w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[var(--accent)]'

export function ProfilePage({
  user,
  teamName,
  canManageTeam,
  applyProfile,
  refreshUser,
  showPhone = true,
  extraPersonal,
  subtitle,
  title = 'Mi perfil',
  headerExtra,
  planSection,
  teamTitle,
  teamDescription,
  teamListQuery,
}: {
  user: ProfileUser | null
  teamName?: string
  canManageTeam: boolean
  applyProfile: (user: ProfileUser) => void
  refreshUser: () => Promise<void>
  showPhone?: boolean
  extraPersonal?: ReactNode
  subtitle?: string
  title?: string
  headerExtra?: ReactNode
  planSection?: ReactNode | ((context: ProfilePlanContext) => ReactNode)
  teamTitle?: string
  teamDescription?: string
  teamListQuery?: string
}) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
    setPhone(user?.phone ?? '')
  }, [user])

  const billingQuery = useQuery({
    queryKey: ['billing'],
    queryFn: fetchBilling,
    enabled: canManageTeam,
  })

  const save = useMutation({
    mutationFn: async () => {
      const wantsPasswordChange = Boolean(password || passwordConfirmation)

      if (wantsPasswordChange) {
        if (!password || !passwordConfirmation) {
          throw new Error('Completá la contraseña y la confirmación.')
        }
        if (password !== passwordConfirmation) {
          throw new Error('La confirmación no coincide con la nueva contraseña.')
        }
      }

      const profile = await updateProfile({
        name: name.trim(),
        email: email.trim(),
        ...(showPhone ? { phone: phone.trim() || null } : {}),
      })

      if (wantsPasswordChange) {
        await updatePassword({
          password,
          password_confirmation: passwordConfirmation,
        })
      }

      return {
        ...profile,
        passwordChanged: wantsPasswordChange,
      }
    },
    onSuccess: async (res) => {
      applyProfile(res.user)
      await refreshUser()
      setPassword('')
      setPasswordConfirmation('')
      setMessage(
        res.passwordChanged
          ? 'Perfil y contraseña actualizados'
          : res.message || 'Perfil actualizado',
      )
    },
    onError: (err) => {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'No se pudo actualizar'
      setMessage(text)
    },
  })

  const billing = billingQuery.data?.billing
  const planContext: ProfilePlanContext = {
    billingReady: Boolean(name.trim() && billing?.country && billing.phone && billing.tax_id),
    holderName: teamName,
    name,
  }
  const plan =
    typeof planSection === 'function' ? planSection(planContext) : planSection

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      <p className="mt-1 text-[var(--muted)]">
        {subtitle ?? (teamName ? `Equipo: ${teamName}` : 'Sin equipo actual')}
      </p>
      {headerExtra}

      {plan}

      {canManageTeam && (
        <div className="mt-6">
          <TeamAdminsCard
            currentUserId={user?.id}
            title={teamTitle}
            description={teamDescription}
            listQuery={teamListQuery}
          />
        </div>
      )}

      <div className={canManageTeam ? 'mt-6 grid gap-6 lg:grid-cols-2' : 'mt-6'}>
        <Panel className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Datos personales</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {showPhone
                  ? 'Foto, nombre, email, teléfono y contraseña de tu usuario.'
                  : 'Foto, nombre, email y contraseña de tu usuario.'}
              </p>
            </div>
            <div className="flex shrink-0 items-start gap-3">
              {extraPersonal}
              <ProfilePhotoField user={user} applyProfile={applyProfile} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--muted)]">Nombre</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--muted)]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </label>
            {showPhone && (
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-[var(--muted)]">Teléfono</span>
                <input
                  value={phone ?? ''}
                  onChange={(event) => setPhone(event.target.value)}
                  className={inputClass}
                />
              </label>
            )}
            {showPhone && <div />}
            <PasswordField
              label="Contraseña"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
            <PasswordField
              label="Confirmar contraseña"
              value={passwordConfirmation}
              onChange={setPasswordConfirmation}
              autoComplete="new-password"
              error={
                password && passwordConfirmation && password !== passwordConfirmation
                  ? 'La confirmación no coincide.'
                  : undefined
              }
            />
          </div>

          {message && <p className="text-sm text-[var(--accent-strong)]">{message}</p>}

          <button
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate()}
            className="rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {save.isPending ? 'Guardando…' : 'Guardar perfil'}
          </button>
        </Panel>

        {canManageTeam && (
          <div id="datos-facturacion">
            <BillingForm className="space-y-4 p-6" fallbackName={name} fallbackPhone={user?.phone} />
          </div>
        )}
      </div>
    </div>
  )
}
