// Демо-данные: реалистичные операции за текущий и прошлый месяц, чтобы сразу увидеть приложение в деле.
import type { TxDraft } from '../types'
import { addDays, currentMonth, daysInMonth, shiftMonth } from './dates'
import { elapsedDays } from './stats'

type Template = [categoryId: string, note: string, min: number, max: number, perMonth: number]

const EXPENSES: Template[] = [
  ['food', 'Продукты', 600, 3200, 10],
  ['cafe', 'Кофе', 180, 420, 9],
  ['cafe', 'Обед', 450, 900, 5],
  ['cafe', 'Доставка еды', 900, 2100, 3],
  ['transport', 'Такси', 280, 900, 5],
  ['transport', 'Метро', 70, 70, 8],
  ['home', 'Интернет и связь', 1200, 1200, 1],
  ['home', 'Подписки', 299, 799, 2],
  ['shopping', 'Маркетплейс', 900, 4800, 2],
  ['health', 'Аптека', 300, 1400, 1],
  ['health', 'Фитнес', 2900, 2900, 1],
  ['fun', 'Кино', 500, 900, 1],
  ['fun', 'Игры', 600, 2500, 1],
  ['other', 'Разное', 200, 1500, 2],
]

// Детерминированный генератор, чтобы демо выглядело одинаково
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function monthDrafts(month: string, rand: () => number, upToDay: number): TxDraft[] {
  const out: TxDraft[] = []
  const days = daysInMonth(month)
  const lastDay = Math.max(1, Math.min(days, upToDay))
  const date = (d: number) => addDays(`${month}-01`, Math.min(d, lastDay) - 1)

  out.push({ type: 'income', amount: 9500000, categoryId: 'salary', note: 'Зарплата', date: date(5) })
  if (lastDay >= 20) out.push({ type: 'income', amount: 3800000, categoryId: 'salary', note: 'Аванс', date: date(20) })
  out.push({ type: 'income', amount: Math.round(8000 + rand() * 14000) * 100, categoryId: 'freelance', note: 'Заказ на фрилансе', date: date(12) })
  out.push({ type: 'income', amount: Math.round(300 + rand() * 900) * 100, categoryId: 'cashback', note: 'Кэшбэк', date: date(2) })
  out.push({ type: 'expense', amount: 3500000, categoryId: 'home', note: 'Аренда квартиры', date: date(3) })

  for (const [categoryId, note, min, max, perMonth] of EXPENSES) {
    const count = Math.max(0, Math.round((perMonth * lastDay) / days))
    for (let i = 0; i < count; i++) {
      const day = 1 + Math.floor(rand() * lastDay)
      const amount = Math.round(min + rand() * (max - min))
      out.push({ type: 'expense', amount: amount * 100, categoryId, note, date: date(day) })
    }
  }
  return out
}

export function generateDemo(): TxDraft[] {
  const rand = rng(42)
  const month = currentMonth()
  const prev = shiftMonth(month, -1)
  return [...monthDrafts(prev, rand, daysInMonth(prev)), ...monthDrafts(month, rand, elapsedDays(month))]
}

export const DEMO_BUDGETS: [string, number][] = [
  ['food', 2500000],
  ['cafe', 1200000],
  ['transport', 600000],
  ['shopping', 800000],
  ['fun', 400000],
]
