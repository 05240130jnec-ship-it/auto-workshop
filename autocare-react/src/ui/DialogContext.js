import { createContext, useContext } from 'react'

export const DialogContext = createContext(null)

// const { toast, confirm, form, view, closeView } = useDialogs()
export function useDialogs() {
  return useContext(DialogContext)
}
