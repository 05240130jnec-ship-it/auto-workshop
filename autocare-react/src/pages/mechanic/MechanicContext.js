import { createContext, useContext } from 'react'

export const MechanicContext = createContext(null)

// Use this in any mechanic page:  const { data, get, Q, act, reload } = useMechanic()
export function useMechanic() {
  return useContext(MechanicContext)
}