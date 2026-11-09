import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { formatMoney } from '../../../lib/money'
import type { Totals } from '../../../lib/stats'
import styles from './StatTiles.module.css'

/** Плавно «докручивает» число при изменении. */
function AnimatedMoney({ value, currency, sign }: { value: number; currency: string; sign?: boolean }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(value)
  // Последнее показанное значение: следующая анимация стартует с него
  const from = useRef(value)

  useEffect(() => {
    if (reduce) return
    // Промежуточные значения — без копеек, чтобы цифры не мельтешили
    const controls = animate(from.current, value, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        from.current = v
        setShown(Math.round(v / 100) * 100)
      },
      onComplete: () => setShown(value),
    })
    return () => controls.stop()
  }, [value, reduce])

  return <>{formatMoney(reduce ? value : shown, currency, { sign })}</>
}

interface StatTilesProps {
  totals: Totals
  currency: string
}

export function StatTiles({ totals, currency }: StatTilesProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.hero}>
        <span className={styles.label}>Баланс за месяц</span>
        <strong className={`${styles.heroValue} tabular`}>
          <AnimatedMoney value={totals.balance} currency={currency} sign />
        </strong>
      </div>
      <div className={styles.tile}>
        <span className={styles.label}>
          <i className={styles.dotIncome} /> Доходы
        </span>
        <strong className={`${styles.value} tabular`}>
          <AnimatedMoney value={totals.income} currency={currency} />
        </strong>
      </div>
      <div className={styles.tile}>
        <span className={styles.label}>
          <i className={styles.dotExpense} /> Расходы
        </span>
        <strong className={`${styles.value} tabular`}>
          <AnimatedMoney value={totals.expense} currency={currency} />
        </strong>
      </div>
    </div>
  )
}
