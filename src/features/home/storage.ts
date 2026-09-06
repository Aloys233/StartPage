import type { ShortcutItem } from '@/features/home/types'
import {
  ENGINE_STORAGE_KEY,
  engines,
  MAX_SEARCH_HISTORY,
  SEARCH_HISTORY_STORAGE_KEY,
  SHORTCUT_STORAGE_KEY,
  SHORTCUTS_MIGRATION_FLAG_KEY,
  SHORTCUTS_STORAGE_BACKUP_KEY,
  SHORTCUTS_STORAGE_RECOVERY_KEY,
  SHORTCUTS_STORAGE_RECOVERY_PREV_KEY,
} from './constants'
import type { SearchEngine, ShortcutsBootstrap } from './types'
import { normalizeUrl } from './url'

const SHORTCUT_STORAGE_SCHEMA_VERSION = 2
const MAX_STORED_SHORTCUTS = 100
const MAX_SHORTCUT_TITLE_LENGTH = 120
const MAX_SHORTCUT_URL_LENGTH = 2048
const MAX_SHORTCUT_ICON_LENGTH = 2048

interface StoredShortcut {
  id: string
  title: string
  url: string
  icon: string
}

interface ParsedShortcutPayload {
  items: StoredShortcut[]
  rawCount: number
  needsRewrite: boolean
}

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

const createShortcutId = (seed: number): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `local-${Date.now()}-${seed}-${Math.random().toString(36).slice(2, 10)}`
}

const normalizeStoredShortcut = (
  value: unknown,
  index: number,
  seenIds: Set<string>,
): StoredShortcut | null => {
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
  let id = candidateId || createShortcutId(index)
  while (seenIds.has(id)) {
    id = createShortcutId(index + seenIds.size)
  }
  seenIds.add(id)

  return {
    id,
    title,
    url: normalizedUrl,
    icon: normalizedIcon,
  }
}

const normalizeShortcutList = (items: unknown[]): StoredShortcut[] => {
  const normalized: StoredShortcut[] = []
  const seenIds = new Set<string>()

  for (let index = 0; index < items.length; index += 1) {
    if (normalized.length >= MAX_STORED_SHORTCUTS) {
      break
    }

    const item = normalizeStoredShortcut(items[index], index, seenIds)
    if (item) {
      normalized.push(item)
    }
  }

  return normalized
}

const parseShortcutPayload = (raw: string): ParsedShortcutPayload | null => {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (Array.isArray(parsed)) {
    const items = normalizeShortcutList(parsed)
    return {
      items,
      rawCount: parsed.length,
      needsRewrite: true,
    }
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.items)) {
    return null
  }

  const rawItems = parsed.items
  const items = normalizeShortcutList(rawItems)
  const version = typeof parsed.version === 'number' ? parsed.version : 0
  const needsRewrite =
    version !== SHORTCUT_STORAGE_SCHEMA_VERSION ||
    rawItems.length !== items.length ||
    rawItems.length > MAX_STORED_SHORTCUTS

  return {
    items,
    rawCount: rawItems.length,
    needsRewrite,
  }
}

const serializeShortcutPayload = (items: StoredShortcut[]) =>
  JSON.stringify({
    version: SHORTCUT_STORAGE_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    items,
  })

const persistShortcutPayload = (items: StoredShortcut[]) => {
  const payload = serializeShortcutPayload(items)
  const previousPrimary = safeLocalStorageGet(SHORTCUT_STORAGE_KEY)
  if (previousPrimary !== null) {
    safeLocalStorageSet(SHORTCUTS_STORAGE_RECOVERY_PREV_KEY, previousPrimary)
  }

  const wrotePrimary = safeLocalStorageSet(SHORTCUT_STORAGE_KEY, payload)
  if (wrotePrimary) {
    safeLocalStorageSet(SHORTCUTS_STORAGE_RECOVERY_KEY, payload)
  }
}

const toGuestShortcuts = (items: StoredShortcut[]): ShortcutItem[] => {
  const now = new Date().toISOString()
  return items.map((item, index) => ({
    id: item.id,
    title: item.title,
    url: item.url,
    icon: item.icon,
    sortOrder: index,
    createdAt: now,
    updatedAt: now,
  }))
}

const toStoredShortcutInput = (shortcuts: ShortcutItem[]) =>
  shortcuts.map(({ id, title, url, icon }) => ({ id, title, url, icon }))

export const loadStoredShortcuts = (): ShortcutsBootstrap => {
  if (typeof window === 'undefined') {
    return { hasStoredValue: false, shortcuts: [] }
  }

  const candidatePayloads: Array<{ key: string; raw: string | null }> = [
    { key: SHORTCUT_STORAGE_KEY, raw: safeLocalStorageGet(SHORTCUT_STORAGE_KEY) },
    { key: SHORTCUTS_STORAGE_RECOVERY_KEY, raw: safeLocalStorageGet(SHORTCUTS_STORAGE_RECOVERY_KEY) },
    { key: SHORTCUTS_STORAGE_RECOVERY_PREV_KEY, raw: safeLocalStorageGet(SHORTCUTS_STORAGE_RECOVERY_PREV_KEY) },
    { key: SHORTCUTS_STORAGE_BACKUP_KEY, raw: safeLocalStorageGet(SHORTCUTS_STORAGE_BACKUP_KEY) },
  ]

  for (const payload of candidatePayloads) {
    if (payload.raw === null) {
      continue
    }

    const parsed = parseShortcutPayload(payload.raw)
    if (!parsed) {
      continue
    }

    const hasRecoverableData = parsed.rawCount === 0 || parsed.items.length > 0
    if (!hasRecoverableData) {
      continue
    }

    if (payload.key !== SHORTCUT_STORAGE_KEY || parsed.needsRewrite) {
      persistShortcutPayload(parsed.items)
    }

    return { hasStoredValue: true, shortcuts: toGuestShortcuts(parsed.items) }
  }

  return { hasStoredValue: false, shortcuts: [] }
}

export const saveStoredShortcuts = (shortcuts: ShortcutItem[]) => {
  if (typeof window === 'undefined') {
    return
  }

  const storedItems = normalizeShortcutList(toStoredShortcutInput(shortcuts))
  if (shortcuts.length > 0 && storedItems.length === 0) {
    console.error('Skip persisting shortcuts because all entries are invalid')
    return
  }

  persistShortcutPayload(storedItems)
}

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

const buildMigrationFlagKey = (userId: string) => `${SHORTCUTS_MIGRATION_FLAG_KEY}:${userId}`

export const hasMigratedShortcuts = (userId?: string): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  if (!userId) {
    return safeLocalStorageGet(SHORTCUTS_MIGRATION_FLAG_KEY) === '1'
  }

  const normalizedUserId = userId.trim()
  if (!normalizedUserId) {
    return false
  }

  const scopedKey = buildMigrationFlagKey(normalizedUserId)
  if (safeLocalStorageGet(scopedKey) === '1') {
    return true
  }

  if (safeLocalStorageGet(SHORTCUTS_MIGRATION_FLAG_KEY) === '1') {
    safeLocalStorageSet(scopedKey, '1')
    safeLocalStorageRemove(SHORTCUTS_MIGRATION_FLAG_KEY)
    return true
  }

  return false
}

export const markShortcutsMigrated = (userId?: string) => {
  if (typeof window === 'undefined') {
    return
  }

  const normalizedUserId = userId?.trim()
  if (normalizedUserId) {
    safeLocalStorageSet(buildMigrationFlagKey(normalizedUserId), '1')
    return
  }

  safeLocalStorageSet(SHORTCUTS_MIGRATION_FLAG_KEY, '1')
}

export const backupLocalShortcuts = (shortcuts: ShortcutItem[]) => {
  if (typeof window === 'undefined') {
    return
  }

  const storedItems = normalizeShortcutList(toStoredShortcutInput(shortcuts))
  if (shortcuts.length > 0 && storedItems.length === 0) {
    return
  }

  safeLocalStorageSet(SHORTCUTS_STORAGE_BACKUP_KEY, serializeShortcutPayload(storedItems))
}

export type CloudMigrationAction = 'upload-local' | 'use-cloud' | 'noop'

export const decideCloudMigrationAction = (params: {
  hasMigration: boolean
  localCount: number
  cloudCount: number
}): CloudMigrationAction => {
  const { hasMigration, localCount, cloudCount } = params

  if (cloudCount > 0) {
    return 'use-cloud'
  }

  if (!hasMigration && localCount > 0) {
    return 'upload-local'
  }

  return 'noop'
}
