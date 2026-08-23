'use client'

import { useEffect, useId, useRef, useState } from 'react'

const triggerClass =
  'flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-left outline-none focus:ring-2 focus:ring-[var(--accent)]'

export function SelectField({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar…',
  required = false,
}: {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) {
      return
    }

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
      {required && (
        <input
          tabIndex={-1}
          required
          value={value}
          onChange={() => undefined}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      )}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className={triggerClass}
      >
        <span className={selected ? 'text-[var(--text)]' : 'text-[var(--muted)]'}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          viewBox="0 0 16 16"
          aria-hidden
          className={['h-4 w-4 shrink-0 text-[var(--muted)] transition', open ? 'rotate-180' : ''].join(' ')}
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
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-1 shadow-[var(--shadow)]"
        >
          {options.map((option) => {
            const active = option.value === value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={[
                    'flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition',
                    active
                      ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent-strong)]'
                      : 'text-[var(--text)] hover:bg-[var(--chip)]',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
