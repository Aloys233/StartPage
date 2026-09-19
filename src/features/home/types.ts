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

export interface ShortcutItem {
  id: string
  title: string
  url: string
  icon: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ShortcutListResponse {
  items: ShortcutItem[]
  updatedAt: string
  /** 乐观并发凭证：每次写操作自增，写请求必须带上已知值 */
  revision: number
  /** 相对请求中 since 参数而言被删除的 id，用于增量对账 */
  deletedIds: string[]
}

export interface ReorderShortcutsRequest {
  ids: string[]
}

/** 离线操作队列中的一条待同步操作。create 带客户端生成的 id，因此重放是幂等的。 */
export type ShortcutQueueOp =
  | { type: 'create'; id: string; title: string; url: string; icon: string }
  | { type: 'update'; id: string; title: string; url: string; icon: string }
  | { type: 'delete'; id: string }
  | { type: 'reorder'; ids: string[] }

/** 登录用户的同步元数据，持久化在 localStorage */
export interface ShortcutSyncDoc {
  revision: number
  pendingOps: ShortcutQueueOp[]
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

export type SuggestionStatus = 'idle' | 'loading' | 'ready'
