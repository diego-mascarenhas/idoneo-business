'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { BILLING_COUNTRIES, dialCodeForCountry } from './countries'

const triggerClass =
  'flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-left outline-none focus:ring-2 focus:ring-[var(--accent)]'

export function CountrySelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const countries = useMemo(() => {
    const extra =
      value && !BILLING_COUNTRIES.some((item) => item.code === value)
        ? [{ code: value, name: value }]
        : []
    return [...extra, ...BILLING_COUNTRIES]
  }, [value])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return countries
    return countries.filter((item) => {
      const dial = dialCodeForCountry(item.code) ?? ''
      return (
        item.name.toLowerCase().includes(needle) ||
        item.code.toLowerCase().includes(needle) ||
        dial.includes(needle)
      )
    })
  }, [countries, query])

  const selected = countries.find((item) => item.code === value)

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setOpen((current) => !current)
          setQuery('')
          window.setTimeout(() => searchRef.current?.focus(), 0)
        }}
        className={triggerClass}
      >
        <span className={selected ? 'text-[var(--text)]' : 'text-[var(--muted)]'}>
          {selected?.name ?? 'Seleccione un país'}
        </span>
        <svg
          viewBox="0 0 16 16"
          aria-hidden
          className={['h-4 w-4 text-[var(--muted)]', open ? 'rotate-180' : ''].join(' ')}
        >
          <path
            d="M4.2 6.2 8 10l3.8-3.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] shadow-[var(--shadow)]"
        >
          <div className="border-b border-[var(--border)] p-2">
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar país…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <ul className="max-h-56 overflow-auto p-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-[var(--muted)]">Sin resultados</li>
            )}
            {filtered.map((item) => {
              const active = item.code === value
              return (
                <li key={item.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(item.code)
                      setOpen(false)
                      setQuery('')
                    }}
                    className={[
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition',
                      active
                        ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent-strong)]'
                        : 'text-[var(--text)] hover:bg-[var(--chip)]',
                    ].join(' ')}
                  >
                    <span>{item.name}</span>
                    <span className="text-xs text-[var(--muted)]">
                      {dialCodeForCountry(item.code) ?? item.code}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
