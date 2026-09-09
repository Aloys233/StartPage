import React from 'react'
import type { IconBaseProps, IconType } from 'react-icons'
import { BsBing } from 'react-icons/bs'
import {
  SiBaidu,
  SiBilibili,
  SiDuckduckgo,
  SiGithub,
  SiStackoverflow,
  SiYoutube,
} from 'react-icons/si'
import type { SearchEngine } from './types'

export const GoogleIcon: IconType = (props: IconBaseProps) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      height: '1em',
      width: '1em',
      xmlns: 'http://www.w3.org/2000/svg',
      ...props,
    },
    React.createElement('path', {
      fill: '#4285F4',
      d: 'M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z',
    }),
    React.createElement('path', {
      fill: '#34A853',
      d: 'M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z',
    }),
    React.createElement('path', {
      fill: '#FBBC05',
      d: 'M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z',
    }),
    React.createElement('path', {
      fill: '#EA4335',
      d: 'M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z',
    }),
  )

export const SHORTCUT_STORAGE_KEY = 'shortcuts'
export const SHORTCUTS_STORAGE_BACKUP_KEY = 'shortcuts-backup'
export const SHORTCUTS_STORAGE_RECOVERY_KEY = 'shortcuts-recovery'
export const SHORTCUTS_STORAGE_RECOVERY_PREV_KEY = 'shortcuts-recovery-prev'
export const SHORTCUTS_MIGRATION_FLAG_KEY = 'shortcuts-cloud-migrated'
export const ENGINE_STORAGE_KEY = 'search-engine'
export const SEARCH_HISTORY_STORAGE_KEY = 'search-history'
export const MAX_SEARCH_HISTORY = 8

export const engines: SearchEngine[] = [
  { id: 'google', name: 'Google', icon: GoogleIcon, color: '#4285f4', url: 'https://www.google.com/search?q=' },
  { id: 'bing', name: 'Bing', icon: BsBing, color: '#00a4ef', url: 'https://www.bing.com/search?q=' },
  { id: 'baidu', name: 'Baidu', icon: SiBaidu, color: '#2932e1', url: 'https://www.baidu.com/s?wd=' },
  { id: 'duckduckgo', name: 'DuckDuckGo', icon: SiDuckduckgo, color: '#de5833', url: 'https://duckduckgo.com/?q=' },
  { id: 'github', name: 'GitHub', icon: SiGithub, color: '#ffffff', url: 'https://github.com/search?q=' },
  {
    id: 'stackoverflow',
    name: 'StackOverflow',
    icon: SiStackoverflow,
    color: '#f48024',
    url: 'https://stackoverflow.com/search?q=',
  },
  {
    id: 'bilibili',
    name: 'Bilibili',
    icon: SiBilibili,
    color: '#fb7299',
    url: 'https://search.bilibili.com/all?keyword=',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: SiYoutube,
    color: '#ff0000',
    url: 'https://www.youtube.com/results?search_query=',
  },
]

export const FALLBACK_ENGINES = engines.slice(0, 4)

export const WALLPAPER_API = 'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN'
export const WALLPAPER_BASE = 'https://cn.bing.com'
export const WALLPAPER_FALLBACK =
  'radial-gradient(circle at 18% 18%, rgba(95, 121, 201, 0.42), transparent 42%), radial-gradient(circle at 78% 8%, rgba(52, 101, 179, 0.36), transparent 35%), linear-gradient(145deg, #0d1428 0%, #101f3d 48%, #0a1429 100%)'
