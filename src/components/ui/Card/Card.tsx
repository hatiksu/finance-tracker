import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import styles from './Card.module.css'

interface CardProps {
  title?: string
  action?: ReactNode
  children: ReactNode
  delay?: number
  className?: string
}

export function Card({ title, action, children, delay = 0, className = '' }: CardProps) {
  return (
    <motion.section
      className={`${styles.card} ${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {(title || action) && (
        <header className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </motion.section>
  )
}
