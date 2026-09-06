import type {
  ReorderShortcutsRequest,
  ReplaceShortcutItem,
  ShortcutDraft,
  ShortcutItem,
  ShortcutListResponse,
} from '@/features/home/types'
import { request } from './client'

export type Shortcut = ShortcutItem

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

export const getDefaultShortcuts = async (): Promise<ShortcutItem[]> => defaultShortcuts

export const getMyShortcuts = async () => {
  const response = await request<ShortcutListResponse>('/api/me/shortcuts', {
    method: 'GET',
    auth: true,
  })
  return response.items
}

export const createMyShortcut = (payload: ShortcutDraft) =>
  request<ShortcutItem>('/api/me/shortcuts', {
    method: 'POST',
    auth: true,
    body: payload,
  })

export const updateMyShortcut = (id: string, payload: ShortcutDraft) =>
  request<ShortcutItem>(`/api/me/shortcuts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    auth: true,
    body: payload,
  })

export const deleteMyShortcut = (id: string) =>
  request<void>(`/api/me/shortcuts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    auth: true,
  })

export const reorderMyShortcuts = (payload: ReorderShortcutsRequest) =>
  request<ShortcutListResponse>('/api/me/shortcuts/reorder', {
    method: 'PATCH',
    auth: true,
    body: payload,
  })

export const replaceMyShortcuts = (items: ReplaceShortcutItem[]) =>
  request<ShortcutListResponse>('/api/me/shortcuts', {
    method: 'PUT',
    auth: true,
    body: { items },
  })
