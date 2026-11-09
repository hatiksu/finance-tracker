import { useState } from 'react'
import { motion } from 'motion/react'
import { useApp } from '../../app/AppContext'
import { BudgetMeter } from '../../components/charts/BudgetMeter/BudgetMeter'
import { ScreenHeader } from '../../components/layout/ScreenHeader/ScreenHeader'
import { Button } from '../../components/ui/Button/Button'
import { Card } from '../../components/ui/Card/Card'
import { MonthSwitcher } from '../../components/ui/MonthSwitcher/MonthSwitcher'
import { Sheet } from '../../components/ui/Sheet/Sheet'
import { categoriesOf } from '../../data/categories'
import { useBudgets, useMonthTransactions } from '../../db/hooks'
import { setBudget } from '../../db/repo'
import { formatMoney, minorToInput, parseMoneyInput } from '../../lib/money'
import { byCategory } from '../../lib/stats'
import type { Category } from '../../types'
import ui from '../screen.module.css'
import styles from './Budgets.module.css'

export function Budgets() {
  const { settings, month, setMonth, toast } = useApp()
  const { transactions } = useMonthTransactions(month)
  const budgets = useBudgets()
  const [editing, setEditing] = useState<Category | null>(null)
  const [value, setValue] = useState('')
  const currency = settings.currency

  const spentBy = new Map(byCategory(transactions).map((s) => [s.category.id, s.amount]))
  const categories = categoriesOf('expense')
  const withLimit = categories.filter((c) => (budgets.get(c.id) ?? 0) > 0)
  const totalLimit = withLimit.reduce((s, c) => s + (budgets.get(c.id) ?? 0), 0)
  const totalSpent = withLimit.reduce((s, c) => s + (spentBy.get(c.id) ?? 0), 0)

  // Сначала категории с лимитом, затем по сумме трат
  const sorted = [...categories].sort((a, b) => {
    const la = budgets.has(a.id) ? 1 : 0
    const lb = budgets.has(b.id) ? 1 : 0
    return lb - la || (spentBy.get(b.id) ?? 0) - (spentBy.get(a.id) ?? 0)
  })

  const open = (c: Category) => {
    setEditing(c)
    const limit = budgets.get(c.id)
    setValue(limit ? minorToInput(limit) : '')
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const minor = value.trim() ? parseMoneyInput(value) : 0
    if (!Number.isFinite(minor) || minor < 0) {
      toast('Введите сумму числом', { tone: 'error' })
      return
    }
    await setBudget({ categoryId: editing.id, limit: minor })
    toast(minor ? `Лимит «${editing.name}»: ${formatMoney(minor, currency)}` : `Лимит «${editing.name}» снят`)
    setEditing(null)
  }

  const ratio = totalLimit ? totalSpent / totalLimit : 0

  return (
    <div className={ui.screen}>
      <ScreenHeader title="Бюджеты" subtitle="Лимиты трат на месяц" />
      <div className={ui.toolbar}>
        <MonthSwitcher month={month} onChange={setMonth} />
      </div>

      {totalLimit > 0 && (
        <Card>
          <div className={styles.total}>
            <div>
              <span className={styles.totalLabel}>Потрачено из бюджета</span>
              <strong className={`${styles.totalValue} tabular`}>
                {formatMoney(totalSpent, currency)} <span>из {formatMoney(totalLimit, currency)}</span>
              </strong>
            </div>
            <span className={`${styles.totalPct} tabular`}>{Math.round(ratio * 100)}%</span>
          </div>
          <div className={styles.track}>
            <motion.div
              className={styles.fill}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(ratio, 1) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: ratio > 1 ? 'var(--status-critical)' : ratio >= 0.8 ? 'var(--status-warning)' : 'var(--accent)' }}
            />
          </div>
          <p className={styles.totalHint}>
            {ratio > 1
              ? `Бюджет превышен на ${formatMoney(totalSpent - totalLimit, currency)}`
              : `Осталось ${formatMoney(totalLimit - totalSpent, currency)}`}
          </p>
        </Card>
      )}

      <div className={styles.list}>
        {sorted.map((c) => (
          <BudgetMeter key={c.id} category={c} spent={spentBy.get(c.id) ?? 0} limit={budgets.get(c.id) ?? 0} currency={currency} onClick={() => open(c)} />
        ))}
      </div>

      <Sheet open={Boolean(editing)} title={editing ? `${editing.emoji} ${editing.name}` : ''} onClose={() => setEditing(null)}>
        <form className={styles.form} onSubmit={save}>
          <label className={styles.field}>
            <span>Лимит на месяц</span>
            <input
              className="tabular"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d.,\s]/g, ''))}
              placeholder="Например, 15 000"
              autoFocus
            />
          </label>
          {editing && (
            <p className={styles.hint}>
              В этом месяце потрачено {formatMoney(spentBy.get(editing.id) ?? 0, currency)}. Пустое поле — без лимита.
            </p>
          )}
          <Button type="submit" variant="primary" block>
            Сохранить
          </Button>
        </form>
      </Sheet>
    </div>
  )
}
