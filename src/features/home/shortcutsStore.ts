'use client'

import { useSyncExternalStore } from 'react'
import { ApiError, getSessionSnapshot, subscribeSession } from '@/api/client'
import {
  createMyShortcut,
  deleteMyShortcut,
  getDefaultShortcuts,
  getMyShortcuts,
  reorderMyShortcuts,
  updateMyShortcut,
  type ShortcutPayload,
} from '@/api/shortcuts'
import {
  GUEST_SCOPE,
  SHORTCUTS_DATA_KEY_PREFIX,
  SHORTCUTS_SYNC_KEY_PREFIX,
} from '@/features/home/constants'
import type { ShortcutItem, ShortcutListResponse, ShortcutQueueOp, ShortcutSyncDoc } from '@/features/home/types'
import { migrateLegacyShortcutStorage } from '@/features/home/storage'
import { createLocalId } from '@/lib/id'

/**
 * 快捷方式的唯一数据源。
 *
 * 设计要点（换掉旧实现的原因见交接说明）：
 * - 组件在首页与二级抽屉各挂载一次，状态必须共享，不能各自 useState
 * - 缓存按账号隔离（guest / userId），登出只切 key，绝不把登录态数据写进 guest
 * - 写操作先乐观更新 + 入队，再串行重放；网络失败退避重试，409 走对账而非覆盖
 * - 用 navigator.locks 保证跨标签页只有一个 flusher
 *   （storage 事件异步且不回发给写入方，光靠共享 localStorage 队列会重复发送）
 */

export type ShortcutSyncState = 'synced' | 'pending' | 'offline' | 'conflict'
export type ShortcutStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface ShortcutsSnapshot {
  status: ShortcutStatus
  sync: ShortcutSyncState
  items: ShortcutItem[]
  revision: number
  message: string | null
  /** 本轮离线提示是否已被用户点掉（进入新的离线阶段时自动重置） */
  syncAcknowledged: boolean
}

const MAX_REBASE_ATTEMPTS = 3
const INITIAL_RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 30_000

const EMPTY_SERVER_SNAPSHOT: ShortcutsSnapshot = {
  status: 'idle',
  sync: 'synced',
  items: [],
  revision: 0,
  message: null,
  syncAcknowledged: false,
}

/* ---------- 模块状态 ---------- */

let scope: string = GUEST_SCOPE
let status: ShortcutStatus = 'idle'
let sync: ShortcutSyncState = 'synced'
let items: ShortcutItem[] = []
let revision = 0
let pendingOps: ShortcutQueueOp[] = []
let message: string | null = null
let syncAcknowledged = false

let initialized = false
let flushing = false
let hasStoredData = false
let rebaseAttempts = 0
let retryTimer: ReturnType<typeof setTimeout> | null = null
let retryDelay = INITIAL_RETRY_DELAY_MS

/**
 * 账号世代号。每次 setScope 切换账号都会自增。
 *
 * 所有跨 await 的异步流程（flush / 拉取 / 冲突解决）都必须先记住进入时的世代，
 * 在 await 之后比对：世代变了说明已经切号，必须整体丢弃结果，
 * 否则会把上一个账号的服务端状态写进新账号的缓存里。
 */
let scopeEpoch = 0

const listeners = new Set<() => void>()
let snapshot: ShortcutsSnapshot = EMPTY_SERVER_SNAPSHOT

const buildSnapshot = (): ShortcutsSnapshot => ({
  status,
  sync,
  items,
  revision,
  message,
  syncAcknowledged,
})

const notify = () => {
  snapshot = buildSnapshot()
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => snapshot
const getServerSnapshot = () => EMPTY_SERVER_SNAPSHOT

export function useShortcutsSnapshot(): ShortcutsSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/* ---------- 持久化 ---------- */

const dataKey = (targetScope: string) => `${SHORTCUTS_DATA_KEY_PREFIX}${targetScope}`
const syncKey = (targetScope: string) => `${SHORTCUTS_SYNC_KEY_PREFIX}${targetScope}`

const readJson = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

const writeJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Safari 隐私模式等场景会抛异常，忽略即可，内存态仍然可用
  }
}

const persistData = () => {
  writeJson(dataKey(scope), items)
}

const persistSync = () => {
  if (scope === GUEST_SCOPE) {
    return
  }
  const doc: ShortcutSyncDoc = { revision, pendingOps }
  writeJson(syncKey(scope), doc)
}

const persistAll = () => {
  persistData()
  persistSync()
}

/** 从存储载入当前 scope 的 items / revision / 队列 */
const loadFromStorage = () => {
  const storedItems = readJson<ShortcutItem[]>(dataKey(scope))
  // 必须区分「没有存过」和「存的是一个空数组」：
  // 否则游客删光所有快捷方式后，下次载入会把默认值又塞回来
  hasStoredData = Array.isArray(storedItems)
  items = hasStoredData ? (storedItems as ShortcutItem[]) : []

  if (scope === GUEST_SCOPE) {
    revision = 0
    pendingOps = []
    return
  }

  const doc = readJson<ShortcutSyncDoc>(syncKey(scope))
  revision = typeof doc?.revision === 'number' ? doc.revision : 0
  pendingOps = Array.isArray(doc?.pendingOps) ? doc.pendingOps : []
}

/* ---------- 操作叠加（纯函数，乐观视图与 rebase 共用） ---------- */

const materializeCreate = (op: Extract<ShortcutQueueOp, { type: 'create' }>, sortOrder: number): ShortcutItem => {
  const now = new Date().toISOString()
  return {
    id: op.id,
    title: op.title,
    url: op.url,
    icon: op.icon,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  }
}

const applyOp = (list: ShortcutItem[], op: ShortcutQueueOp): ShortcutItem[] => {
  switch (op.type) {
    case 'create':
      return [...list, materializeCreate(op, list.length)]
    case 'delete':
      return list.filter((item) => item.id !== op.id)
    case 'update':
      return list.map((item) =>
        item.id === op.id ? { ...item, title: op.title, url: op.url, icon: op.icon } : item,
      )
    case 'reorder': {
      const byId = new Map(list.map((item) => [item.id, item]))
      const ordered = op.ids.map((id) => byId.get(id)).filter((item): item is ShortcutItem => Boolean(item))
      const rest = list.filter((item) => !op.ids.includes(item.id))
      return [...ordered, ...rest]
    }
    default:
      return list
  }
}

const applyOps = (list: ShortcutItem[], ops: ShortcutQueueOp[]): ShortcutItem[] =>
  ops.reduce(applyOp, list)

/**
 * 判断某条待发送操作的目标状态是否已在服务端达成。
 * 用于 409 对账：请求可能已经提交成功、只是响应在网络上丢了。
 */
const isOpSatisfied = (serverItems: ShortcutItem[], op: ShortcutQueueOp): boolean => {
  switch (op.type) {
    case 'create':
      return serverItems.some((item) => item.id === op.id)
    case 'delete':
      return !serverItems.some((item) => item.id === op.id)
    case 'update': {
      const found = serverItems.find((item) => item.id === op.id)
      // 目标已被删除时，这条更新永远不可能成功，视为已了结
      return !found || (found.title === op.title && found.url === op.url && found.icon === op.icon)
    }
    case 'reorder': {
      const ids = serverItems.map((item) => item.id)
      return ids.join(',') === op.ids.join(',')
    }
    default:
      return true
  }
}

const referencesDeletedId = (op: ShortcutQueueOp, deleted: Set<string>): boolean => {
  switch (op.type) {
    case 'create':
      return false
    case 'update':
    case 'delete':
      return deleted.has(op.id)
    case 'reorder':
      op.ids = op.ids.filter((id) => !deleted.has(id))
      return false
    default:
      return false
  }
}

/* ---------- 状态迁移 ---------- */

const setSync = (next: ShortcutSyncState) => {
  // 进入新的离线阶段时重置「已读」标记，使状态条能再次出现；
  // 同一轮离线内重复设置 offline 不会重置，用户点掉的提示不会自己冒回来。
  if (next === 'offline' && sync !== 'offline') {
    syncAcknowledged = false
  }
  sync = next
}

const setMessage = (next: string | null) => {
  message = next
}

const clearRetry = () => {
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
}

const scheduleRetry = () => {
  if (retryTimer) {
    return
  }
  retryTimer = setTimeout(() => {
    retryTimer = null
    retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS)
    void flush()
  }, retryDelay)
}

const resetRetry = () => {
  clearRetry()
  retryDelay = INITIAL_RETRY_DELAY_MS
}

/* ---------- 跨标签页互斥 ---------- */

interface LockLike {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>
}

const withFlushLock = async <T,>(targetScope: string, task: () => Promise<T>): Promise<T> => {
  const locks =
    typeof navigator !== 'undefined'
      ? (navigator as unknown as { locks?: LockLike }).locks
      : undefined

  if (!locks) {
    // 不支持 Web Locks 的浏览器退化为「服务端幂等兜底」：
    // create 用客户端 UUID + upsert，重复发送不会产生重复数据
    return task()
  }

  return locks.request(`startpage-shortcuts-flush:${targetScope}`, task)
}

/* ---------- 队列重放 ---------- */

const sendOp = (op: ShortcutQueueOp): Promise<ShortcutListResponse> => {
  switch (op.type) {
    case 'create':
      return createMyShortcut({ id: op.id, title: op.title, url: op.url, icon: op.icon }, revision)
    case 'update':
      return updateMyShortcut(op.id, { title: op.title, url: op.url, icon: op.icon }, revision)
    case 'delete':
      return deleteMyShortcut(op.id, revision)
    case 'reorder':
      return reorderMyShortcuts({ ids: op.ids }, revision)
    default:
      return Promise.reject(new Error(`Unsupported op: ${JSON.stringify(op)}`))
  }
}

/** 采用服务端权威状态，并把尚未发送的本地改动重新叠加回去，避免 UI 回跳 */
const adoptServerState = (response: ShortcutListResponse, remainingOps: ShortcutQueueOp[]) => {
  revision = response.revision
  items = applyOps(response.items, remainingOps)
  persistAll()
  notify()
}

const shiftOp = () => {
  pendingOps = pendingOps.slice(1)
  persistSync()
}

/**
 * @param isStale 判断当前流程是否已因切号而失效
 * @returns true 表示可以继续消费队列，false 表示需要停止（冲突、离线或已切号）
 */
const handleOpFailure = async (
  error: unknown,
  op: ShortcutQueueOp,
  isStale: () => boolean,
): Promise<boolean> => {
  if (error instanceof ApiError && error.status === 409) {
    const server = await getMyShortcuts()
    if (isStale()) {
      return false
    }
    if (isOpSatisfied(server.items, op)) {
      // 目标状态已达成：上次提交其实成功了，只是响应丢了
      revision = server.revision
      shiftOp()
      items = applyOps(server.items, pendingOps)
      persistAll()
      resetRetry()
      setSync(pendingOps.length > 0 ? 'pending' : 'synced')
      notify()
      return true
    }

    // 真的冲突：停下等用户决定，绝不继续消费后续 op（它们会带着错误的 revision）
    setSync('conflict')
    setMessage('快捷方式已在其它设备上被修改')
    notify()
    return false
  }

  if (error instanceof ApiError && error.status === 0) {
    setSync('offline')
    notify()
    scheduleRetry()
    return false
  }

  // 其它 4xx 是永久性错误（例如更新一个已被删除的条目），丢弃该 op 以免阻塞队列，
  // 但必须重新拉取服务端状态，否则本地会停留在错误的心智模型上
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    setMessage(error.message)
    const server = await getMyShortcuts()
    if (isStale()) {
      return false
    }
    revision = server.revision
    shiftOp()
    items = applyOps(server.items, pendingOps)
    persistAll()
    setSync(pendingOps.length > 0 ? 'pending' : 'synced')
    notify()
    return true
  }

  // 5xx 等临时故障
  setSync('offline')
  notify()
  scheduleRetry()
  return false
}

export async function flush(): Promise<void> {
  if (scope === GUEST_SCOPE || flushing || sync === 'conflict' || pendingOps.length === 0) {
    return
  }

  const epoch = scopeEpoch
  const isStale = () => scopeEpoch !== epoch
  // 锁名用进入时的账号，避免等待锁期间切号导致锁错账号
  const targetScope = scope

  flushing = true
  try {
    await withFlushLock(targetScope, async () => {
      if (isStale()) {
        return
      }

      // 拿到锁后重新读一次：可能另一个标签页已经把这批 op 处理完了
      loadFromStorage()

      while (pendingOps.length > 0 && sync !== 'conflict' && !isStale()) {
        const op = pendingOps[0]
        try {
          const response = await sendOp(op)
          if (isStale()) {
            return
          }
          shiftOp()
          adoptServerState(response, pendingOps)
          resetRetry()
          setSync(pendingOps.length > 0 ? 'pending' : 'synced')
          notify()
        } catch (error) {
          if (isStale()) {
            return
          }
          const shouldContinue = await handleOpFailure(error, op, isStale)
          if (isStale() || !shouldContinue) {
            return
          }
        }
      }

      if (isStale()) {
        return
      }
      setSync(pendingOps.length > 0 ? 'pending' : 'synced')
      notify()
    })
  } finally {
    flushing = false
    // 期间切过账号：新账号可能还压着待发送的 op，补触发一次
    if (isStale()) {
      void flush()
    }
  }
}

/* ---------- 变更入口 ---------- */

const enqueue = (op: ShortcutQueueOp) => {
  items = applyOp(items, op)
  persistData()

  if (scope === GUEST_SCOPE) {
    notify()
    return
  }

  pendingOps = [...pendingOps, op]
  persistSync()
  setSync('pending')
  notify()
  void flush()
}

export const addShortcut = (payload: ShortcutPayload) =>
  enqueue({ type: 'create', id: createLocalId(), title: payload.title, url: payload.url, icon: payload.icon })

export const editShortcut = (id: string, payload: ShortcutPayload) =>
  enqueue({ type: 'update', id, title: payload.title, url: payload.url, icon: payload.icon })

export const removeShortcut = (id: string) => enqueue({ type: 'delete', id })

export const reorderShortcuts = (nextItems: ShortcutItem[]) =>
  enqueue({ type: 'reorder', ids: nextItems.map((item) => item.id) })

export const dismissMessage = () => {
  setMessage(null)
  notify()
}

/**
 * 关闭本轮离线提示。改用户可见状态需要走 store 而不是组件内部 state，
 * 这样「进入新的离线阶段就重置」的规则可以集中在一个地方表达。
 */
export const acknowledgeSync = () => {
  syncAcknowledged = true
  setMessage(null)
  notify()
}

/* ---------- 冲突解决 ---------- */

export async function resolveConflict(choice: 'server' | 'mine'): Promise<void> {
  if (scope === GUEST_SCOPE) {
    return
  }

  const epoch = scopeEpoch
  const isStale = () => scopeEpoch !== epoch

  if (choice === 'mine' && rebaseAttempts < MAX_REBASE_ATTEMPTS) {
    rebaseAttempts += 1
    const server = await getMyShortcuts()
    if (isStale()) {
      return
    }
    revision = server.revision
    // 只重放尚未达成的操作，而不是无脑重发（否则对方持续写入时会无限 409）
    pendingOps = pendingOps.filter((op) => !isOpSatisfied(server.items, op))
    items = applyOps(server.items, pendingOps)
    persistAll()
    setMessage(null)
    setSync(pendingOps.length > 0 ? 'pending' : 'synced')
    notify()
    if (pendingOps.length > 0) {
      void flush()
    }
    return
  }

  if (choice === 'mine') {
    setMessage('多次重试仍然冲突，已改为采用云端版本')
  }

  const server = await getMyShortcuts()
  if (isStale()) {
    return
  }
  pendingOps = []
  revision = server.revision
  items = server.items
  rebaseAttempts = 0
  resetRetry()
  persistAll()
  setSync('synced')
  notify()
}

/* ---------- 作用域切换 ---------- */

const syncFromServer = async () => {
  if (scope === GUEST_SCOPE) {
    return
  }

  const epoch = scopeEpoch
  const isStale = () => scopeEpoch !== epoch

  status = 'loading'
  notify()

  try {
    const server = await getMyShortcuts(revision)
    if (isStale()) {
      return
    }
    const deleted = new Set(server.deletedIds)
    if (deleted.size > 0) {
      // 服务端已删除的条目：丢弃引用它们的待发送操作，避免无意义的 404 与冲突
      pendingOps = pendingOps.filter((op) => !referencesDeletedId(op, deleted))
    }
    adoptServerState(server, pendingOps)
    status = 'ready'
    setSync(pendingOps.length > 0 ? 'pending' : 'synced')
    notify()
    if (pendingOps.length > 0) {
      void flush()
    }
  } catch (error) {
    if (isStale()) {
      return
    }
    // 拉取失败时保留本地缓存继续可用，标记为离线
    status = 'ready'
    setSync('offline')
    notify()
    console.warn('拉取云端快捷方式失败，继续使用本地缓存', error)
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isUuid = (value: string) => UUID_REGEX.test(value)

/**
 * 游客 → 首次登录：把设备上的匿名快捷方式并入账号。
 *
 * 逐条 create（客户端 UUID + 后端 upsert 保证幂等），而不是全量替换 ——
 * 旧实现用 replaceMyShortcuts（DELETE ALL + 重建），会把账号里已有的数据整片抹掉。
 */
async function mergeGuestShortcutsIntoAccount(): Promise<void> {
  if (scope === GUEST_SCOPE) {
    return
  }

  const guestItems = readJson<ShortcutItem[]>(dataKey(GUEST_SCOPE))
  if (!Array.isArray(guestItems) || guestItems.length === 0) {
    return
  }

  const knownIds = new Set(items.map((item) => item.id))
  const ops: ShortcutQueueOp[] = guestItems
    .filter((item) => !knownIds.has(item.id))
    .map((item) => ({
      type: 'create' as const,
      // 内置默认项的 id 形如 default-1，不是合法 UUID，必须重新生成
      id: isUuid(item.id) ? item.id : createLocalId(),
      title: item.title,
      url: item.url,
      icon: item.icon,
    }))

  if (ops.length === 0) {
    return
  }

  pendingOps = [...pendingOps, ...ops]
  items = applyOps(items, ops)
  persistAll()
  setSync('pending')
  notify()
  await flush()
}

export async function setScope(nextScope: string): Promise<void> {
  if (nextScope === scope && initialized) {
    return
  }

  // 先把旧 scope 落盘，再切换，避免跨账号串档
  if (initialized) {
    persistAll()
  }

  scope = nextScope
  // 递增世代号：任何在途的异步流程（可能还带着上一个账号的 revision 与服务端响应）
  // 都会在下一个检查点自行放弃，不会污染新账号的缓存
  scopeEpoch += 1
  initialized = true
  rebaseAttempts = 0
  resetRetry()
  loadFromStorage()
  status = 'ready'
  setSync(pendingOps.length > 0 ? 'pending' : 'synced')
  setMessage(null)
  syncAcknowledged = false
  notify()

  if (scope === GUEST_SCOPE) {
    if (!hasStoredData) {
      items = await getDefaultShortcuts()
      persistData()
      notify()
    }
    return
  }

  await syncFromServer()
  await mergeGuestShortcutsIntoAccount()
}

/* ---------- 初始化 ---------- */

export function initShortcutsStore(): void {
  if (typeof window === 'undefined' || initialized) {
    return
  }

  const applySession = (user: { id: string } | null) => {
    void setScope(user?.id ?? GUEST_SCOPE)
  }

  // 旧版四键存储先做一次性迁移，再进入新流程
  migrateLegacyShortcutStorage()

  applySession(getSessionSnapshot().user)
  subscribeSession((session) => applySession(session.user))

  // 跨标签页：另一标签页改了缓存 / 队列时重新载入
  window.addEventListener('storage', (event) => {
    if (!event.key) {
      return
    }
    if (!event.key.startsWith(SHORTCUTS_DATA_KEY_PREFIX) && !event.key.startsWith(SHORTCUTS_SYNC_KEY_PREFIX)) {
      return
    }
    loadFromStorage()
    notify()
    void flush()
  })

  // 重新联网时立刻重试一次
  window.addEventListener('online', () => {
    if (sync === 'offline') {
      resetRetry()
      void flush()
    }
  })
}
