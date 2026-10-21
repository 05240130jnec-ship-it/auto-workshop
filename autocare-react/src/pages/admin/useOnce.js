import { useEffect, useRef } from 'react'

// Run something once when the page opens (e.g. ?new=1 opens the "Add" form)
export default function useOnce(fn) {
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    fn()
  })
}
