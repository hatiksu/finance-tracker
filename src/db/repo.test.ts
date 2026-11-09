import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { addTransactions, clearAll, exportBackup, getMonthTransactions, importBackup, setBudget } from './repo'

beforeEach(async () => {
  await clearAll()
})

describe('хранилище', () => {
  it('добавляет операции и выбирает их по месяцу', async () => {
    await addTransactions([
      { type: 'expense', amount: 100, categoryId: 'food', note: '', date: '2026-11-01' },
      { type: 'expense', amount: 200, categoryId: 'food', note: '', date: '2026-11-30' },
      { type: 'expense', amount: 300, categoryId: 'food', note: '', date: '2026-12-01' },
    ])
    const nov = await getMonthTransactions('2026-11')
    expect(nov.map((t) => t.amount).sort()).toEqual([100, 200])
  })

  it('нулевой лимит удаляет бюджет', async () => {
    await setBudget({ categoryId: 'cafe', limit: 5000 })
    expect(await db.budgets.get('cafe')).toEqual({ categoryId: 'cafe', limit: 5000 })
    await setBudget({ categoryId: 'cafe', limit: 0 })
    expect(await db.budgets.get('cafe')).toBeUndefined()
  })

  it('резервная копия: экспорт → очистка → импорт', async () => {
    await addTransactions([{ type: 'income', amount: 999, categoryId: 'salary', note: 'ЗП', date: '2026-11-05' }])
    await setBudget({ categoryId: 'food', limit: 100 })
    const backup = await exportBackup('RUB')
    await clearAll()
    expect(await db.transactions.count()).toBe(0)

    expect(await importBackup(JSON.parse(JSON.stringify(backup)))).toBe(1)
    expect(await db.transactions.count()).toBe(1)
    expect(await db.budgets.get('food')).toEqual({ categoryId: 'food', limit: 100 })
  })

  it('импорт отбрасывает битые записи и чужие файлы', async () => {
    await expect(importBackup({ hello: 'world' })).rejects.toThrow('резервной копии')
    const n = await importBackup({
      app: 'finance-tracker',
      version: 1,
      transactions: [
        { id: 'ok', type: 'expense', amount: 1, categoryId: 'food', note: '', date: '2026-11-01', createdAt: 1 },
        { id: 'bad-date', type: 'expense', amount: 1, categoryId: 'food', note: '', date: 'вчера', createdAt: 1 },
        { id: 'bad-amount', type: 'expense', amount: 'много', categoryId: 'food', note: '', date: '2026-11-01', createdAt: 1 },
      ],
    })
    expect(n).toBe(1)
  })
})
