import { AnimatePresence, motion } from 'motion/react'
import { formatDayLabel } from '../../../lib/dates'
import { formatMoney } from '../../../lib/money'
import type { Transaction } from '../../../types'
import { TransactionItem } from '../TransactionItem/TransactionItem'
import styles from './TransactionList.module.css'

interface TransactionListProps {
  transactions: Transaction[]
  currency: string
  onSelect: (tx: Transaction) => void
  /** Показывать итог за день в заголовке группы */
  showDayTotals?: boolean
}

/** Операции, сгруппированные по дням (новые сверху). */
export function TransactionList({ transactions, currency, onSelect, showDayTotals = true }: TransactionListProps) {
  const groups: { date: string; items: Transaction[] }[] = []
  for (const tx of transactions) {
    const last = groups[groups.length - 1]
    if (last?.date === tx.date) last.items.push(tx)
    else groups.push({ date: tx.date, items: [tx] })
  }

  return (
    <div className={styles.list}>
      {groups.map((g) => {
        const spent = g.items.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        return (
          <section key={g.date} className={styles.group}>
            <header className={styles.header}>
              <span>{formatDayLabel(g.date)}</span>
              {showDayTotals && spent > 0 && <span className="tabular">−{formatMoney(spent, currency)}</span>}
            </header>
            <AnimatePresence initial={false}>
              {g.items.map((tx) => (
                <motion.div
                  key={tx.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <TransactionItem tx={tx} currency={currency} onClick={onSelect} />
                </motion.div>
              ))}
            </AnimatePresence>
          </section>
        )
      })}
    </div>
  )
}
