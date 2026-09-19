'use client'

import { LogtoProvider, useLogto } from '@logto/react'
import type React from 'react'
import { useEffect } from 'react'
import { clearSession, request, setAccessToken, setSessionUser } from '@/api/client'
import type { UserProfile } from '@/features/home/types'
import { LOGTO_APP_ID, LOGTO_ENDPOINT, LOGTO_RESOURCE } from '@/lib/env'

const config = {
  endpoint: LOGTO_ENDPOINT,
  appId: LOGTO_APP_ID,
  resources: [LOGTO_RESOURCE],
  scopes: ['email', 'profile', 'offline_access'],
}

/**
 * 全站唯一的 Logto Provider 挂载点（见 app/layout.tsx）。
 * 每个 LogtoProvider 都会独立初始化一个 Logto client 并拉取一次用户信息，
 * 因此绝不可在多个组件中重复包裹。
 */
function TokenSync({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, getAccessToken } = useLogto()

  useEffect(() => {
    let cancelled = false

    const sync = async () => {
      if (!isAuthenticated) {
        clearSession()
        return
      }

      try {
        const token = await getAccessToken(LOGTO_RESOURCE)
        if (cancelled) {
          return
        }

        if (!token) {
          console.warn('No access token for resource', LOGTO_RESOURCE)
          return
        }
        setAccessToken(token)

        const profile = await request<UserProfile>('/api/me', { auth: true })
        if (cancelled) {
          return
        }
        setSessionUser(profile)
      } catch (error) {
        console.error('Failed to sync Logto token', error)
      }
    }

    void sync()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, getAccessToken])

  return <>{children}</>
}

export function LogtoAuth({ children }: { children: React.ReactNode }) {
  return (
    <LogtoProvider config={config}>
      <TokenSync>{children}</TokenSync>
    </LogtoProvider>
  )
}
