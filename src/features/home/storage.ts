import type { ShortcutItem } from '@/features/home/types'
import {
  ENGINE_STORAGE_KEY,
  engines,
  GUEST_SCOPE,
  MAX_SEARCH_HISTORY,
  MAX_SHORTCUT_TITLE_LENGTH,
  SEARCH_HISTORY_STORAGE_KEY,
  SHORTCUTS_DATA_KEY_PREFIX,
  SHORTCUTS_MIGRATION_FLAG_KEY,
  SHORTCUTS_STORAGE_BACKUP_KEY,
  SHORTCUTS_STORAGE_RECOVERY_KEY,
  SHORTCUTS_STORAGE_RECOVERY_PREV_KEY,
  SHORTCUT_STORAGE_KEY,
} from './constants'
import type { SearchEngine } from './types'
import { normalizeUrl } from './url'
import { createLocalId } from '@/lib/id'

const MAX_STORED_SHORTCUTS = 100
const MAX_SHORTCUT_URL_LENGTH = 2048
const MAX_SHORTCUT_ICON_LENGTH = 2048

/** 旧版快捷键存储键，迁移后全部清除 */
const LEGACY_SHORTCUT_STORAGE_KEYS = [
  SHORTCUT_STORAGE_KEY,
  SHORTCUTS_STORAGE_BACKUP_KEY,
  SHORTCUTS_STORAGE_RECOVERY_KEY,
  SHORTCUTS_STORAGE_RECOVERY_PREV_KEY,
]

interface LegacyShortcut {
  id: string
  title: string
  url: string
  icon: string
}

/* ---------- localStorage 安全封装 ---------- */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object')

const trimToLength = (value: string, limit: number) => value.slice(0, limit)

const safeLocalStorageGet = (key: string): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch (error) {
    console.error(`Failed to read localStorage key: ${key}`, error)
    return null
  }
}

const safeLocalStorageSet = (key: string, value: string): boolean => {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch (error) {
    console.error(`Failed to write localStorage key: ${key}`, error)
    return false
  }
}

const safeLocalStorageRemove = (key: string) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch (error) {
    console.error(`Failed to remove localStorage key: ${key}`, error)
  }
}

/* ---------- 旧数据解析 ---------- */

const normalizeLegacyShortcut = (
  value: unknown,
  seenIds: Set<string>,
): LegacyShortcut | null => {
  if (!isRecord(value)) {
    return null
  }

  const title = typeof value.title === 'string'
    ? trimToLength(value.title.trim(), MAX_SHORTCUT_TITLE_LENGTH)
    : ''
  const rawUrl = typeof value.url === 'string'
    ? trimToLength(value.url.trim(), MAX_SHORTCUT_URL_LENGTH)
    : ''

  if (!title) {
    return null
  }

  const normalizedUrl = normalizeUrl(rawUrl)
  if (!normalizedUrl) {
    return null
  }

  const rawIcon = typeof value.icon === 'string'
    ? trimToLength(value.icon.trim(), MAX_SHORTCUT_ICON_LENGTH)
    : ''
  const normalizedIcon = rawIcon ? normalizeUrl(rawIcon) ?? '' : ''

  const candidateId = typeof value.id === 'string' ? value.id.trim() : ''
  let id = candidateId || createLocalId()
  while (seenIds.has(id)) {
    id = createLocalId()
  }
  seenIds.add(id)

  return { id, title, url: normalizedUrl, icon: normalizedIcon }
}

/** 兼容两种历史格式：裸数组，以及 { version, items } 信封 */
const parseLegacyShortcutItems = (raw: string): LegacyShortcut[] | null => {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  const rawItems = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.items)
      ? parsed.items
      : null

  if (!rawItems) {
    return null
  }

  const items: LegacyShortcut[] = []
  const seenIds = new Set<string>()

  for (let index = 0; index < rawItems.length; index += 1) {
    if (items.length >= MAX_STORED_SHORTCUTS) {
      break
    }
    const item = normalizeLegacyShortcut(rawItems[index], seenIds)
    if (item) {
      items.push(item)
    }
  }

  return items
}

/**
 * 一次性迁移旧版快捷键存储。
 *
 * 旧实现把同一个 key 兼作「游客数据 / 登录用户缓存 / 迁移源」三种语义，
 * 并用 primary + recovery + recovery-prev + backup 四键互相回退 —— 后者正是
 * "已删除数据静默复活"的根源。这里只读一次主键，然后无条件清除全部旧键。
 *
 * 注意只迁移到 guest scope：登录用户的本地数据由 store 在拿到账号后以
 * merge（逐条 create，客户端 UUID 幂等）方式并入，绝不使用全量替换。
 */
export function migrateLegacyShortcutStorage(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const guestKey = `${SHORTCUTS_DATA_KEY_PREFIX}${GUEST_SCOPE}`
    const alreadyMigrated = window.localStorage.getItem(guestKey) !== null

    if (!alreadyMigrated) {
      const legacyRaw = safeLocalStorageGet(SHORTCUT_STORAGE_KEY)
      const legacyItems = legacyRaw ? parseLegacyShortcutItems(legacyRaw) : null

      if (legacyItems && legacyItems.length > 0) {
        const now = new Date().toISOString()
        const items: ShortcutItem[] = legacyItems.map((item, index) => ({
          id: item.id,
          title: item.title,
          url: item.url,
          icon: item.icon,
          sortOrder: index,
          createdAt: now,
          updatedAt: now,
        }))
        window.localStorage.setItem(guestKey, JSON.stringify(items))
      }
    }
  } catch (error) {
    console.error('Failed to migrate legacy shortcut storage', error)
  }

  LEGACY_SHORTCUT_STORAGE_KEYS.forEach(safeLocalStorageRemove)
  safeLocalStorageRemove(SHORTCUTS_MIGRATION_FLAG_KEY)
}

/* ---------- 搜索引擎 ---------- */

export const loadStoredEngine = (): SearchEngine => {
  if (typeof window === 'undefined') {
    return engines[0]
  }

  const engineId = safeLocalStorageGet(ENGINE_STORAGE_KEY)
  if (!engineId) {
    return engines[0]
  }

  return engines.find((item) => item.id === engineId) ?? engines[0]
}

export const saveStoredEngine = (engineId: string) => {
  if (typeof window === 'undefined') {
    return
  }

  safeLocalStorageSet(ENGINE_STORAGE_KEY, engineId)
}

/* ---------- 搜索历史 ---------- */

export const loadSearchHistory = (): string[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = safeLocalStorageGet(SEARCH_HISTORY_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_SEARCH_HISTORY)
    }
  } catch (error) {
    console.error('Failed to parse search history', error)
  }

  return []
}

export const saveSearchHistory = (history: string[]) => {
  if (typeof window === 'undefined') {
    return
  }

  safeLocalStorageSet(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(history))
}
