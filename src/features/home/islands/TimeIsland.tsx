"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { TimeHeader } from '@/features/home/components/TimeHeader'

const emptySubscribe = () => () => {}

export function TimeIsland() {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const [time, setTime] = useState<Date>(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000)
    return () => {
      window.clearInterval(timer)
    }
  }, [])

  const timeStr = useMemo(() => {
    if (!isMounted) return '--:--'
    return time.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [isMounted, time])

  const dateStr = useMemo(() => {
    if (!isMounted) return '加载中...'
    return time.toLocaleDateString('zh-CN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }, [isMounted, time])

  return (
    <div suppressHydrationWarning className="flex flex-col items-center">
      <TimeHeader timeStr={timeStr} dateStr={dateStr} />
    </div>
  )
}
