// Работа с датами в локальном часовом поясе. Даты хранятся строками YYYY-MM-DD.

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const today = () => toISODate(new Date())

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Текущий месяц в формате YYYY-MM */
export const currentMonth = () => today().slice(0, 7)

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** Первый и последний день месяца (включительно) */
export function monthRange(month: string): [string, string] {
  return [`${month}-01`, `${month}-${pad(daysInMonth(month))}`]
}

const monthFmt = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })
const dayFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const weekdayFmt = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' })

export function formatMonth(month: string): string {
  const s = monthFmt.format(parseISODate(`${month}-01`)).replace(' г.', '')
  return s[0].toUpperCase() + s.slice(1)
}

export function formatDayLabel(iso: string): string {
  if (iso === today()) return 'Сегодня'
  if (iso === addDays(today(), -1)) return 'Вчера'
  const d = parseISODate(iso)
  return `${dayFmt.format(d)}, ${weekdayFmt.format(d)}`
}

export const formatShortDay = (iso: string) => dayFmt.format(parseISODate(iso))
