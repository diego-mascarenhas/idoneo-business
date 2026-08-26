'use client'

import { useQuery } from '@tanstack/react-query'
import { ApiError } from './http'
import { fetchWhatsAppLineUsage } from './usageApi'
import { UsageBoard } from './UsageBoard'

export function UsagePage({ teamId }: { teamId?: number | string | null }) {
  const usageQuery = useQuery({
    queryKey: ['assistant-usage', teamId],
    queryFn: fetchWhatsAppLineUsage,
  })

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-semibold leading-none">Consumo</h1>
        <p className="mt-1.5 text-sm text-[var(--muted)]">
          Tokens, costo y modelo por línea de WhatsApp
        </p>
      </div>

      {usageQuery.isLoading && <p className="text-[var(--muted)]">Cargando consumo…</p>}

      {usageQuery.isError && (
        <p role="alert" className="rounded-2xl bg-[var(--danger-soft)] px-3 py-2.5 text-sm text-[var(--danger)]">
          {usageQuery.error instanceof ApiError
            ? usageQuery.error.message
            : 'No se pudo cargar el consumo.'}
        </p>
      )}

      {usageQuery.data && <UsageBoard data={usageQuery.data} />}
    </div>
  )
}
