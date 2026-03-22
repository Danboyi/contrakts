'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SHORTCUT_MAP: Record<string, string> = {
  d: '/dashboard',
  c: '/contracts',
  n: '/notifications',
  t: '/templates',
}

export function useKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Ignore when modifier keys are held (except for Cmd+K which is handled by command palette)
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const route = SHORTCUT_MAP[e.key.toLowerCase()]
      if (route) {
        e.preventDefault()
        router.push(route)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])
}
