import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { parseQuickInput } from './parse'

// Фиксируем «сегодня», чтобы проверять «вчера» и «позавчера»
beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 9, 12, 0))
})
afterAll(() => {
  vi.useRealTimers()
})

describe('parseQuickInput', () => {
  it.each([
    ['кофе 350', 'expense', 35000, 'cafe', 'Кофе', '2026-11-09'],
    ['такси 420 вчера', 'expense', 42000, 'transport', 'Такси', '2026-11-08'],
    ['кино 600 руб позавчера', 'expense', 60000, 'fun', 'Кино', '2026-11-07'],
    ['+50000 зарплата', 'income', 5000000, 'salary', 'Зарплата', '2026-11-09'],
    ['зп 120к', 'income', 12000000, 'salary', 'Зп', '2026-11-09'],
    ['продукты в пятёрочке 1 234,50 ₽', 'expense', 123450, 'food', 'Продукты в пятёрочке', '2026-11-09'],
    ['аренда 35 000р', 'expense', 3500000, 'home', 'Аренда', '2026-11-09'],
    ['обед 2.5к', 'expense', 250000, 'cafe', 'Обед', '2026-11-09'],
    ['кэшбэк 312', 'income', 31200, 'cashback', 'Кэшбэк', '2026-11-09'],
  ])('«%s»', (input, type, amount, categoryId, note, date) => {
    const r = parseQuickInput(input)
    expect(r).not.toBeNull()
    expect(r!.draft).toEqual({ type, amount, categoryId, note, date })
    expect(r!.confident).toBe(true)
  })

  it('без суммы возвращает null', () => {
    expect(parseQuickInput('просто текст')).toBeNull()
    expect(parseQuickInput('')).toBeNull()
  })

  it('незнакомая трата попадает в «Другое» и помечается как неуверенная', () => {
    const r = parseQuickInput('штуковина 999')
    expect(r!.draft.categoryId).toBe('other')
    expect(r!.confident).toBe(false)
  })

  it('«+» без ключевого слова — доход в «Другой доход»', () => {
    const r = parseQuickInput('+1500')
    expect(r!.draft.type).toBe('income')
    expect(r!.draft.categoryId).toBe('other-in')
  })

  it('ноль не считается суммой', () => {
    expect(parseQuickInput('кофе 0')).toBeNull()
  })
})
