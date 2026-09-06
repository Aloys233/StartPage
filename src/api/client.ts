import type { ErrorResponse, UserProfile } from '@/features/home/types'

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.PUBLIC_API_BASE_URL ??
  ''
).replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: ErrorResponse['details']

  constructor(status: number, payload: Partial<ErrorResponse> | null = null, fallbackMessage?: string) {
    super(payload?.message ?? fallbackMessage ?? 'Request failed')
    this.name = 'ApiError'
    this.status = status
    this.code = payload?.code ?? 'REQUEST_FAILED'
    this.details = payload?.details
  }
}

interface SessionState {
  accessToken: string | null
  user: UserProfile | null
}

export interface SessionSnapshot extends SessionState {
  isAuthenticated: boolean
}

type SessionListener = (snapshot: SessionSnapshot) => void

const sessionState: SessionState = {
  accessToken: null,
  user: null,
}

const listeners = new Set<SessionListener>()

const getSnapshot = (): SessionSnapshot => ({
  ...sessionState,
  isAuthenticated: Boolean(sessionState.accessToken && sessionState.user),
})

const emitSession = () => {
  const snapshot = getSnapshot()
  listeners.forEach((listener) => listener(snapshot))
}

const parseErrorPayload = (value: unknown): Partial<ErrorResponse> | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const payload = value as Partial<ErrorResponse>
  if (typeof payload.message === 'string' || typeof payload.code === 'string') {
    return payload
  }

  return null
}

const isInternalRoute = (path: string) => path.startsWith('/api/bing')

const buildUrl = (path: string, query?: Record<string, string | number | boolean | undefined>) => {
  const isInternal = isInternalRoute(path)
  const baseUrl = isInternal ? '' : API_BASE_URL

  const url = baseUrl
    ? new URL(path, `${baseUrl}/`)
    : typeof window !== 'undefined'
      ? new URL(path, window.location.origin)
      : new URL(path, 'http://localhost:3000')

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) return
      url.searchParams.set(key, String(value))
    })
  }

  if (baseUrl) {
    return url.toString()
  }

  return `${url.pathname}${url.search}`
}

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new ApiError(response.status, null, 'Invalid JSON response')
  }
}

const rawRequest = async <T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
    query?: Record<string, string | number | boolean | undefined>
    accessToken?: string | null
  } = {},
): Promise<T> => {
  const { method = 'GET', body, query, accessToken } = options

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  let response: Response

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, { code: 'NETWORK_ERROR', message: 'Network request failed' })
  }

  if (!response.ok) {
    const payload = parseErrorPayload(await parseResponse<unknown>(response).catch(() => null))
    throw new ApiError(response.status, payload, response.statusText)
  }

  return parseResponse<T>(response)
}

export const setAccessToken = (token: string | null) => {
  sessionState.accessToken = token
  emitSession()
}

export const setSessionUser = (user: UserProfile | null) => {
  sessionState.user = user
  emitSession()
}

export const getSessionSnapshot = (): SessionSnapshot => getSnapshot()

export const subscribeSession = (listener: SessionListener) => {
  listeners.add(listener)
  listener(getSnapshot())
  return () => {
    listeners.delete(listener)
  }
}

export const clearSession = () => {
  sessionState.accessToken = null
  sessionState.user = null
  emitSession()
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  auth?: boolean
}

export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { auth = false } = options

  return await rawRequest<T>(path, {
    ...options,
    accessToken: auth ? sessionState.accessToken : null,
  })
}
