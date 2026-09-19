'use client'

import { AlertTriangle, CloudOff } from 'lucide-react'
import {
  acknowledgeSync,
  dismissMessage,
  resolveConflict,
  useShortcutsSnapshot,
} from '@/features/home/shortcutsStore'

/**
 * 同步状态条：承载离线、冲突与一次性错误提示。
 * pending 是瞬态，不弹条以免每次增删都闪一下。
 *
 * 挂在页面顶层只渲染一次（ShortcutsSection 在首页与二级抽屉各挂载一份）。
 */
export function SyncStatusBar() {
  const { sync, message, syncAcknowledged } = useShortcutsSnapshot()

  // 冲突必须处理，不提供「知道了」；离线提示被点掉后本轮不再出现
  const isConflict = sync === 'conflict'
  const isOffline = sync === 'offline' && !syncAcknowledged
  const hasMessage = Boolean(message)

  if (!isConflict && !isOffline && !hasMessage) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="glass-modal pointer-events-auto flex w-full max-w-[640px] flex-wrap items-center gap-3 rounded-2xl border border-white/15 px-4 py-3 text-sm text-white shadow-2xl">
        {isConflict ? (
          <>
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
            <span className="min-w-[12rem] flex-1">{message ?? '快捷方式已在其它设备上被修改'}</span>
            <button
              type="button"
              className="rounded-full border border-white/25 px-3.5 py-1.5 text-xs font-medium transition hover:border-white/50 hover:bg-white/10"
              onClick={() => {
                void resolveConflict('mine')
              }}
            >
              保留我的
            </button>
            <button
              type="button"
              className="rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-xs font-medium transition hover:bg-white/25"
              onClick={() => {
                void resolveConflict('server')
              }}
            >
              以云端为准
            </button>
          </>
        ) : isOffline ? (
          <>
            <CloudOff className="h-4 w-4 shrink-0 text-white/60" />
            <span className="min-w-[12rem] flex-1">
              {message ?? '当前离线，改动已保存在本地，联网后会自动同步'}
            </span>
            <button
              type="button"
              className="rounded-full border border-white/25 px-3.5 py-1.5 text-xs font-medium transition hover:bg-white/10"
              onClick={acknowledgeSync}
            >
              知道了
            </button>
          </>
        ) : (
          <>
            <span className="min-w-[12rem] flex-1">{message}</span>
            <button
              type="button"
              className="rounded-full border border-white/25 px-3.5 py-1.5 text-xs font-medium transition hover:bg-white/10"
              onClick={dismissMessage}
            >
              知道了
            </button>
          </>
        )}
      </div>
    </div>
  )
}
