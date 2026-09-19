import type { UpdateSettingsRequest, UserSettings } from '@/features/home/types'
import { request } from './client'

/** 读取云端偏好；后端在没有记录时返回默认值（google / zh-CN）。 */
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
