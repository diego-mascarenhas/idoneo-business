export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function messageFromBody(data: unknown, status: number): string {
  if (status === 503 || isServiceUnavailable(data)) {
    return 'Estamos realizando una tarea de mantenimiento, en breve volvemos!'
  }

  if (typeof data === 'object' && data) {
    if ('errors' in data && data.errors && typeof data.errors === 'object') {
      const first = Object.values(data.errors as Record<string, unknown>)[0]
      if (Array.isArray(first) && typeof first[0] === 'string') {
        return first[0]
      }
      if (typeof first === 'string') {
        return first
      }
    }
    if ('message' in data && data.message != null) {
      return String(data.message)
    }
  }

  return `Request failed (${status})`
}

function isServiceUnavailable(data: unknown): boolean {
  if (typeof data === 'string') {
    return /service unavailable/i.test(data)
  }
  if (typeof data === 'object' && data) {
    const record = data as Record<string, unknown>
    return [record.message, record.error].some(
      (value) => typeof value === 'string' && /service unavailable/i.test(value),
    )
  }
  return false
}

export type BusinessHttp = {
  request<T>(path: string, options?: { method?: string; body?: unknown }): Promise<T>
  form<T>(path: string, body: FormData): Promise<T>
  blob(path: string): Promise<Blob>
}

export type BusinessClientConfig = {
  getToken: () => string | null
  baseUrl?: string
}

function normalizeBase(baseUrl?: string): string {
  return (baseUrl ?? 'https://humano.test/api').replace(/\/$/, '')
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export function createBusinessHttp(config: BusinessClientConfig): BusinessHttp {
  const baseUrl = normalizeBase(config.baseUrl)

  async function send<T>(
    path: string,
    init: RequestInit,
    accept = 'application/json',
  ): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set('Accept', accept)
    const token = config.getToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      headers,
    })
    const data = await parseBody(response)
    if (!response.ok) {
      throw new ApiError(messageFromBody(data, response.status), response.status, data)
    }

    return data as T
  }

  return {
    request<T>(path: string, options: { method?: string; body?: unknown } = {}) {
      return send<T>(path, {
        method: options.method ?? 'GET',
        headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      })
    },
    form<T>(path: string, body: FormData) {
      return send<T>(path, { method: 'POST', body })
    },
    async blob(path: string) {
      const headers: Record<string, string> = {
        Accept: 'image/*,application/octet-stream,application/json',
      }
      const token = config.getToken()
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
        headers,
      })
      if (!response.ok) {
        const data = await parseBody(response)
        throw new ApiError(messageFromBody(data, response.status), response.status, data)
      }

      return response.blob()
    },
  }
}

let http: BusinessHttp | null = null

export function configureBusinessHttp(next: BusinessHttp): void {
  http = next
}

export function getBusinessHttp(): BusinessHttp {
  if (!http) {
    throw new ApiError('idoneo-business no está configurado.', 500, null)
  }

  return http
}
