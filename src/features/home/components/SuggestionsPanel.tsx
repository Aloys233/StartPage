"use client"

import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchEngine, SuggestionStatus } from '../types'

interface SuggestionsPanelProps {
  showSuggestions: boolean
  query: string
  suggestionListId: string
  suggestionStatus: SuggestionStatus
  suggestions: string[]
  selectedIdx: number
  setSelectedIdx: (index: number) => void
  filteredRecentSearches: string[]
  fallbackEngines: SearchEngine[]
  onSearch: (query: string, engine?: SearchEngine) => void
  highlight: (text: string) => string | ReactNode[]
}

export function SuggestionsPanel({
  query,
  suggestionListId,
  suggestionStatus,
  suggestions,
  selectedIdx,
  setSelectedIdx,
  filteredRecentSearches,
  fallbackEngines,
  onSearch,
  highlight,
}: SuggestionsPanelProps) {
  return (
    <div className="overflow-hidden">
      {/* 极轻柔细腻的内部分割线，连接搜索栏与候选词列表，消除双重卡片拼缝 */}
      <div className="mx-3 my-1 border-t border-white/10" />

      <div
        id={suggestionListId}
        role="listbox"
        aria-label="Search suggestions"
        className="max-h-[40vh] overflow-y-auto px-2 pt-1 pb-2.5"
      >
        {suggestionStatus === 'loading' && suggestions.length === 0 && (
          <div className="px-6 py-3 text-[12px] tracking-[0.15em] text-white/55 uppercase">Loading suggestions...</div>
        )}

        {suggestions.length > 0 ? (
          <div>
            {suggestions.map((item, index) => (
              <div
                key={`${item}-${index}`}
                id={`${suggestionListId}-suggestion-${index}`}
                role="option"
                aria-selected={selectedIdx === index}
                className={cn(
                  'group/item flex cursor-pointer items-center gap-4 rounded-2xl px-6 py-3.5 transition-all duration-200 hover:bg-white/15',
                  selectedIdx === index && 'translate-x-1 bg-white/20',
                )}
                onMouseDown={(event) => {
                  event.preventDefault()
                  onSearch(item)
                }}
                onMouseEnter={() => setSelectedIdx(index)}
              >
                <Search className="h-4 w-4 text-white/22 group-hover/item:text-white/55" />
                <span className="flex-1 truncate text-[17px] font-light tracking-wide text-white/65 group-hover/item:text-white/92">
                  {highlight(item)}
                </span>
              </div>
            ))}
          </div>
        ) : suggestionStatus !== 'loading' ? (
          <div className="space-y-1 p-1">
            {filteredRecentSearches.length > 0 && (
              <>
                <div className="px-6 py-2.5 text-[11px] font-bold tracking-[0.3em] text-white/28 uppercase">Recent</div>
                {filteredRecentSearches.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    id={`${suggestionListId}-history-${index}`}
                    role="option"
                    aria-selected={selectedIdx === index}
                    className={cn(
                      'group/item flex cursor-pointer items-center gap-4 rounded-2xl px-6 py-3.5 transition-all hover:translate-x-1 hover:bg-white/15',
                      selectedIdx === index && 'translate-x-1 bg-white/20',
                    )}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      onSearch(item)
                    }}
                    onMouseEnter={() => setSelectedIdx(index)}
                  >
                    <Search className="h-4 w-4 text-white/22 group-hover/item:text-white/55" />
                    <span className="flex-1 truncate text-[16px] tracking-wide text-white/65 group-hover/item:text-white/92">
                      {highlight(item)}
                    </span>
                  </div>
                ))}
                <div className="mx-4 my-2 border-t border-white/10" />
              </>
            )}
            <div className="px-6 py-2.5 text-[11px] font-bold tracking-[0.3em] text-white/28 uppercase">Search In</div>
            {fallbackEngines.map((item, index) => {
              const ItemIcon = item.icon
              return (
                <div
                  key={item.id}
                  id={`${suggestionListId}-engine-${index}`}
                  role="option"
                  aria-selected={selectedIdx === filteredRecentSearches.length + index}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 rounded-2xl px-6 py-3.5 transition-all hover:translate-x-1 hover:bg-white/15',
                    selectedIdx === filteredRecentSearches.length + index && 'translate-x-1 bg-white/20',
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    onSearch(query, item)
                  }}
                  onMouseEnter={() => setSelectedIdx(filteredRecentSearches.length + index)}
                >
                  <span className="text-xl opacity-50 transition-all" style={{ color: item.color }}>
                    <ItemIcon />
                  </span>
                  <span className="text-[15px] font-medium text-white/65">Search on {item.name}</span>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
