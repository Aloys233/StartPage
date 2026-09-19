'use client'

import { useEffect, useState } from 'react'
import { ShortcutDialog } from '@/features/home/components/ShortcutDialog'
import { ShortcutsGrid } from '@/features/home/components/ShortcutsGrid'
import { MAX_SHORTCUT_TITLE_LENGTH } from '@/features/home/constants'
import { getSearchUiState, subscribeSearchUiState } from '@/features/home/searchUiState'
import {
  addShortcut,
  editShortcut,
  initShortcutsStore,
  removeShortcut,
  reorderShortcuts,
  useShortcutsSnapshot,
} from '@/features/home/shortcutsStore'
import { buildFaviconUrl, getHostname, normalizeUrl, openExternalLink } from '@/features/home/url'
import { useIsMounted } from '@/lib/useIsMounted'

interface ShortcutsSectionProps {
  staticView?: boolean
}

export function ShortcutsSection({ staticView = false }: ShortcutsSectionProps) {
  const isMounted = useIsMounted()
  const { items: shortcuts } = useShortcutsSnapshot()
  const [showDialog, setShowDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [dialogForm, setDialogForm] = useState({ title: '', url: '' })
  const [dialogError, setDialogError] = useState('')
  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null)
  const [searchUiState, setLocalSearchUiState] = useState(getSearchUiState())

  useEffect(() => subscribeSearchUiState(setLocalSearchUiState), [])

  // 数据源、持久化与云端同步全部由 store 负责，这里只做初始化
  useEffect(() => {
    initShortcutsStore()
  }, [])

  useEffect(() => {
    if (!showDialog) {
      return
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDialog(false)
      }
    }

    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('keydown', onEscape)
    }
  }, [showDialog])

  const openAddDialog = () => {
    setDialogMode('add')
    setEditingShortcutId(null)
    setDialogForm({ title: '', url: '' })
    setDialogError('')
    setShowDialog(true)
  }

  const editShortcutItem = (shortcut: { id: string; title: string; url: string }) => {
    setDialogMode('edit')
    setEditingShortcutId(shortcut.id)
    setDialogForm({ title: shortcut.title, url: shortcut.url })
    setDialogError('')
    setShowDialog(true)
  }

  const deleteShortcut = (id: string, title: string) => {
    if (!window.confirm(`确定要移除快捷方式 "${title}" 吗喵？`)) {
      return
    }
    // 乐观更新：立即从列表移除，失败由同步状态条兜底，不再把错误塞进不可见的对话框状态
    removeShortcut(id)
  }

  const moveShortcut = (id: string, direction: -1 | 1) => {
    const currentIndex = shortcuts.findIndex((item) => item.id === id)
    if (currentIndex < 0) {
      return
    }

    const nextIndex = currentIndex + direction
    if (nextIndex < 0 || nextIndex >= shortcuts.length) {
      return
    }

    const reordered = [...shortcuts]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(nextIndex, 0, moved)
    reorderShortcuts(reordered)
  }

  const saveShortcut = () => {
    const title = dialogForm.title.trim()
    const normalizedUrl = normalizeUrl(dialogForm.url)

    if (!title) {
      setDialogError('请输入快捷方式名称喵。')
      return
    }

    // 与后端 Bean Validation 的上限保持一致，避免登录后同步被 400 拒绝
    if ([...title].length > MAX_SHORTCUT_TITLE_LENGTH) {
      setDialogError(`名称不能超过 ${MAX_SHORTCUT_TITLE_LENGTH} 个字符喵。`)
      return
    }

    if (!normalizedUrl) {
      setDialogError('请输入有效的 URL 地址喵。')
      return
    }

    const payload = { title, url: normalizedUrl, icon: buildFaviconUrl(normalizedUrl) }

    if (dialogMode === 'add') {
      addShortcut(payload)
    } else if (editingShortcutId) {
      editShortcut(editingShortcutId, payload)
    }

    setDialogError('')
    setShowDialog(false)
  }

  if (!isMounted) {
    return (
      <div className="relative z-10 grid w-full max-w-[960px] grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mx-auto flex w-20 flex-col items-center">
            <div className="cards flex h-20 w-20 items-center justify-center rounded-[26px] border border-white/10 bg-white/5 opacity-40 animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <ShortcutsGrid
        shortcuts={shortcuts}
        showSuggestions={staticView ? false : searchUiState.showSuggestions}
        query={staticView ? '' : searchUiState.query}
        onOpenShortcut={openExternalLink}
        onEditShortcut={editShortcutItem}
        onDeleteShortcut={deleteShortcut}
        onMoveShortcutUp={(id) => {
          moveShortcut(id, -1)
        }}
        onMoveShortcutDown={(id) => {
          moveShortcut(id, 1)
        }}
        onAddShortcut={openAddDialog}
        getHostname={getHostname}
      />

      <ShortcutDialog
        showDialog={showDialog}
        dialogMode={dialogMode}
        dialogForm={dialogForm}
        dialogError={dialogError}
        onClose={() => {
          setShowDialog(false)
          setDialogError('')
        }}
        onChangeTitle={(value) => {
          setDialogError('')
          setDialogForm((prev) => ({ ...prev, title: value }))
        }}
        onChangeUrl={(value) => {
          setDialogError('')
          setDialogForm((prev) => ({ ...prev, url: value }))
        }}
        onSave={saveShortcut}
      />
    </>
  )
}
