// Расчёты для графиков и аналитики.
import { categoriesOf, getCategory } from '../data/categories'
import type { Category, Transaction } from '../types'
import { daysInMonth, today } from './dates'

export interface Totals {
  income: number
  expense: number
  balance: number
}

export function totals(txs: Transaction[]): Totals {
  let income = 0
  let expense = 0
  for (const t of txs) {
    if (t.type === 'income') income += t.amount
    else expense += t.amount
  }
  return { income, expense, balance: income - expense }
}

export interface CategorySlice {
  category: Category
  amount: number
  share: number
  count: number
}

/** Расходы по категориям, по убыванию суммы */
export function byCategory(txs: Transaction[], type: 'expense' | 'income' = 'expense'): CategorySlice[] {
  const sums = new Map<string, { amount: number; count: number }>()
  let total = 0
  for (const t of txs) {
    if (t.type !== type) continue
    const s = sums.get(t.categoryId) ?? { amount: 0, count: 0 }
    s.amount += t.amount
    s.count += 1
    sums.set(t.categoryId, s)
    total += t.amount
  }
  return [...sums.entries()]
    .map(([id, s]) => ({ category: getCategory(id), amount: s.amount, count: s.count, share: total ? s.amount / total : 0 }))
    .sort((a, b) => b.amount - a.amount)
}

/** Расходы по дням месяца: массив длиной в число дней */
export function dailyExpenses(txs: Transaction[], month: string): number[] {
  const days = new Array<number>(daysInMonth(month)).fill(0)
  for (const t of txs) {
    if (t.type !== 'expense' || !t.date.startsWith(month)) continue
    days[Number(t.date.slice(8, 10)) - 1] += t.amount
  }
  return days
}

/** Сколько дней месяца уже прошло (для прогноза) */
export function elapsedDays(month: string): number {
  const t = today()
  if (t.slice(0, 7) > month) return daysInMonth(month)
  if (t.slice(0, 7) < month) return 0
  return Number(t.slice(8, 10))
}

export interface LocalInsights {
  avgPerDay: number
  forecast: number
  topCategory: CategorySlice | null
  biggest: Transaction | null
  /** Изменение расходов к прошлому месяцу за тот же период, доля (0.12 = +12%) */
  changeVsPrev: number | null
  overBudget: { category: Category; spent: number; limit: number }[]
}

export function localInsights(
  month: string,
  current: Transaction[],
  previous: Transaction[],
  budgets: Map<string, number>,
): LocalInsights {
  const days = elapsedDays(month)
  const { expense } = totals(current)
  // Оценки округляем до целых единиц валюты — копейки тут только мешают
  const toWhole = (minor: number) => Math.round(minor / 100) * 100
  const avgPerDay = days ? toWhole(expense / days) : 0
  const forecast = days ? toWhole((expense / days) * daysInMonth(month)) : 0
  const slices = byCategory(current)

  // Сравниваем с тем же числом дней прошлого месяца
  const prevSamePeriod = previous.filter((t) => t.type === 'expense' && Number(t.date.slice(8, 10)) <= days)
  const prevExpense = totals(prevSamePeriod).expense
  const changeVsPrev = prevExpense > 0 ? expense / prevExpense - 1 : null

  const biggest = current.filter((t) => t.type === 'expense').sort((a, b) => b.amount - a.amount)[0] ?? null

  const overBudget = categoriesOf('expense')
    .map((c) => ({ category: c, spent: slices.find((s) => s.category.id === c.id)?.amount ?? 0, limit: budgets.get(c.id) ?? 0 }))
    .filter((b) => b.limit > 0 && b.spent > b.limit)

  return { avgPerDay, forecast, topCategory: slices[0] ?? null, biggest, changeVsPrev, overBudget }
}
