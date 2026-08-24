import type { ReactNode } from 'react'

export function Panel({
  children,
  className = '',
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <div id={id} className={['widget-solid', 'rise-in', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
