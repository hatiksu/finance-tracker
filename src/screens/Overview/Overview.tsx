import { useApp } from '../../app/AppContext'
import { DailyBars } from '../../components/charts/DailyBars/DailyBars'
import { DonutChart } from '../../components/charts/DonutChart/DonutChart'
import { StatTiles } from '../../components/charts/StatTiles/StatTiles'
import { ScreenHeader } from '../../components/layout/ScreenHeader/ScreenHeader'
import { QuickAdd } from '../../components/transactions/QuickAdd/QuickAdd'
import { TransactionList } from '../../components/transactions/TransactionList/TransactionList'
import { Button } from '../../components/ui/Button/Button'
import { Card } from '../../components/ui/Card/Card'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { Icon } from '../../components/ui/Icon/Icon'
import { MonthSwitcher } from '../../components/ui/MonthSwitcher/MonthSwitcher'
import { useMonthTransactions, useTransactionCount } from '../../db/hooks'
import { loadDemo } from '../../db/repo'
import { formatMonth } from '../../lib/dates'
import { byCategory, dailyExpenses, elapsedDays, totals } from '../../lib/stats'
import ui from '../screen.module.css'

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function Overview() {
  const { settings, month, setMonth, openForm, navigate, toast } = useApp()
  const { transactions, loading } = useMonthTransactions(month)
  const totalCount = useTransactionCount()
  const t = totals(transactions)
  const slices = byCategory(transactions)
  const currency = settings.currency

  const fillDemo = async () => {
    await loadDemo()
    toast('Готово: добавлены демо-данные за 2 месяца')
  }

  return (
    <div className={ui.screen}>
      <ScreenHeader
        subtitle={greeting()}
        title="Финансы"
        right={
          <button type="button" className={ui.iconButton} onClick={() => navigate('settings')} aria-label="Настройки">
            <Icon name="settings" />
          </button>
        }
      />

      <div className={ui.toolbar}>
        <MonthSwitcher month={month} onChange={setMonth} />
      </div>

      <StatTiles totals={t} currency={currency} />
      <QuickAdd />

      {totalCount === 0 && (
        <Card delay={0.05}>
          <EmptyState
            emoji="👋"
            title="Добро пожаловать!"
            text="Записывайте траты одной строкой выше или кнопкой «+». Чтобы сразу посмотреть, как всё выглядит, загрузите демо-данные."
          >
            <Button variant="primary" onClick={fillDemo}>
              Заполнить демо-данными
            </Button>
            <Button onClick={() => openForm()}>Добавить операцию</Button>
          </EmptyState>
        </Card>
      )}

      {!loading && totalCount !== 0 && (
        <>
          <Card title="Расходы по категориям" delay={0.05}>
            {slices.length ? (
              <DonutChart slices={slices} total={t.expense} currency={currency} label={`Расходы по категориям за ${formatMonth(month)}`} />
            ) : (
              <EmptyState emoji="🌱" title="Расходов пока нет" text={`За ${formatMonth(month).toLowerCase()} ничего не потрачено.`} />
            )}
          </Card>

          {t.expense > 0 && (
            <Card title="По дням" delay={0.1}>
              <DailyBars month={month} values={dailyExpenses(transactions, month)} currency={currency} elapsed={elapsedDays(month)} />
            </Card>
          )}

          <Card
            title="Последние операции"
            delay={0.15}
            action={
              transactions.length > 5 && (
                <button type="button" className={ui.link} onClick={() => navigate('history')}>
                  Все →
                </button>
              )
            }
          >
            {transactions.length ? (
              <TransactionList transactions={transactions.slice(0, 5)} currency={currency} onSelect={openForm} showDayTotals={false} />
            ) : (
              <EmptyState emoji="🗒️" title="Операций нет" />
            )}
          </Card>
        </>
      )}
    </div>
  )
}
