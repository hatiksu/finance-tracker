import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '../types'
import { byCategory, dailyExpenses, elapsedDays, localInsights, totals } from './stats'

let n = 0
const tx = (p: Partial<Transaction>): Transaction => ({
  id: String(++n),
  type: 'expense',
  amount: 10000,
  categoryId: 'food',
  note: '',
  date: '2026-11-01',
  createdAt: n,
  ...p,
})

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 10, 12, 0)) // 10 ноября
})
afterAll(() => {
  vi.useRealTimers()
})

describe('статистика', () => {
  const month = [
    tx({ type: 'income', amount: 5000000, categoryId: 'salary', date: '2026-11-05' }),
    tx({ amount: 300000, categoryId: 'food', date: '2026-11-02' }),
    tx({ amount: 100000, categoryId: 'food', date: '2026-11-02' }),
    tx({ amount: 600000, categoryId: 'cafe', date: '2026-11-08', note: 'Ресторан' }),
  ]

  it('totals', () => {
    expect(totals(month)).toEqual({ income: 5000000, expense: 1000000, balance: 4000000 })
  })

  it('byCategory — по убыванию и с долями', () => {
    const slices = byCategory(month)
    expect(slices.map((s) => s.category.id)).toEqual(['cafe', 'food'])
    expect(slices[0].share).toBeCloseTo(0.6)
    expect(slices[1].count).toBe(2)
  })

  it('dailyExpenses — массив по дням без доходов', () => {
    const days = dailyExpenses(month, '2026-11')
    expect(days).toHaveLength(30)
    expect(days[1]).toBe(400000)
    expect(days[4]).toBe(0)
    expect(days[7]).toBe(600000)
  })

  it('elapsedDays', () => {
    expect(elapsedDays('2026-11')).toBe(10)
    expect(elapsedDays('2026-10')).toBe(31)
    expect(elapsedDays('2026-12')).toBe(0)
  })

  it('localInsights: среднее, прогноз, сравнение и превышение бюджета', () => {
    const previous = [tx({ amount: 500000, date: '2026-10-03' }), tx({ amount: 900000, date: '2026-10-25' })]
    const info = localInsights('2026-11', month, previous, new Map([['cafe', 500000]]))
    expect(info.avgPerDay).toBe(100000) // 10 000 ₽ за 10 дней
    expect(info.forecast).toBe(3000000) // ×30 дней
    // В прошлом месяце за те же 10 дней — 5 000 ₽, сейчас 10 000 ₽
    expect(info.changeVsPrev).toBeCloseTo(1)
    expect(info.topCategory?.category.id).toBe('cafe')
    expect(info.biggest?.note).toBe('Ресторан')
    expect(info.overBudget.map((b) => b.category.id)).toEqual(['cafe'])
  })
})
