import type { UserProfile } from '@/features/home/types'
import { request, setSessionUser } from './client'

export const getMe = async () => {
  const user = await request<UserProfile>('/api/me', {
    method: 'GET',
    auth: true,
  })
  setSessionUser(user)
  return user
}
