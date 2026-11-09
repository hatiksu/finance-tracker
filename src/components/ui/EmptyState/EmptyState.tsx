import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  emoji: string
  title: string
  text?: string
  children?: ReactNode
}

export function EmptyState({ emoji, title, text, children }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <span className={styles.emoji}>{emoji}</span>
      <p className={styles.title}>{title}</p>
      {text && <p className={styles.text}>{text}</p>}
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  )
}
