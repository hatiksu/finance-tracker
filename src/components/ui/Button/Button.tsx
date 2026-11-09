import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  icon?: ReactNode
  block?: boolean
}

export function Button({ variant = 'secondary', icon, block, className = '', children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={`${styles.button} ${styles[variant]} ${block ? styles.block : ''} ${className}`} {...rest}>
      {icon}
      {children}
    </button>
  )
}
