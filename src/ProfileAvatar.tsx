'use client'

import { useState } from 'react'

function userInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || '?').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export function ProfileAvatar({
  photoUrl,
  name,
  email,
  className = 'h-20 w-20 text-lg',
  roundedClass = 'rounded-2xl',
}: {
  photoUrl?: string | null
  name?: string | null
  email?: string | null
  className?: string
  roundedClass?: string
}) {
  const label = userInitials(name, email)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const showPhoto = Boolean(photoUrl) && failedUrl !== photoUrl

  if (showPhoto && photoUrl) {
    return (
      <span className={`grid ${className} shrink-0 place-items-center overflow-hidden ${roundedClass} bg-[var(--accent-soft)]`}>
        <img
          src={photoUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(photoUrl)}
        />
      </span>
    )
  }

  return (
    <span
      className={`grid ${className} shrink-0 place-items-center ${roundedClass} bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent-strong)]`}
    >
      {label}
    </span>
  )
}
