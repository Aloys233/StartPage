import type { SearchEngineId, SuggestionEngineId, SuggestionResponse } from '@/features/home/types'
import { request } from './client'

const SUPPORTED_SUGGESTION_ENGINES: SuggestionEngineId[] = ['google', 'bing', 'baidu', 'duckduckgo', 'youtube']

const toSuggestionEngine = (engineId: SearchEngineId): SuggestionEngineId => {
  if (SUPPORTED_SUGGESTION_ENGINES.includes(engineId as SuggestionEngineId)) {
    return engineId as SuggestionEngineId
  }

  return 'google'
}

export async function getSuggestions(query: string, engineId: SearchEngineId = 'google'): Promise<string[]> {
  const q = query.trim()
  if (!q) return []

  try {
    const response = await request<SuggestionResponse>('/api/search/suggestions', {
      method: 'GET',
      query: {
        q,
        engine: toSuggestionEngine(engineId),
      },
    })

    if (Array.isArray(response?.items) && response.items.length > 0) {
      return response.items
    }
  } catch (error) {
    console.warn(`Failed to fetch suggestions for ${engineId}, using fallback:`, error)
  }

  return [q, `${q} tutorial`, `${q} github`, `${q} docs`]
}
