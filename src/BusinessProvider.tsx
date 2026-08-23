'use client'

import { useMemo, type ReactNode } from 'react'
import {
  configureBusinessHttp,
  createBusinessHttp,
  type BusinessClientConfig,
} from './http'

export function BusinessProvider({
  getToken,
  baseUrl,
  children,
}: BusinessClientConfig & { children: ReactNode }) {
  useMemo(() => {
    configureBusinessHttp(createBusinessHttp({ getToken, baseUrl }))
  }, [baseUrl, getToken])

  return children
}
