import { currentMonth, formatMonth, shiftMonth } from '../../../lib/dates'
import { Icon } from '../Icon/Icon'
import styles from './MonthSwitcher.module.css'

interface MonthSwitcherProps {
  month: string
  onChange: (month: string) => void
}

export function MonthSwitcher({ month, onChange }: MonthSwitcherProps) {
  const isCurrent = month >= currentMonth()
  return (
    <div className={styles.switcher}>
      <button type="button" className={styles.arrow} onClick={() => onChange(shiftMonth(month, -1))} aria-label="Предыдущий месяц">
        <Icon name="chevronLeft" size={20} />
      </button>
      <button
        type="button"
        className={styles.label}
        onClick={() => onChange(currentMonth())}
        title="Вернуться к текущему месяцу"
      >
        {formatMonth(month)}
      </button>
      <button
        type="button"
        className={styles.arrow}
        onClick={() => onChange(shiftMonth(month, 1))}
        disabled={isCurrent}
        aria-label="Следующий месяц"
      >
        <Icon name="chevronRight" size={20} />
      </button>
    </div>
  )
}
