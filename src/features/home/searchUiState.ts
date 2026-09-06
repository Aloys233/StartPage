export interface SearchUiState {
  query: string
  showSuggestions: boolean
}

let searchUiState: SearchUiState = {
  query: '',
  showSuggestions: false,
}

const listeners = new Set<(state: SearchUiState) => void>()

export const getSearchUiState = (): SearchUiState => searchUiState

export const setSearchUiState = (patch: Partial<SearchUiState>) => {
  searchUiState = {
    ...searchUiState,
    ...patch,
  }

  listeners.forEach((listener) => {
    listener(searchUiState)
  })
}

export const subscribeSearchUiState = (listener: (state: SearchUiState) => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
