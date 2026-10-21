import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// Use this in any component:  const { user, login, logout } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
