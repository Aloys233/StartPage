import type { UpdateSettingsRequest, UserSettings } from '@/features/home/types'
import { request } from './client'

export const getMySettings = () =>
  request<UserSettings>('/api/me/settings', {
    method: 'GET',
    auth: true,
  })

export const updateMySettings = (payload: UpdateSettingsRequest) =>
  request<UserSettings>('/api/me/settings', {
    method: 'PUT',
    auth: true,
    body: payload,
  })
