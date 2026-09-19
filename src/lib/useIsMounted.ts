'use client'

import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

/**
 * 判断组件是否已在客户端挂载。
 * 用于规避 SSR / 水合阶段访问浏览器 API 造成的 hydration mismatch。
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
}
