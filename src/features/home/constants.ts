import { BsBing } from 'react-icons/bs'
import {
  SiBaidu,
  SiBilibili,
  SiDuckduckgo,
  SiGithub,
  SiGoogle,
  SiStackoverflow,
  SiYoutube,
} from 'react-icons/si'
import type { SearchEngine } from './types'

export const SHORTCUT_STORAGE_KEY = 'shortcuts'
export const SHORTCUTS_STORAGE_BACKUP_KEY = 'shortcuts-backup'
export const SHORTCUTS_STORAGE_RECOVERY_KEY = 'shortcuts-recovery'
export const SHORTCUTS_STORAGE_RECOVERY_PREV_KEY = 'shortcuts-recovery-prev'
export const SHORTCUTS_MIGRATION_FLAG_KEY = 'shortcuts-cloud-migrated'
export const ENGINE_STORAGE_KEY = 'search-engine'
export const SEARCH_HISTORY_STORAGE_KEY = 'search-history'
export const MAX_SEARCH_HISTORY = 8

export const engines: SearchEngine[] = [
  { id: 'google', name: 'Google', icon: SiGoogle, color: '#4285f4', url: 'https://www.google.com/search?q=' },
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
