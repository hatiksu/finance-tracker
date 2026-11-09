import { motion } from 'motion/react'
import { categoryColor } from '../../../data/categories'
import { formatMoney } from '../../../lib/money'
import type { Category } from '../../../types'
import { Icon } from '../../ui/Icon/Icon'
import styles from './BudgetMeter.module.css'

interface BudgetMeterProps {
  category: Category
  spent: number
  limit: number
  currency: string
  onClick?: () => void
}

/**
 * Шкала бюджета. До 80% — цвет категории; 80–100% — предупреждение; больше 100% — превышение.
 * Статус всегда дублируется иконкой и текстом, не только цветом.
 */
export function BudgetMeter({ category, spent, limit, currency, onClick }: BudgetMeterProps) {
  const ratio = limit > 0 ? spent / limit : 0
  const status = limit <= 0 ? 'none' : ratio > 1 ? 'over' : ratio >= 0.8 ? 'warning' : 'ok'
  const fill =
    status === 'over' ? 'var(--status-critical)' : status === 'warning' ? 'var(--status-warning)' : categoryColor(category)

  return (
    <button type="button" className={styles.meter} onClick={onClick}>
      <div className={styles.top}>
        <span className={styles.name}>
          <span className={styles.emoji}>{category.emoji}</span>
          {category.name}
        </span>
        <span className={`${styles.values} tabular`}>
          <strong>{formatMoney(spent, currency)}</strong>
          {limit > 0 && <span className={styles.limit}> / {formatMoney(limit, currency)}</span>}
        </span>
      </div>

      {limit > 0 ? (
        <>
          <div className={styles.track} role="meter" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={spent} aria-label={`${category.name}: потрачено ${Math.round(ratio * 100)}% бюджета`}>
            <motion.div
              className={styles.fill}
              style={{ background: fill }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(ratio, 1) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className={styles.bottom}>
            {status === 'over' && (
              <span className={`${styles.status} ${styles.over}`}>
                <Icon name="alert" size={14} /> Превышен на {formatMoney(spent - limit, currency)}
              </span>
            )}
            {status === 'warning' && (
              <span className={`${styles.status} ${styles.warning}`}>
                <Icon name="alert" size={14} /> Осталось {formatMoney(limit - spent, currency)}
              </span>
            )}
            {status === 'ok' && (
              <span className={styles.status}>
                <Icon name="check" size={14} /> Осталось {formatMoney(limit - spent, currency)}
              </span>
            )}
            <span className={`${styles.percent} tabular`}>{Math.round(ratio * 100)}%</span>
          </div>
        </>
      ) : (
        <span className={styles.noLimit}>Лимит не задан — нажмите, чтобы установить</span>
      )}
    </button>
  )
}
