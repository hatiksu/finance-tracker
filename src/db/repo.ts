// Операции с данными. Компоненты не обращаются к Dexie напрямую.
import { db } from './db'
import type { Budget, Settings, Transaction, TxDraft } from '../types'
import { monthRange } from '../lib/dates'

export async function addTransactions(drafts: TxDraft[]): Promise<Transaction[]> {
  const now = Date.now()
  const rows = drafts.map((d, i) => ({ ...d, id: crypto.randomUUID(), createdAt: now + i }))
  await db.transactions.bulkAdd(rows)
  return rows
}

export function updateTransaction(tx: Transaction) {
  return db.transactions.put(tx)
}

export function deleteTransaction(id: string) {
  return db.transactions.delete(id)
}

export function restoreTransaction(tx: Transaction) {
  return db.transactions.put(tx)
}

export function getMonthTransactions(month: string) {
  const [from, to] = monthRange(month)
  return db.transactions.where('date').between(from, to, true, true).toArray()
}

export function setBudget(budget: Budget) {
  if (budget.limit <= 0) return db.budgets.delete(budget.categoryId)
  return db.budgets.put(budget)
}

export function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  return db.settings.put({ key, value })
}

export interface Backup {
  app: 'finance-tracker'
  version: 1
  exportedAt: string
  transactions: Transaction[]
  budgets: Budget[]
  currency: string
}

export async function exportBackup(currency: string): Promise<Backup> {
  const [transactions, budgets] = await Promise.all([db.transactions.toArray(), db.budgets.toArray()])
  return { app: 'finance-tracker', version: 1, exportedAt: new Date().toISOString(), transactions, budgets, currency }
}

export async function importBackup(data: unknown): Promise<number> {
  const b = data as Partial<Backup>
  if (b?.app !== 'finance-tracker' || !Array.isArray(b.transactions)) {
    throw new Error('Это не файл резервной копии трекера')
  }
  const valid = b.transactions.filter(
    (t) => t && typeof t.id === 'string' && Number.isFinite(t.amount) && /^\d{4}-\d{2}-\d{2}$/.test(t.date),
  )
  await db.transaction('rw', db.transactions, db.budgets, db.settings, async () => {
    await db.transactions.bulkPut(valid)
    if (Array.isArray(b.budgets)) await db.budgets.bulkPut(b.budgets)
    if (typeof b.currency === 'string') await db.settings.put({ key: 'currency', value: b.currency })
  })
  return valid.length
}

export async function clearAll() {
  await db.transaction('rw', db.transactions, db.budgets, async () => {
    await db.transactions.clear()
    await db.budgets.clear()
  })
}

/** Заполняет базу демо-данными за текущий и прошлый месяц. */
export async function loadDemo() {
  const { generateDemo, DEMO_BUDGETS } = await import('../lib/demo')
  await addTransactions(generateDemo())
  await db.budgets.bulkPut(DEMO_BUDGETS.map(([categoryId, limit]) => ({ categoryId, limit })))
}
