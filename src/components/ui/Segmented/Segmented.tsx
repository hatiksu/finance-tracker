import { motion } from 'motion/react'
import { useId } from 'react'
import styles from './Segmented.module.css'

interface SegmentedProps<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}

/** Переключатель вариантов с плавающим индикатором. */
export function Segmented<T extends string>({ value, options, onChange, label }: SegmentedProps<T>) {
  const id = useId()
  return (
    <div className={styles.group} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`${styles.option} ${value === o.value ? styles.active : ''}`}
          onClick={() => onChange(o.value)}
        >
          {value === o.value && (
            <motion.span layoutId={`seg-${id}`} className={styles.thumb} transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
          )}
          <span className={styles.text}>{o.label}</span>
        </button>
      ))}
    </div>
  )
}
