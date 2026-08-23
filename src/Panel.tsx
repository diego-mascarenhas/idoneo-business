import type { ReactNode } from 'react'

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={['widget-solid', 'rise-in', className].filter(Boolean).join(' ')}>{children}</div>
}
