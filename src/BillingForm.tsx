'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchBilling, updateBilling } from './profileApi'
import { applyCountryDialCode, dialCodeForCountry } from './countries'
import { ApiError } from './http'
import { CountrySelect } from './CountrySelect'
import { Panel } from './Panel'
import type { BillingFields } from './profileTypes'

const inputClass =
  'w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[var(--accent)]'

function fieldError(error: unknown, field: string): string | undefined {
  if (!(error instanceof ApiError) || typeof error.body !== 'object' || !error.body) {
    return undefined
  }
  const errors = (error.body as { errors?: Record<string, string[]> }).errors
  return errors?.[field]?.[0]
}

function BillingFieldsForm({
  initial,
  fallbackName,
  fallbackPhone,
}: {
  initial: BillingFields
  fallbackName?: string
  fallbackPhone?: string | null
}) {
  const queryClient = useQueryClient()
  const [businessName, setBusinessName] = useState(initial.business_name || '')
  const [country, setCountry] = useState((initial.country || '').toUpperCase())
  const [phone, setPhone] = useState(initial.phone || fallbackPhone || '')
  const [taxId, setTaxId] = useState(initial.tax_id || '')

  const individualName = (initial.individual_name || fallbackName || '').trim()
  const selectedDial = dialCodeForCountry(country)

  const save = useMutation({
    mutationFn: () =>
      updateBilling({
        individual_name: individualName,
        business_name: businessName.trim() || null,
        country,
        phone: phone.trim(),
        tax_id: taxId.trim(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['billing'] })
      await queryClient.invalidateQueries({ queryKey: ['assistant-subscription'] })
    },
  })

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-[var(--muted)]">Razón social</span>
          <input
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            className={inputClass}
            placeholder="Mi Empresa S.A."
          />
          <span className="mt-1.5 block text-xs text-[var(--muted)]">
            Opcional. Si no se completa, se usará el nombre completo.
          </span>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-[var(--muted)]">Identificación fiscal (*)</span>
          <input
            value={taxId}
            onChange={(event) => setTaxId(event.target.value)}
            className={inputClass}
            placeholder="CUIT, CIF, NIF, RFC…"
          />
          <span className="mt-1.5 block text-xs text-[var(--muted)]">
            Ej.: 20250242000 (AR), B12345678 (ES), ABCD123456ABC (MX).
          </span>
          {fieldError(save.error, 'tax_id') && (
            <p className="mt-1.5 text-xs text-[var(--danger)]">{fieldError(save.error, 'tax_id')}</p>
          )}
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-[var(--muted)]">País (*)</span>
          <CountrySelect
            value={country}
            onChange={(next) => {
              setCountry(next)
              setPhone((current) => applyCountryDialCode(current, next))
            }}
          />
          {fieldError(save.error, 'country') && (
            <p className="mt-1.5 text-xs text-[var(--danger)]">{fieldError(save.error, 'country')}</p>
          )}
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-[var(--muted)]">WhatsApp (*)</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={inputClass}
            placeholder={selectedDial ? `${selectedDial} …` : '+54 9 11 0000-0000'}
          />
          {fieldError(save.error, 'phone') && (
            <p className="mt-1.5 text-xs text-[var(--danger)]">{fieldError(save.error, 'phone')}</p>
          )}
        </label>
      </div>

      {save.isSuccess && (
        <p className="text-sm text-[var(--accent-strong)]">
          {save.data.message}
          {save.data.warning ? ` ${save.data.warning}` : ''}
        </p>
      )}

      {save.isError &&
        !fieldError(save.error, 'individual_name') &&
        !fieldError(save.error, 'tax_id') &&
        !fieldError(save.error, 'phone') &&
        !fieldError(save.error, 'country') && (
          <p className="text-sm text-[var(--danger)]">
            {save.error instanceof ApiError
              ? save.error.message
              : 'No se pudieron guardar los datos de facturación.'}
          </p>
        )}

      {fieldError(save.error, 'individual_name') && (
        <p className="text-sm text-[var(--danger)]">{fieldError(save.error, 'individual_name')}</p>
      )}

      <button
        type="button"
        disabled={save.isPending}
        onClick={() => save.mutate()}
        className="rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {save.isPending ? 'Guardando…' : 'Guardar facturación'}
      </button>
    </>
  )
}

export function BillingForm({
  fallbackName,
  fallbackPhone,
  className = 'space-y-4 p-6',
}: {
  fallbackName?: string
  fallbackPhone?: string | null
  className?: string
}) {
  const billingQuery = useQuery({
    queryKey: ['billing'],
    queryFn: fetchBilling,
  })

  return (
    <Panel className={className}>
      <div>
        <h2 className="text-lg font-semibold">Datos de facturación</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Estos datos se usan para el checkout de Stripe. Si no completás la razón social, se usa el
          nombre completo.
        </p>
      </div>

      {billingQuery.isLoading && <p className="text-sm text-[var(--muted)]">Cargando facturación…</p>}

      {billingQuery.isError && (
        <p className="text-sm text-[var(--danger)]">
          {billingQuery.error instanceof ApiError
            ? billingQuery.error.message
            : 'No se pudieron cargar los datos de facturación.'}
        </p>
      )}

      {billingQuery.data && (
        <BillingFieldsForm
          key={`${billingQuery.data.team.id}-${fallbackName ?? ''}`}
          initial={billingQuery.data.billing}
          fallbackName={fallbackName}
          fallbackPhone={fallbackPhone}
        />
      )}
    </Panel>
  )
}
