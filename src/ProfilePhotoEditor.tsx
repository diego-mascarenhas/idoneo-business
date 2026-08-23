'use client'

import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'
import { createPortal } from 'react-dom'
import { exportProfilePhoto, loadProfilePhotoBitmap } from './profile-photo'

const VIEW = 288
const MIN_ZOOM = 1
const MAX_ZOOM = 3

type PhotoSource = {
  bitmap: ImageBitmap
  previewUrl: string
}

function minScale(bitmap: ImageBitmap): number {
  return Math.max(VIEW / bitmap.width, VIEW / bitmap.height)
}

function clampOffset(offset: { x: number; y: number }, scale: number, bitmap: ImageBitmap) {
  const width = bitmap.width * scale
  const height = bitmap.height * scale
  return {
    x: Math.min(0, Math.max(VIEW - width, offset.x)),
    y: Math.min(0, Math.max(VIEW - height, offset.y)),
  }
}

function centeredOffset(bitmap: ImageBitmap, scale: number) {
  return clampOffset(
    {
      x: (VIEW - bitmap.width * scale) / 2,
      y: (VIEW - bitmap.height * scale) / 2,
    },
    scale,
    bitmap,
  )
}

export function ProfilePhotoEditor({
  open,
  pending,
  error,
  hasPhoto,
  initialBlob,
  onClose,
  onPickFile,
  onSave,
  onRemove,
}: {
  open: boolean
  pending: boolean
  error?: string | null
  hasPhoto: boolean
  initialBlob?: Blob | null
  onClose: () => void
  onPickFile: (file: File) => void
  onSave: (file: File) => void
  onRemove: () => void
}) {
  const titleId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState<PhotoSource | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [loadError, setLoadError] = useState<string | null>(null)
  const dragRef = useRef<{ x: number; y: number; origin: { x: number; y: number } } | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false
    if (!initialBlob) {
      setSource(null)
      setLoadError(null)
      return
    }

    void loadProfilePhotoBitmap(initialBlob)
      .then((bitmap) => {
        if (cancelled) {
          bitmap.close()
          return
        }
        const scale = minScale(bitmap)
        setSource({ bitmap, previewUrl: URL.createObjectURL(initialBlob) })
        setZoom(1)
        setOffset(centeredOffset(bitmap, scale))
        setLoadError(null)
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'No se pudo leer la foto.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [open, initialBlob])

  useEffect(() => {
    return () => {
      if (source?.previewUrl) {
        URL.revokeObjectURL(source.previewUrl)
      }
      source?.bitmap.close()
    }
  }, [source])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, pending, onClose])

  if (!open || typeof document === 'undefined') {
    return null
  }

  const scale = source ? minScale(source.bitmap) * zoom : 1

  function applyZoom(nextZoom: number, around = { x: VIEW / 2, y: VIEW / 2 }) {
    if (!source) return
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))
    const currentScale = minScale(source.bitmap) * zoom
    const nextScale = minScale(source.bitmap) * clamped
    const imageX = (around.x - offset.x) / currentScale
    const imageY = (around.y - offset.y) / currentScale
    setZoom(clamped)
    setOffset(
      clampOffset(
        {
          x: around.x - imageX * nextScale,
          y: around.y - imageY * nextScale,
        },
        nextScale,
        source.bitmap,
      ),
    )
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!source || pending) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, origin: offset }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!source || !dragRef.current) return
    const nextScale = minScale(source.bitmap) * zoom
    setOffset(
      clampOffset(
        {
          x: dragRef.current.origin.x + (event.clientX - dragRef.current.x),
          y: dragRef.current.origin.y + (event.clientY - dragRef.current.y),
        },
        nextScale,
        source.bitmap,
      ),
    )
  }

  function onPointerUp() {
    dragRef.current = null
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    if (!source) return
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    applyZoom(zoom + (event.deltaY < 0 ? 0.12 : -0.12), {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
  }

  async function save() {
    if (!source) return
    const nextScale = minScale(source.bitmap) * zoom
    const file = await exportProfilePhoto(source.bitmap, {
      sx: -offset.x / nextScale,
      sy: -offset.y / nextScale,
      sw: VIEW / nextScale,
      sh: VIEW / nextScale,
    })
    onSave(file)
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        disabled={pending}
        onClick={onClose}
        className="absolute inset-0 bg-[var(--text)]/45"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.35rem] border border-[var(--border)] bg-[var(--surface-solid)] shadow-[var(--shadow)]"
      >
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">
            Foto de perfil
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Arrastrá para encuadrar. Usá el zoom para recortar.
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex justify-center">
            <div
              className="relative overflow-hidden rounded-[1.5rem] bg-[var(--chip)] shadow-[var(--shadow-soft)]"
              style={{ width: VIEW, height: VIEW, touchAction: 'none', cursor: source ? 'grab' : 'default' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
            >
              {source ? (
                <img
                  src={source.previewUrl}
                  alt=""
                  draggable={false}
                  className="absolute max-w-none select-none"
                  style={{
                    width: source.bitmap.width * scale,
                    height: source.bitmap.height * scale,
                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                  }}
                />
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => inputRef.current?.click()}
                  className="grid h-full w-full place-items-center text-sm text-[var(--muted)]"
                >
                  Elegí una foto
                </button>
              )}
              <div
                className="pointer-events-none absolute inset-0 bg-[rgba(10,16,12,0.45)]"
                style={{
                  WebkitMaskImage: 'radial-gradient(circle at center, transparent 41%, black 42%)',
                  maskImage: 'radial-gradient(circle at center, transparent 41%, black 42%)',
                }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-[16%] rounded-full border-2 border-white/85"
                aria-hidden
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!source || pending || zoom <= MIN_ZOOM}
              onClick={() => applyZoom(zoom - 0.2)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-lg leading-none disabled:opacity-40"
              aria-label="Alejar"
            >
              −
            </button>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              disabled={!source || pending}
              onChange={(event) => applyZoom(Number(event.target.value))}
              className="h-1.5 flex-1 accent-[var(--accent)]"
              aria-label="Zoom"
            />
            <button
              type="button"
              disabled={!source || pending || zoom >= MAX_ZOOM}
              onClick={() => applyZoom(zoom + 0.2)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-lg leading-none disabled:opacity-40"
              aria-label="Acercar"
            >
              +
            </button>
          </div>

          {(error || loadError) && (
            <p className="text-sm text-[var(--danger)]">{error || loadError}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] px-5 py-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            >
              {source ? 'Elegir otra' : 'Elegir foto'}
            </button>
            {hasPhoto ? (
              <button
                type="button"
                disabled={pending}
                onClick={onRemove}
                className="rounded-xl px-3 py-2 text-sm text-[var(--danger)]"
              >
                Quitar foto
              </button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={onClose}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!source || pending}
              onClick={() => {
                void save()
              }}
              className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {pending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="sr-only"
          disabled={pending}
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) onPickFile(file)
          }}
        />
      </div>
    </div>,
    document.body,
  )
}
