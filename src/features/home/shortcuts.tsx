import { LayoutGrid } from 'lucide-react'
import { SiBilibili, SiGithub, SiOpenai, SiV2Ex, SiYoutube } from 'react-icons/si'

export const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName
  return (
    target.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  )
}

export const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const getShortcutIcon = (title: string, iconUrl: string) => {
  const t = title.toLowerCase()
  if (t.includes('github')) return <SiGithub className="h-7 w-7" />
  if (t.includes('bilibili')) return <SiBilibili className="h-7 w-7" />
  if (t.includes('youtube')) return <SiYoutube className="h-7 w-7" />
  if (t.includes('chatgpt')) return <SiOpenai className="h-7 w-7" />
  if (t.includes('v2ex')) return <SiV2Ex className="h-7 w-7" />
  if (iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={iconUrl}
        alt={title}
        className="h-8 w-8 object-contain opacity-90 group-hover:opacity-100"
      />
    )
  }
  return <LayoutGrid className="h-7 w-7 opacity-70" />
}
