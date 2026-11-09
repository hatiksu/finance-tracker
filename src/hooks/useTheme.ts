import { useEffect } from 'react'
import type { ThemeSetting } from '../types'

/** Применяет тему: system — по настройке устройства, light/dark — принудительно. */
export function useTheme(theme: ThemeSetting) {
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)

    // Цвет строки состояния подстраиваем под фон
    const apply = () => {
      const bg = getComputedStyle(root).getPropertyValue('--bg').trim()
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', bg))
    }
    apply()
    const mq = matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}
