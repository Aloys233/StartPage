import type { IconType } from 'react-icons'

export type SearchEngineId =
  | 'google'
  | 'bing'
  | 'baidu'
  | 'duckduckgo'
  | 'github'
  | 'stackoverflow'
  | 'bilibili'
  | 'youtube'

export type SuggestionEngineId = 'google' | 'bing' | 'baidu' | 'duckduckgo' | 'youtube'

export interface SearchEngine {
  id: SearchEngineId
  name: string
  icon: IconType
  color: string
  url: string
}

export interface ErrorDetail {
  field?: string
  reason?: string
}

export interface ErrorResponse {
  code: string
  message: string
  details?: ErrorDetail[]
}

export interface UserProfile {
  id: string
  email: string
  username: string
  name: string
  avatarUrl: string
  createdAt: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface AuthResponse extends TokenPair {
  user: UserProfile
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ShortcutItem {
  id: string
  title: string
  url: string
  icon: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ShortcutDraft {
  title: string
  url: string
  icon?: string
}

export interface ReplaceShortcutItem extends ShortcutDraft {
  id?: string
  sortOrder?: number
}

export interface ShortcutListResponse {
  items: ShortcutItem[]
  updatedAt: string
}

export interface ReorderShortcutsRequest {
  ids: string[]
}

export interface UserSettings {
  defaultEngine: SearchEngineId
  locale: string
  updatedAt: string
}

export interface UpdateSettingsRequest {
  defaultEngine?: SearchEngineId
  locale?: string
}

export interface SuggestionResponse {
  q: string
  engine: SuggestionEngineId
  items: string[]
}

export type SuggestionStatus = 'idle' | 'loading' | 'ready'

export interface ShortcutsBootstrap {
  hasStoredValue: boolean
  shortcuts: ShortcutItem[]
}
