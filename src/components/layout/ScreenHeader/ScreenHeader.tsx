import type { ReactNode } from 'react'
import styles from './ScreenHeader.module.css'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  right?: ReactNode
}

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <h1 className={styles.title}>{title}</h1>
      </div>
      {right && <div className={styles.right}>{right}</div>}
    </header>
  )
}
