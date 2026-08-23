'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import {
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
import { Panel } from './Panel'
import { SelectField } from './SelectField'

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
    <div>
      <h1 className="font-display text-3xl font-semibold">Mis recomendaciones</h1>
      <p className="mt-1 text-[var(--muted)]">
        Recomendá {productName} y dejá feedback sobre el producto.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
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
                      className="rounded-2xl border border-[var(--border)] px-3 py-2 text-sm font-medium"
                    >
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
                  className="rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {invite.isPending ? 'Enviando…' : 'Enviar invitación'}
                </button>
                {inviteMessage && <p className="text-sm text-[var(--accent-strong)]">{inviteMessage}</p>}
              </form>
            </>
          )}
        </Panel>

        <FeedbackPanel product={product} productName={productName} />
      </div>

      {data?.eligible && (
        <ReferralsPanel data={data} />
      )}
    </div>
  )
}

function ReferralsPanel({ data }: { data: AffiliateDashboard }) {
  const referrals = referralsFromDashboard(data)
  const totals = Object.entries(data.totals_as_referrer)

  return (
    <Panel className="mt-6 space-y-4 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">A quienes referí</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Apertura del email, si contrataron y tu comisión.
          </p>
        </div>
        {totals.length > 0 && (
          <p className="text-sm text-[var(--muted)]">
            Comisión {data.commission_percent}% ·{' '}
            {totals.map(([currency, row]) => formatCents(row.commission_cents, currency)).join(' · ')}
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[var(--chip)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="px-3.5 py-2.5 font-medium">Persona</th>
              <th className="px-3.5 py-2.5 font-medium">Email abierto</th>
              <th className="px-3.5 py-2.5 font-medium">Contrató</th>
              <th className="px-3.5 py-2.5 font-medium text-right">Comisión</th>
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3.5 py-6 text-center text-[var(--muted)]">
                  Todavía no referiste a nadie. Enviá una invitación o compartí tu enlace.
                </td>
              </tr>
            ) : (
              referrals.map((referral) => (
                <tr key={referral.id} className="border-t border-[var(--border)]">
                  <td className="px-3.5 py-2.5">
                    <p className="font-medium">{referral.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {[referral.email, referral.plan_name].filter(Boolean).join(' · ')}
                    </p>
                  </td>
                  <td className="px-3.5 py-2.5 text-[var(--muted)]">
                    {referral.opened_at
                      ? formatDateTime(referral.opened_at)
                      : referral.sent_at
                        ? 'Sin abrir'
                        : '—'}
                  </td>
                  <td className="px-3.5 py-2.5">
                    {referral.contracted ? (
                      <span className="text-[var(--accent-strong)]">
                        Sí
                        {referral.contracted_at ? ` · ${formatDateTime(referral.contracted_at)}` : ''}
                      </span>
                    ) : (
                      <span className="text-[var(--muted)]">No</span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-medium">
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
