import { categoryColor, getCategory } from '../../../data/categories'
import { formatMoney } from '../../../lib/money'
import type { Transaction } from '../../../types'
import styles from './TransactionItem.module.css'

interface TransactionItemProps {
  tx: Transaction
  currency: string
  onClick: (tx: Transaction) => void
}

export function TransactionItem({ tx, currency, onClick }: TransactionItemProps) {
  const category = getCategory(tx.categoryId)
  const income = tx.type === 'income'
  return (
    <button type="button" className={styles.item} onClick={() => onClick(tx)}>
      <span
        className={styles.icon}
        style={{ background: `color-mix(in srgb, ${categoryColor(category)} 18%, transparent)` }}
        aria-hidden="true"
      >
        {category.emoji}
      </span>
      <span className={styles.text}>
        <span className={styles.note}>{tx.note || category.name}</span>
        <span className={styles.category}>{category.name}</span>
      </span>
      <span className={`${styles.amount} ${income ? styles.income : ''} tabular`}>
        {formatMoney(income ? tx.amount : -tx.amount, currency, { sign: income })}
      </span>
    </button>
  )
}
