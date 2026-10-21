import { useEffect } from 'react'

// Sets the browser tab title, like <title> in your HTML pages
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = 'AutoCarePro | ' + title
  }, [title])
}
