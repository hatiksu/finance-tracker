import { describe, expect, it } from 'vitest'
import { transactionsToCSV } from './download'

describe('экспорт в CSV', () => {
  it('BOM, разделитель «;», знак суммы и экранирование', () => {
    const csv = transactionsToCSV(
      [
        { id: '1', type: 'expense', amount: 129990, categoryId: 'shopping', note: 'Наушники; беспроводные', date: '2026-11-09', createdAt: 1 },
        { id: '2', type: 'income', amount: 5000000, categoryId: 'salary', note: 'Зарплата "ноябрь"', date: '2026-11-05', createdAt: 2 },
      ],
      'RUB',
    )
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    const lines = csv.slice(1).split('\n')
    expect(lines[0]).toBe('Дата;Тип;Категория;Описание;Сумма (RUB)')
    expect(lines[1]).toBe('2026-11-09;Расход;Покупки;"Наушники; беспроводные";-1299,90')
    expect(lines[2]).toBe('2026-11-05;Доход;Зарплата;"Зарплата ""ноябрь""";50000,00')
  })
})
