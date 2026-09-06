"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  createMyShortcut,
  deleteMyShortcut,
  getDefaultShortcuts,
  getMyShortcuts,
  reorderMyShortcuts,
  replaceMyShortcuts,
  type Shortcut,
  updateMyShortcut,
} from '@/api/shortcuts'
import { ApiError, getSessionSnapshot } from '@/api/client'
import { subscribeSession } from '@/api/auth'
import { ShortcutDialog } from '@/features/home/components/ShortcutDialog'
import { ShortcutsGrid } from '@/features/home/components/ShortcutsGrid'
import { getShortcutIcon } from '@/features/home/shortcuts'
import { getSearchUiState, subscribeSearchUiState } from '@/features/home/searchUiState'
import {
  backupLocalShortcuts,
  decideCloudMigrationAction,
  hasMigratedShortcuts,
  loadStoredShortcuts,
  markShortcutsMigrated,
  saveStoredShortcuts,
} from '@/features/home/storage'
import { buildFaviconUrl, getHostname, normalizeUrl, openExternalLink } from '@/features/home/url'
import type { UserProfile } from '@/features/home/types'
import { LogtoAuth } from '@/components/LogtoAuth'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isUuid = (value: string) => UUID_REGEX.test(value)

const createLocalShortcutId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const buildErrorMessage = (error: unknown) => {
  if (!(error instanceof ApiError)) {
    return '操作失败，请重试喵。'
  }

  if (!error.details?.length) {
    return error.message
  }

  const detailText = error.details
    .map((item) => {
      if (item.field && item.reason) {
        return `${item.field}: ${item.reason}`
      }
      return item.reason ?? item.field ?? ''
    })
    .filter(Boolean)
    .join('; ')

  return detailText ? `${error.message} (${detailText})` : error.message
}

interface ShortcutsIslandProps {
  staticView?: boolean
}

export function ShortcutsIsland(props: ShortcutsIslandProps) {
  return (
    <LogtoAuth>
      <ShortcutsContent {...props} />
    </LogtoAuth>
  )
}

const emptySubscribe = () => () => {}

function ShortcutsContent({ staticView = false }: ShortcutsIslandProps) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(() => loadStoredShortcuts().shortcuts)
  const [isShortcutsReady, setIsShortcutsReady] = useState(() => loadStoredShortcuts().hasStoredValue)
  const [showDialog, setShowDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [dialogForm, setDialogForm] = useState({ title: '', url: '' })
  const [dialogError, setDialogError] = useState('')
  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null)
  const [searchUiState, setLocalSearchUiState] = useState(getSearchUiState())
  const [user, setUser] = useState<UserProfile | null>(() => getSessionSnapshot().user)

  const shortcutsRef = useRef(shortcuts)
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  const syncingCloudRef = useRef(false)
  const cloudBootstrappedUserIdRef = useRef<string | null>(null)

  useEffect(() => subscribeSearchUiState(setLocalSearchUiState), [])

  useEffect(() => {
    const unsubscribe = subscribeSession((snapshot) => {
      setUser(snapshot.user)
    })

    return unsubscribe
  }, [])

  // 客户端未预存时加载默认快捷方式
  useEffect(() => {
    if (isShortcutsReady) {
      return
    }

    let cancelled = false
    void getDefaultShortcuts()
      .then((items) => {
        if (!cancelled) {
          setShortcuts(items)
        }
      })
      .catch((error) => {
        console.error('Failed to load default shortcuts', error)
      })
      .finally(() => {
        if (!cancelled) {
          setIsShortcutsReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isShortcutsReady])

  useEffect(() => {
    if (!isShortcutsReady || user || typeof window === 'undefined') {
      return
    }

    try {
      saveStoredShortcuts(shortcuts)
    } catch (error) {
      console.error('Failed to persist shortcuts', error)
    }
  }, [isShortcutsReady, shortcuts, user])

  useEffect(() => {
    if (!isShortcutsReady || !user || syncingCloudRef.current) {
      syncingCloudRef.current = false
      return
    }

    if (cloudBootstrappedUserIdRef.current === user.id) {
      return
    }

    let cancelled = false
    const localShortcutsSnapshot = shortcutsRef.current

    const sync = async () => {
      syncingCloudRef.current = true
      try {
        const cloudShortcuts = await getMyShortcuts()
        if (cancelled) {
          return
        }

        const hasMigration = hasMigratedShortcuts(user.id)
        const migrationAction = decideCloudMigrationAction({
          hasMigration,
          localCount: localShortcutsSnapshot.length,
          cloudCount: cloudShortcuts.length,
        })

        if (migrationAction === 'upload-local') {
          const replaced = await replaceMyShortcuts(
            localShortcutsSnapshot.map((item, index) => ({
              id: isUuid(item.id) ? item.id : undefined,
              title: item.title,
              url: item.url,
              icon: item.icon,
              sortOrder: index,
            })),
          )
          if (!cancelled) {
            setShortcuts(replaced.items)
          }
          markShortcutsMigrated(user.id)
          cloudBootstrappedUserIdRef.current = user.id
          return
        }

        if (migrationAction === 'use-cloud') {
          backupLocalShortcuts(localShortcutsSnapshot)
          if (!cancelled) {
            setShortcuts(cloudShortcuts)
          }
          markShortcutsMigrated(user.id)
          cloudBootstrappedUserIdRef.current = user.id
          return
        }

        markShortcutsMigrated(user.id)
        cloudBootstrappedUserIdRef.current = user.id
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to sync cloud shortcuts', error)
        }
      } finally {
        syncingCloudRef.current = false
      }
    }

    void sync()

    return () => {
      cancelled = true
    }
  }, [isShortcutsReady, user])

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

  const editShortcut = (shortcut: Shortcut) => {
    setDialogMode('edit')
    setEditingShortcutId(shortcut.id)
    setDialogForm({ title: shortcut.title, url: shortcut.url })
    setDialogError('')
    setShowDialog(true)
  }

  const deleteShortcut = async (id: string, title: string) => {
    const shouldDelete = window.confirm(`确定要移除快捷方式 "${title}" 吗喵？`)
    if (!shouldDelete) {
      return
    }

    if (user) {
      try {
        await deleteMyShortcut(id)
      } catch (error) {
        setDialogError(buildErrorMessage(error))
        return
      }
    }

    setShortcuts((prev) => prev.filter((item) => item.id !== id))
  }

  const moveShortcut = async (id: string, direction: -1 | 1) => {
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

    setShortcuts(reordered)

    if (!user) {
      return
    }

    try {
      const result = await reorderMyShortcuts({ ids: reordered.map((item) => item.id) })
      setShortcuts(result.items)
    } catch (error) {
      setDialogError(buildErrorMessage(error))
      setShortcuts(shortcuts)
    }
  }

  const saveShortcut = async () => {
    const title = dialogForm.title.trim()
    const normalizedUrl = normalizeUrl(dialogForm.url)

    if (!title) {
      setDialogError('请输入快捷方式名称喵。')
      return
    }

    if (!normalizedUrl) {
      setDialogError('请输入有效的 URL 地址喵。')
      return
    }

    const icon = buildFaviconUrl(normalizedUrl)

    try {
      if (dialogMode === 'add') {
        if (user) {
          const created = await createMyShortcut({ title, url: normalizedUrl, icon })
          setShortcuts((prev) => [...prev, created])
        } else {
          setShortcuts((prev) => [
            ...prev,
            {
              id: createLocalShortcutId(),
              title,
              url: normalizedUrl,
              icon,
              sortOrder: prev.length,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ])
        }
      } else if (editingShortcutId) {
        if (user) {
          const updated = await updateMyShortcut(editingShortcutId, { title, url: normalizedUrl, icon })
          setShortcuts((prev) => prev.map((item) => (item.id === editingShortcutId ? updated : item)))
        } else {
          setShortcuts((prev) =>
            prev.map((item) =>
              item.id === editingShortcutId
                ? {
                    ...item,
                    title,
                    url: normalizedUrl,
                    icon,
                    updatedAt: new Date().toISOString(),
                  }
                : item,
            ),
          )
        }
      }

      setDialogError('')
      setShowDialog(false)
    } catch (error) {
      setDialogError(buildErrorMessage(error))
    }
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
        animated={!staticView}
        onOpenShortcut={openExternalLink}
        onEditShortcut={editShortcut}
        onDeleteShortcut={(id, title) => {
          void deleteShortcut(id, title)
        }}
        onMoveShortcutUp={(id) => {
          void moveShortcut(id, -1)
        }}
        onMoveShortcutDown={(id) => {
          void moveShortcut(id, 1)
        }}
        onAddShortcut={openAddDialog}
        getHostname={getHostname}
        getShortcutIcon={getShortcutIcon}
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
        onSave={() => {
          void saveShortcut()
        }}
      />
    </>
  )
}
