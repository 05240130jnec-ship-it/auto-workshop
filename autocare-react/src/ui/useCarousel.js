import { useEffect } from 'react'
import bootstrap from '../bootstrap.js'

// Bootstrap only auto-starts carousels when the page first loads.
// In React the page is added later, so we start it ourselves.
export default function useCarousel(id, interval = 5000) {
  useEffect(() => {
    const el = document.getElementById(id)
    if (!el || !bootstrap) return
    const c = bootstrap.Carousel.getOrCreateInstance(el, { interval, ride: 'carousel', pause: false, wrap: true })
    c.cycle()
    return () => c.dispose()
  }, [id, interval])
}
