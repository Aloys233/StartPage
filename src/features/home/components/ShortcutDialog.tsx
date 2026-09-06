"use client"

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface ShortcutDialogProps {
  showDialog: boolean
  dialogMode: 'add' | 'edit'
  dialogForm: { title: string; url: string }
  dialogError: string
  onClose: () => void
  onChangeTitle: (value: string) => void
  onChangeUrl: (value: string) => void
  onSave: () => void
}

export function ShortcutDialog({
  showDialog,
  dialogMode,
  dialogForm,
  dialogError,
  onClose,
  onChangeTitle,
  onChangeUrl,
  onSave,
}: ShortcutDialogProps) {
  return (
    <Dialog open={showDialog} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="border-white/20 p-10 text-white">
        <DialogHeader>
          <DialogTitle>{dialogMode === 'add' ? 'Add Link' : 'Update Link'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-7 py-6">
          <div className="space-y-3">
            <label className="ml-2 text-[11px] font-bold tracking-[0.28em] text-white/32 uppercase">Label</label>
            <Input
              value={dialogForm.title}
              onChange={(event) => onChangeTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onSave()
                }
              }}
              placeholder="e.g. GitHub"
            />
          </div>

          <div className="space-y-3">
            <label className="ml-2 text-[11px] font-bold tracking-[0.28em] text-white/32 uppercase">URL</label>
            <Input
              value={dialogForm.url}
              onChange={(event) => onChangeUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onSave()
                }
              }}
              placeholder="https://..."
              aria-invalid={dialogError ? 'true' : 'false'}
            />
          </div>

          {dialogError && <p className="px-2 text-sm text-red-300">{dialogError}</p>}
        </div>

        <DialogFooter className="w-full flex flex-col gap-2.5 pt-2">
          <Button
            type="button"
            className="cards h-12 w-full rounded-xl bg-white/20 hover:bg-white/30 border border-white/25 text-white font-semibold text-base shadow-md transition-all [--card-hover-scale:1.01]"
            onClick={onSave}
          >
            {dialogMode === 'add' ? '确认添加' : '保存修改'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-full rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/10 tracking-widest uppercase"
            onClick={onClose}
          >
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
