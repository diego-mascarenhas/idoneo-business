'use client'

import { useEffect, useState } from 'react'
import { ApiError } from './http'
import { deleteProfilePhoto, fetchProfilePhotoBlob, updateProfilePhoto } from './profileApi'
import { ProfileAvatar } from './ProfileAvatar'
import { ProfilePhotoEditor } from './ProfilePhotoEditor'
import type { ProfileUser } from './profileTypes'

function photoErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message
  }
  if (err instanceof TypeError) {
    return 'No se pudo enviar la foto. Probá de nuevo con un JPG o PNG.'
  }
  if (err instanceof Error && err.message) {
    return err.message
  }
  return 'No se pudo actualizar la foto.'
}

export function ProfilePhotoField({
  user,
  applyProfile,
}: {
  user: ProfileUser | null
  applyProfile: (user: ProfileUser) => void
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [picked, setPicked] = useState<Blob | null>(null)
  const [stored, setStored] = useState<Blob | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    if (picked || !user?.profile_photo_url) {
      if (!picked) setStored(null)
      return
    }

    let cancelled = false
    void fetchProfilePhotoBlob()
      .then((blob) => {
        if (!cancelled) setStored(blob)
      })
      .catch(() => {
        if (!cancelled) setStored(null)
      })

    return () => {
      cancelled = true
    }
  }, [open, picked, user?.profile_photo_url])

  function close() {
    if (pending) return
    setOpen(false)
    setPicked(null)
    setStored(null)
    setError(null)
  }

  async function persist(next: () => Promise<{ user: ProfileUser }>) {
    setPending(true)
    setError(null)
    try {
      applyProfile((await next()).user)
      setOpen(false)
      setPicked(null)
      setStored(null)
    } catch (err) {
      setError(photoErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null)
          setOpen(true)
        }}
        aria-label="Editar foto de perfil"
        className="relative overflow-hidden rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-60"
      >
        <ProfileAvatar
          photoUrl={user?.profile_photo_url}
          name={user?.name}
          email={user?.email}
        />
        <span className="absolute inset-x-0 bottom-0 bg-[var(--text)]/55 py-1 text-center text-[10px] font-medium text-white">
          Editar
        </span>
      </button>
      <ProfilePhotoEditor
        open={open}
        pending={pending}
        error={error}
        hasPhoto={Boolean(user?.profile_photo_url)}
        initialBlob={picked ?? stored}
        onClose={close}
        onPickFile={setPicked}
        onSave={(file) => {
          void persist(() => updateProfilePhoto(file))
        }}
        onRemove={() => {
          void persist(() => deleteProfilePhoto())
        }}
      />
    </div>
  )
}
