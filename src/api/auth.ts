import { clearSession } from './client'

export const logout = async () => {
  // Logto logout will be handled via useLogto().signOut() in React components.
  // This helper is for local state cleanup if needed.
  clearSession()
}

export { getSessionSnapshot, subscribeSession, subscribeSession as subscribeClientSession } from './client'
