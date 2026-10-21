import { useEffect } from 'react'

// Each area (customer site, mechanic panel, admin panel) keeps its own CSS.
// This puts "theme-site" / "theme-mechanic" / "theme-admin" on <html> so
// only that area's styles apply.
export default function useTheme(name) {
  useEffect(() => {
    const el = document.documentElement
    el.classList.add('theme-' + name)
    return () => el.classList.remove('theme-' + name)
  }, [name])
}
