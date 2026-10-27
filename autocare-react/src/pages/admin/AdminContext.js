import { createContext, useContext } from 'react'

export const AdminContext = createContext(null)

// Use this in any admin page:  const { data, Q, act, reload } = useAdmin()
export function useAdmin() {
  return useContext(AdminContext)
}