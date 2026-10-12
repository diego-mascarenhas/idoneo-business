'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import {
  claimAffiliateReferral,
  fetchAffiliateDashboard,
  sendAffiliateInvitation,
  setupAffiliateStripe,
  type AffiliateCatalog,
  type AffiliateDashboard,
  type AffiliateReferral,
} from './affiliatesApi'
import { type FeedbackProduct } from './feedbackApi'
import { FeedbackPanel } from './FeedbackPanel'
import { ApiError } from './http'
import { WizardArrowLeftIcon, WizardCheckCircleIcon, WizardSendIcon } from './BusinessWizardIcons'
import { CardHeaderButton } from './CardHeaderButton'
import { Panel } from './Panel'
import { SelectField } from './SelectField'

function CopyIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" />
      <path d="M4.012 16.737a2 2 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
    </svg>
  )
}

function UserPlusIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
      <path d="M16 19h6" />
      <path d="M19 16v6" />
      <path d="M6 21v-2a4 4 0 0 1 4 -4h4" />
    </svg>
  )
}

function FeedbackIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 9h8" />
      <path d="M8 13h6" />
      <path d="M3 7a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3z" />
    </svg>
  )
}

const inputClass =
  'w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[var(--accent)]'

function formatCents(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100)
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`
  }
}

function formatActivity(value?: string | null): string {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  if (diff > 0) {
    return date.toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }
  const ago = -diff
  if (ago < 60 * 60 * 1000) {
    return `Hace ${Math.max(1, Math.round(ago / 60000))} min`
  }
  if (date.toDateString() === now.toDateString()) {
    return `Hoy, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `Ayer, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
  }
  return date.toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function latestReferralActivity(referral: AffiliateReferral): {
  label: string
  at: string
  tone: string
  icon: 'sent' | 'opened' | 'clicked' | 'contracted'
} | null {
  const events = [
    referral.sent_at
      ? { label: 'Enviado', at: referral.sent_at, tone: 'text-[var(--warning)]', icon: 'sent' as const }
      : null,
    referral.opened_at
      ? { label: 'Abierto', at: referral.opened_at, tone: 'text-[var(--accent-strong)]', icon: 'opened' as const }
      : null,
    referral.clicked_at
      ? { label: 'Clic', at: referral.clicked_at, tone: 'text-[var(--cta)]', icon: 'clicked' as const }
      : null,
    referral.contracted_at
      ? { label: '', at: referral.contracted_at, tone: 'text-[var(--accent-strong)]', icon: 'contracted' as const }
      : null,
  ].filter((event): event is NonNullable<typeof event> => event !== null)

  if (events.length === 0) {
    return null
  }

  return events.sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())[0]
}

function ActivityGlyph({ icon }: { icon: 'sent' | 'opened' | 'clicked' | 'contracted' }) {
  const common = {
    className: 'h-3.5 w-3.5',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (icon === 'opened') {
    return (
      <svg {...common}>
        <path d="M2 12s3.5 -6 10 -6s10 6 10 6s-3.5 6 -10 6s-10 -6 -10 -6" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }

  if (icon === 'clicked') {
    return (
      <svg {...common}>
        <path d="M8 13l-2 -2l8 -8l2 2" />
        <path d="M14 6l2 2" />
        <path d="M4 20l6 -6" />
        <path d="M12 16l4 4" />
      </svg>
    )
  }

  if (icon === 'contracted') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 12l2 2l4 -4" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M10 14l11 -11" />
      <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
    </svg>
  )
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
}

function referralsFromDashboard(data: AffiliateDashboard): AffiliateReferral[] {
  if (data.referrals && data.referrals.length > 0) {
    return data.referrals
  }

  return data.invitations.map((invitation) => ({
    id: `invitation-${invitation.id}`,
    name: invitation.invitee_name,
    email: invitation.invitee_email,
    plan_name: invitation.plan_name,
    sent_at: invitation.sent_at,
    opened_at: invitation.opened_at,
    clicked_at: invitation.clicked_at,
    contracted: false,
    commission_cents: 0,
    commission_percent: data.commission_percent,
    currency: null,
    status: invitation.status,
  }))
}

export function RecommendationsPage({
  product,
  productName,
  catalog,
}: {
  product: FeedbackProduct
  productName: string
  catalog: AffiliateCatalog
}) {
  const queryClient = useQueryClient()
  const dashboardQuery = useQuery({
    queryKey: ['affiliates', 'dashboard', catalog],
    queryFn: () => fetchAffiliateDashboard(catalog),
  })

  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePlan, setInvitePlan] = useState('')
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  const data = dashboardQuery.data
  const plans = data?.plans ?? []
  const defaultPlanId = useMemo(() => plans[0]?.id ?? '', [plans])
  const selectedPlan = invitePlan || defaultPlanId

  const setup = useMutation({
    mutationFn: setupAffiliateStripe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['affiliates', 'dashboard'] })
    },
  })

  const invite = useMutation({
    mutationFn: () =>
      sendAffiliateInvitation({
        invite_name: inviteName.trim(),
        invite_email: inviteEmail.trim(),
        invite_plan: selectedPlan,
        catalog,
      }),
    onSuccess: async (response) => {
      setInviteMessage(response.message)
      setInviteName('')
      setInviteEmail('')
      await queryClient.invalidateQueries({ queryKey: ['affiliates', 'dashboard'] })
    },
    onError: (error) => {
      setInviteMessage(error instanceof ApiError ? error.message : 'No se pudo enviar la invitación.')
    },
  })

  async function onInvite(event: FormEvent) {
    event.preventDefault()
    setInviteMessage(null)
    invite.mutate()
  }

  async function copyReferralCode() {
    if (!data?.referral_code) {
      return
    }
    await navigator.clipboard.writeText(data.referral_code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Mis recomendaciones</h1>
          <p className="mt-1 text-[var(--muted)]">Recomendá {productName}.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowFeedback((current) => !current)}
          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold"
        >
          {showFeedback ? <WizardArrowLeftIcon className="h-4 w-4" /> : <FeedbackIcon />}
          {showFeedback ? 'Volver' : 'Feedback'}
        </button>
      </div>

      {showFeedback ? (
        <div className="mt-6">
          <FeedbackPanel product={product} productName={productName} />
        </div>
      ) : (
      <div className="mt-6">
        <Panel className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold">Recomendá {productName}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              El enlace invita al plan de {productName}, no a tokens ni a otros productos.
            </p>
          </div>

          {dashboardQuery.isLoading && (
            <p className="text-sm text-[var(--muted)]">Cargando recomendaciones…</p>
          )}

          {dashboardQuery.isError && (
            <p className="text-sm text-[var(--accent-strong)]">
              {dashboardQuery.error instanceof ApiError
                ? dashboardQuery.error.message
                : 'No se pudo cargar el programa.'}
            </p>
          )}

          {data && !data.eligible && (
            <p className="text-sm text-[var(--muted)]">
              {data.reason ?? 'Tu equipo no puede recomendar este producto.'}
            </p>
          )}

          {data?.eligible && (
            <>
              <div>
                <p className="mb-1.5 text-sm font-medium text-[var(--muted)]">Tu código</p>
                {data.referral_code ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <code className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent-strong)]">
                      {data.referral_code}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copyReferralCode()}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] px-3 py-2 text-sm font-medium"
                    >
                      {copied ? <WizardCheckCircleIcon className="h-4 w-4" /> : <CopyIcon />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-[var(--muted)]">
                      Activá tu código para compartir el plan de {productName}.
                    </p>
                    <button
                      type="button"
                      disabled={setup.isPending}
                      onClick={() => setup.mutate()}
                      className="rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {setup.isPending ? 'Activando…' : 'Activar código'}
                    </button>
                    {setup.isError && (
                      <p className="text-sm text-[var(--accent-strong)]">
                        {setup.error instanceof ApiError
                          ? setup.error.message
                          : 'No se pudo activar.'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {plans.length > 0 && (
                <div>
                  <p className="mb-1.5 text-sm font-medium text-[var(--muted)]">
                    Planes de {productName}
                  </p>
                  <ul className="divide-y divide-[var(--border)]">
                    {plans.map((plan) => (
                      <li key={plan.id} className="flex items-center justify-between gap-3 py-2">
                        <span className="text-sm font-medium">{plan.name}</span>
                        {plan.referral_url ? (
                          <a
                            href={plan.referral_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-[var(--accent-strong)] hover:underline"
                          >
                            Abrir enlace
                          </a>
                        ) : data.referral_code ? (
                          <span className="text-sm text-[var(--muted)]">Próximamente</span>
                        ) : (
                          <span className="text-sm text-[var(--muted)]">Activá el código</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <form onSubmit={onInvite} className="space-y-3">
                <p className="text-sm font-medium text-[var(--muted)]">Invitar por email</p>
                <input
                  value={inviteName}
                  onChange={(event) => setInviteName(event.target.value)}
                  placeholder="Nombre"
                  className={inputClass}
                  required
                />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="Email"
                  className={inputClass}
                  required
                />
                {plans.length > 1 && (
                  <SelectField
                    value={selectedPlan}
                    onChange={setInvitePlan}
                    required
                    placeholder="Plan"
                    options={plans.map((plan) => ({ value: plan.id, label: plan.name }))}
                  />
                )}
                <button
                  type="submit"
                  disabled={invite.isPending || !data.referral_code || plans.length === 0}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <WizardSendIcon className="h-4 w-4" />
                  {invite.isPending ? 'Enviando…' : 'Enviar invitación'}
                </button>
                {inviteMessage && <p className="text-sm text-[var(--accent-strong)]">{inviteMessage}</p>}
              </form>
            </>
          )}
        </Panel>
      </div>
      )}

      {!showFeedback && data?.eligible && (
        <ReferralsPanel data={data} catalog={catalog} />
      )}
    </div>
  )
}

function ReferralsPanel({
  data,
  catalog,
}: {
  data: AffiliateDashboard
  catalog: AffiliateCatalog
}) {
  const queryClient = useQueryClient()
  const [claimOpen, setClaimOpen] = useState(false)
  const referrals = referralsFromDashboard(data)
  const totals = Object.entries(data.totals_as_referrer)

  return (
    <Panel className="mt-6 space-y-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">A quienes referí</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            La última actividad y tu comisión.
          </p>
          {totals.length > 0 && (
            <p className="mt-1 text-sm text-[var(--muted)]">
              Comisión {data.commission_percent}% ·{' '}
              {totals.map(([currency, row]) => formatCents(row.commission_cents, currency)).join(' · ')}
            </p>
          )}
        </div>
        <CardHeaderButton className="gap-1" disabled={!data.referral_code} onClick={() => setClaimOpen(true)}>
          <UserPlusIcon />
          Incorporar
        </CardHeaderButton>
      </div>
      <ClaimReferralModal
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        onClaimed={async () => {
          setClaimOpen(false)
          await queryClient.invalidateQueries({ queryKey: ['affiliates', 'dashboard', catalog] })
        }}
      />

      <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
        <table className="w-full text-left text-sm" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-[var(--chip)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2.5 font-medium" style={{ width: '34%' }}>Persona</th>
              <th className="px-3 py-2.5 font-medium" style={{ width: '38%' }}>Actividad</th>
              <th className="px-3 py-2.5 text-right font-medium" style={{ width: '28%' }}>Comisión</th>
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-[var(--muted)]">
                  Todavía no referiste a nadie. Enviá una invitación o compartí tu enlace.
                </td>
              </tr>
            ) : (
              referrals.map((referral) => (
                <tr key={referral.id} className="border-t border-[var(--border)]">
                  <td className="overflow-hidden px-3 py-2.5">
                    <p className="truncate font-medium">{referral.name}</p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      {[referral.email, referral.plan_name].filter(Boolean).join(' · ')}
                    </p>
                  </td>
                  <td className="overflow-hidden whitespace-nowrap px-3 py-2.5">
                    {(() => {
                      const activity = latestReferralActivity(referral)
                      if (!activity) {
                        return <span className="text-[var(--muted)]">—</span>
                      }

                      const when = activity.icon === 'contracted' ? formatDateTime(activity.at) : formatActivity(activity.at)

                      return (
                        <span className={['inline-flex max-w-full items-center gap-1.5 overflow-hidden text-xs', activity.tone].join(' ')}>
                          <ActivityGlyph icon={activity.icon} />
                          <span>
                            {activity.label ? `${activity.label} · ` : ''}
                            <span className={activity.label ? 'text-[var(--muted)]' : undefined}>{when}</span>
                          </span>
                        </span>
                      )
                    })()}
                  </td>
                  <td className="overflow-hidden whitespace-nowrap px-3 py-2.5 text-right font-medium">
                    {referral.commission_cents > 0 && referral.currency
                      ? formatCents(referral.commission_cents, referral.currency)
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function ClaimReferralModal({
  open,
  onClose,
  onClaimed,
}: {
  open: boolean
  onClose: () => void
  onClaimed: () => void | Promise<void>
}) {
  const titleId = useId()
  const [subscriptionCode, setSubscriptionCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const claim = useMutation({
    mutationFn: () => claimAffiliateReferral(subscriptionCode.trim()),
    onSuccess: async () => {
      setSubscriptionCode('')
      setError(null)
      await onClaimed()
    },
    onError: (claimError) => {
      setError(claimError instanceof ApiError ? claimError.message : 'No se pudo incorporar el cliente.')
    },
  })

  useEffect(() => {
    if (!open) {
      setSubscriptionCode('')
      setError(null)
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !claim.isPending) {
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, claim.isPending, onClose])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    claim.mutate()
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        disabled={claim.isPending}
        onClick={onClose}
        className="absolute inset-0 bg-[var(--text)]/45"
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.35rem] border border-[var(--border)] bg-[var(--surface-solid)] shadow-[var(--shadow)]"
      >
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">
            Incorporar cliente
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Pedile el código de su plan y pegalo acá para sumarlo a tus recomendaciones.
          </p>
        </div>
        <div className="space-y-3 px-5 py-4">
          <label className="block text-sm" htmlFor="claim-subscription-code">
            <span className="mb-1.5 block font-medium text-[var(--muted)]">Código de suscripción</span>
            <input
              id="claim-subscription-code"
              value={subscriptionCode}
              onChange={(event) => setSubscriptionCode(event.target.value)}
              placeholder="sub_… o cus_…"
              className={inputClass}
              autoFocus
              required
            />
          </label>
          {error && <p className="text-sm text-[var(--accent-strong)]">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
          <button
            type="button"
            disabled={claim.isPending}
            onClick={onClose}
            className="rounded-2xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={claim.isPending || subscriptionCode.trim() === ''}
            className="rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {claim.isPending ? 'Incorporando…' : 'Incorporar'}
          </button>
        </div>
      </form>
    </div>
  )
}
