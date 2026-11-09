import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useApp } from '../../app/AppContext'
import { ScreenHeader } from '../../components/layout/ScreenHeader/ScreenHeader'
import { Button } from '../../components/ui/Button/Button'
import { Card } from '../../components/ui/Card/Card'
import { EmptyState } from '../../components/ui/EmptyState/EmptyState'
import { Icon } from '../../components/ui/Icon/Icon'
import { MonthSwitcher } from '../../components/ui/MonthSwitcher/MonthSwitcher'
import { getCategory } from '../../data/categories'
import { useBudgets, useMonthTransactions } from '../../db/hooks'
import type { AIInsights } from '../../lib/ai'
import { currentMonth, formatMonth, formatShortDay, shiftMonth } from '../../lib/dates'
import { formatMoney } from '../../lib/money'
import { byCategory, elapsedDays, localInsights, totals } from '../../lib/stats'
import ui from '../screen.module.css'
import styles from './Insights.module.css'

export function Insights() {
  const { settings, month, setMonth, navigate } = useApp()
  const { transactions } = useMonthTransactions(month)
  const { transactions: previous } = useMonthTransactions(shiftMonth(month, -1))
  const budgets = useBudgets()
  const [ai, setAI] = useState<Record<string, AIInsights>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const currency = settings.currency
  const money = (v: number) => formatMoney(v, currency)

  const t = totals(transactions)
  const info = localInsights(month, transactions, previous, budgets)
  const isPast = month < currentMonth()

  const runAI = async () => {
    if (!settings.apiKey) return
    setBusy(true)
    setError('')
    try {
      const { analyzeMonth } = await import('../../lib/ai')
      // Отправляем только агрегированную сводку, а не список операций
      const summary = {
        month: formatMonth(month),
        currency,
        daysElapsed: elapsedDays(month),
        income: t.income / 100,
        expense: t.expense / 100,
        balance: t.balance / 100,
        forecastMonthExpense: info.forecast / 100,
        changeVsPreviousMonthSamePeriod: info.changeVsPrev === null ? null : `${Math.round(info.changeVsPrev * 100)}%`,
        expensesByCategory: byCategory(transactions).map((s) => ({
          category: s.category.name,
          amount: s.amount / 100,
          share: `${Math.round(s.share * 100)}%`,
          operations: s.count,
          budget: (budgets.get(s.category.id) ?? 0) / 100 || null,
        })),
        previousMonthByCategory: byCategory(previous).map((s) => ({ category: s.category.name, amount: s.amount / 100 })),
        frequentNotes: topNotes(transactions),
      }
      const result = await analyzeMonth(settings.apiKey, summary)
      setAI((prev) => ({ ...prev, [month]: result }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка ИИ')
    } finally {
      setBusy(false)
    }
  }

  const result = ai[month]

  return (
    <div className={ui.screen}>
      <ScreenHeader title="Аналитика" subtitle="Подсказки по вашим тратам" />
      <div className={ui.toolbar}>
        <MonthSwitcher month={month} onChange={setMonth} />
      </div>

      {t.expense === 0 ? (
        <Card>
          <EmptyState emoji="📊" title="Пока нечего анализировать" text="Добавьте несколько трат за этот месяц — и здесь появятся подсказки." />
        </Card>
      ) : (
        <>
          <div className={styles.grid}>
            <Card delay={0}>
              <span className={styles.label}>В среднем в день</span>
              <strong className={`${styles.value} tabular`}>{money(info.avgPerDay)}</strong>
            </Card>
            <Card delay={0.04}>
              <span className={styles.label}>{isPast ? 'Итого за месяц' : 'Прогноз на месяц'}</span>
              <strong className={`${styles.value} tabular`}>{money(isPast ? t.expense : info.forecast)}</strong>
            </Card>
          </div>

          <Card title="Главное" delay={0.08}>
            <ul className={styles.facts}>
              {info.changeVsPrev !== null && (
                <li>
                  <span className={styles.factIcon}>{info.changeVsPrev > 0 ? '📈' : '📉'}</span>
                  <span>
                    Расходы {info.changeVsPrev > 0 ? 'выше' : 'ниже'}, чем в прошлом месяце за тот же период, на{' '}
                    <strong>{Math.abs(Math.round(info.changeVsPrev * 100))}%</strong>
                  </span>
                </li>
              )}
              {info.topCategory && (
                <li>
                  <span className={styles.factIcon}>{info.topCategory.category.emoji}</span>
                  <span>
                    Больше всего уходит на «{info.topCategory.category.name}» — <strong>{money(info.topCategory.amount)}</strong> (
                    {Math.round(info.topCategory.share * 100)}% расходов)
                  </span>
                </li>
              )}
              {info.biggest && (
                <li>
                  <span className={styles.factIcon}>💥</span>
                  <span>
                    Самая крупная трата: «{info.biggest.note || getCategory(info.biggest.categoryId).name}» —{' '}
                    <strong>{money(info.biggest.amount)}</strong>, {formatShortDay(info.biggest.date)}
                  </span>
                </li>
              )}
              {info.overBudget.map((b) => (
                <li key={b.category.id}>
                  <span className={styles.factIcon}>⚠️</span>
                  <span>
                    Бюджет «{b.category.name}» превышен на <strong>{money(b.spent - b.limit)}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card delay={0.12} className={styles.aiCard}>
            <div className={styles.aiHead}>
              <span className={styles.aiBadge}>
                <Icon name="sparkles" size={18} /> Разбор от ИИ
              </span>
              {result && (
                <button type="button" className={ui.link} onClick={runAI} disabled={busy}>
                  Обновить
                </button>
              )}
            </div>

            {!settings.apiKey ? (
              <>
                <p className={styles.aiText}>
                  Claude проанализирует месяц: найдёт, где перерасход, и подскажет, что можно урезать. Для этого нужен API-ключ Anthropic.
                </p>
                <Button variant="primary" onClick={() => navigate('settings')}>
                  Добавить ключ в настройках
                </Button>
              </>
            ) : !result ? (
              <>
                <p className={styles.aiText}>
                  Claude получит только сводку по категориям, а не список ваших операций, и вернёт наблюдения и советы.
                </p>
                <Button variant="primary" onClick={runAI} disabled={busy} icon={<Icon name="sparkles" size={18} />}>
                  {busy ? 'Анализирую…' : 'Разобрать месяц'}
                </Button>
              </>
            ) : null}

            {error && <p className={styles.error}>{error}</p>}

            <AnimatePresence>
              {result && (
                <motion.div className={styles.aiResult} initial={{ opacity: 0, y: 10 }} animate={{ opacity: busy ? 0.5 : 1, y: 0 }}>
                  <p className={styles.summary}>{result.summary}</p>
                  <div className={styles.highlights}>
                    {result.highlights.map((h, i) => (
                      <motion.div
                        key={i}
                        className={styles.highlight}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                      >
                        <span className={styles.hEmoji}>{h.emoji}</span>
                        <div>
                          <strong>{h.title}</strong>
                          <p>{h.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {result.tips.length > 0 && (
                    <>
                      <h3 className={styles.tipsTitle}>Что можно сделать</h3>
                      <ol className={styles.tips}>
                        {result.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ol>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </>
      )}
    </div>
  )
}

/** Самые частые описания трат — помогают ИИ увидеть привычки («кофе» 12 раз). */
function topNotes(txs: { type: string; note: string; amount: number }[]) {
  const counts = new Map<string, { count: number; amount: number }>()
  for (const t of txs) {
    if (t.type !== 'expense' || !t.note) continue
    const key = t.note.toLowerCase()
    const c = counts.get(key) ?? { count: 0, amount: 0 }
    c.count += 1
    c.amount += t.amount
    counts.set(key, c)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([note, c]) => ({ note, times: c.count, total: c.amount / 100 }))
}
