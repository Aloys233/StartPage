"use client"

import { useLogto } from '@logto/react'
import { useEffect, useRef, useState } from 'react'
import { getSessionSnapshot, subscribeSession } from '@/api/client'
import { Button } from '@/components/ui/button'
import type { UserProfile } from '@/features/home/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User } from 'lucide-react'

const ACCOUNT_CENTER_URL = 'https://accounts.aloys233.top'
// 触发区与面板之间有 2px 间隙，直接 onMouseLeave 关闭会抖动，统一加一个短延迟再关
const CLOSE_DELAY_MS = 140

export function AuthMenu() {
  const { signIn, signOut, isAuthenticated, isLoading } = useLogto()
  const [user, setUser] = useState<UserProfile | null>(() => getSessionSnapshot().user)
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeSession((snapshot) => {
      setUser(snapshot.user)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const cancelClose = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const scheduleClose = () => {
    cancelClose()
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      setOpen(false)
    }, CLOSE_DELAY_MS)
  }

  if (isLoading) {
    return <div className="h-10 w-20 animate-pulse rounded-full bg-white/10" />
  }

  return (
    <div className="flex justify-end">
      {isAuthenticated && user ? (
        <DropdownMenu open={open} onOpenChange={(next) => {
          cancelClose()
          setOpen(next)
        }}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="cards flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/20 shadow-lg transition-all [--card-hover-scale:1.06] hover:border-white/40 outline-none"
              onMouseEnter={() => {
                cancelClose()
                setOpen(true)
              }}
              onMouseLeave={scheduleClose}
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.email} className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-white/70" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={2}
            className="w-56 border-white/15 text-white/90 glass-modal rounded-2xl p-2 shadow-2xl"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {(user.name || user.username) && (
                  <p className="text-sm font-medium leading-none truncate">{user.name || user.username}</p>
                )}
                <p className="text-xs leading-none text-white/60 truncate">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg"
              onClick={() => {
                window.open(ACCOUNT_CENTER_URL, '_blank', 'noopener,noreferrer')
              }}
            >
              <User className="mr-2 h-4 w-4" />
              <span>用户管理</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg text-red-400 focus:text-red-400"
              onClick={() => signOut(window.location.origin)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          type="button"
          className="cards h-10 rounded-full border border-white/20 px-6 text-xs font-bold tracking-widest uppercase text-white shadow-lg [--card-hover-scale:1.05] hover:border-white/35"
          onClick={() => signIn(`${window.location.origin}/callback`)}
        >
          Login
        </Button>
      )}
    </div>
  )
}
