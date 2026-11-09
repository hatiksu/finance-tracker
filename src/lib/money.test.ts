import { describe, expect, it } from 'vitest'
import { formatMoney, minorToInput, parseMoneyInput } from './money'

// Intl ставит неразрывные пробелы — для сравнения заменяем их обычными
const norm = (s: string) => s.replace(/[  ]/g, ' ')

describe('formatMoney', () => {
  it('целые суммы — без копеек', () => {
    expect(norm(formatMoney(3500000, 'RUB'))).toBe('35 000 ₽')
  })

  it('копейки — всегда двумя цифрами', () => {
    expect(norm(formatMoney(129990, 'RUB'))).toBe('1 299,90 ₽')
    expect(norm(formatMoney(5, 'RUB'))).toBe('0,05 ₽')
  })

  it('знак для доходов и расходов', () => {
    expect(norm(formatMoney(35000, 'RUB', { sign: true }))).toBe('+350 ₽')
    expect(norm(formatMoney(-35000, 'RUB', { sign: true }))).toBe('−350 ₽')
    expect(norm(formatMoney(-35000, 'RUB'))).toBe('−350 ₽')
    expect(norm(formatMoney(0, 'RUB', { sign: true }))).toBe('0 ₽')
  })

  it('другие валюты', () => {
    expect(norm(formatMoney(150000, 'USD'))).toContain('1 500')
    expect(norm(formatMoney(150000, 'USD'))).toContain('$')
  })
})

describe('parseMoneyInput', () => {
  it.each([
    ['350', 35000],
    ['1 299,90', 129990],
    ['1299.9', 129990],
    ['0,5', 50],
  ])('«%s» → %i', (input, expected) => {
    expect(parseMoneyInput(input)).toBe(expected)
  })

  it.each(['', 'abc', '12,345', '1.2.3', '-5'])('«%s» — не число', (input) => {
    expect(parseMoneyInput(input)).toBeNaN()
  })

  it('обратное преобразование для поля ввода', () => {
    expect(minorToInput(129990)).toBe('1299,9')
    expect(parseMoneyInput(minorToInput(129990))).toBe(129990)
  })
})
