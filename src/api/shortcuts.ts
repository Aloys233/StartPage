import type {
  ReorderShortcutsRequest,
  ShortcutItem,
  ShortcutListResponse,
} from '@/features/home/types'
import { request } from './client'

export type Shortcut = ShortcutItem

export interface ShortcutPayload {
  title: string
  url: string
  icon: string
}

export interface CreateShortcutPayload extends ShortcutPayload {
  /** 由客户端生成，使 create 幂等：队列重放不会重复插入 */
  id: string
}

const nowIso = () => new Date().toISOString()

const buildDefaultShortcut = (index: number, data: { title: string; url: string; icon: string }): ShortcutItem => ({
  id: `default-${index + 1}`,
  title: data.title,
  url: data.url,
  icon: data.icon,
  sortOrder: index,
  createdAt: nowIso(),
  updatedAt: nowIso(),
})

export const defaultShortcuts: ShortcutItem[] = [
  {
    title: 'GitHub',
    url: 'https://github.com',
    icon: 'https://github.githubassets.com/favicons/favicon.svg',
  },
  {
    title: 'Bilibili',
    url: 'https://www.bilibili.com',
    icon: 'https://www.bilibili.com/favicon.ico',
  },
  {
    title: 'YouTube',
    url: 'https://www.youtube.com',
    icon: 'https://www.gstatic.com/youtube/img/branding/favicon/favicon_144x144.png',
  },
  {
    title: 'ChatGPT',
    url: 'https://chatgpt.com',
    icon: 'https://chatgpt.com/favicon.ico',
  },
  {
    title: 'V2EX',
    url: 'https://www.v2ex.com',
    icon: 'https://www.v2ex.com/static/favicon.ico',
  },
].map((item, index) => buildDefaultShortcut(index, item))

/** 纯本地常量，不发请求 */
export const getDefaultShortcuts = async (): Promise<ShortcutItem[]> => defaultShortcuts

/**
 * 所有端点都返回 ShortcutListResponse 信封（权威列表 + revision）。
 * 写端点必须带上调用方已知的 expectedRevision，落后时服务端返回 409。
 */
export const getMyShortcuts = (since?: number) =>
  request<ShortcutListResponse>('/api/me/shortcuts', {
    method: 'GET',
    auth: true,
    query: since === undefined ? undefined : { since },
  })

export const createMyShortcut = (payload: CreateShortcutPayload, expectedRevision: number) =>
  request<ShortcutListResponse>('/api/me/shortcuts', {
    method: 'POST',
    auth: true,
    query: { expectedRevision },
    body: payload,
  })

export const updateMyShortcut = (id: string, payload: ShortcutPayload, expectedRevision: number) =>
  request<ShortcutListResponse>(`/api/me/shortcuts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    auth: true,
    query: { expectedRevision },
    body: payload,
  })

/** 幂等：目标已不存在时服务端也返回成功 */
export const deleteMyShortcut = (id: string, expectedRevision: number) =>
  request<ShortcutListResponse>(`/api/me/shortcuts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
    query: { expectedRevision },
  })

export const reorderMyShortcuts = (payload: ReorderShortcutsRequest, expectedRevision: number) =>
  request<ShortcutListResponse>('/api/me/shortcuts/reorder', {
    method: 'PATCH',
    auth: true,
    query: { expectedRevision },
    body: payload,
  })
