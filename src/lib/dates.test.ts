import { describe, expect, it } from 'vitest'
import { addDays, daysInMonth, formatMonth, monthRange, parseISODate, shiftMonth, toISODate } from './dates'

describe('даты', () => {
  it('toISODate / parseISODate — в локальном поясе и обратно', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toISODate(parseISODate('2026-12-31'))).toBe('2026-12-31')
  })

  it('addDays переходит через границы месяца и года', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('shiftMonth', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-05', 0)).toBe('2026-05')
  })

  it('daysInMonth учитывает високосный год', () => {
    expect(daysInMonth('2024-02')).toBe(29)
    expect(daysInMonth('2026-02')).toBe(28)
    expect(daysInMonth('2026-11')).toBe(30)
  })

  it('monthRange', () => {
    expect(monthRange('2026-02')).toEqual(['2026-02-01', '2026-02-28'])
  })

  it('formatMonth — с заглавной буквы', () => {
    expect(formatMonth('2026-11')).toBe('Ноябрь 2026')
  })
})
