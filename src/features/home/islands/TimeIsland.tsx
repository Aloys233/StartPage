"use client"

import { useEffect, useState } from 'react'
import { TimeHeader } from '@/features/home/components/TimeHeader'

interface TimeIslandProps {
  initialTimestamp?: number
}

export function TimeIsland({ initialTimestamp }: TimeIslandProps) {
  const [time, setTime] = useState<Date>(() =>
    initialTimestamp ? new Date(initialTimestamp) : new Date(),
  )

  useEffect(() => {
    let timerId: number

    // 挂载后第一时间同步本地精确时间
    setTime(new Date())

    const tick = () => {
      const now = new Date()
      setTime(now)
      const delay = 1000 - now.getMilliseconds()
      timerId = window.setTimeout(tick, delay)
    }

    const now = new Date()
    const initialDelay = 1000 - now.getMilliseconds()
    timerId = window.setTimeout(tick, initialDelay)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [])

  const hour = String(time.getHours()).padStart(2, '0')
  const minute = String(time.getMinutes()).padStart(2, '0')
  const second = String(time.getSeconds()).padStart(2, '0')

  const dateStr = time.toLocaleDateString('zh-CN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div suppressHydrationWarning className="flex flex-col items-center">
      <TimeHeader hour={hour} minute={minute} second={second} dateStr={dateStr} />
    </div>
  )
}

