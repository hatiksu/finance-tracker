import { useDeferredValue, useState } from 'react'
import { useApp } from '../../app/AppContext'
import { ScreenHeader } from '../../components/layout/ScreenHeader/ScreenHeader'
import { TransactionList } from '../../components/transactions/TransactionList/TransactionList'
import { Card } from '../../components/ui/Card/Card'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { Icon } from '../../components/ui/Icon/Icon'
import { Segmented } from '../../components/ui/Segmented/Segmented'
import { getCategory } from '../../data/categories'
import { useAllTransactions } from '../../db/hooks'
import { formatMoney } from '../../lib/money'
import { totals } from '../../lib/stats'
import ui from '../screen.module.css'
import styles from './History.module.css'

type Filter = 'all' | 'expense' | 'income'

export function History() {
  const { settings, openForm } = useApp()
  const { transactions, loading } = useAllTransactions()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const filtered = transactions.filter((t) => {
    if (filter !== 'all' && t.type !== filter) return false
    if (!deferredQuery) return true
    const haystack = `${t.note} ${getCategory(t.categoryId).name} ${t.amount / 100}`.toLowerCase()
    return haystack.includes(deferredQuery)
  })
  const sum = totals(filtered)

  return (
    <div className={ui.screen}>
      <ScreenHeader title="История" subtitle={`Всего операций: ${transactions.length}`} />

      <label className={styles.search}>
        <Icon name="search" size={18} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по описанию, категории, сумме"
          aria-label="Поиск операций"
        />
      </label>

      <Segmented
        label="Тип операций"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'Все' },
          { value: 'expense', label: 'Расходы' },
          { value: 'income', label: 'Доходы' },
        ]}
      />

      {(deferredQuery || filter !== 'all') && filtered.length > 0 && (
        <p className={`${styles.summary} tabular`}>
          Найдено {filtered.length}
          {sum.expense > 0 && <> · расходы {formatMoney(sum.expense, settings.currency)}</>}
          {sum.income > 0 && <> · доходы {formatMoney(sum.income, settings.currency)}</>}
        </p>
      )}

      <Card>
        {loading ? null : filtered.length ? (
          <TransactionList transactions={filtered} currency={settings.currency} onSelect={openForm} />
        ) : (
          <EmptyState
            emoji={transactions.length ? '🔍' : '🗒️'}
            title={transactions.length ? 'Ничего не найдено' : 'Пока пусто'}
            text={transactions.length ? 'Попробуйте изменить запрос или фильтр.' : 'Добавьте первую операцию кнопкой «+».'}
          />
        )}
      </Card>
    </div>
  )
}
