import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS } from './db'
import { getMonthTransactions } from './repo'
import type { Budget, Settings, Transaction } from '../types'

const EMPTY: Transaction[] = []

/** Операции за месяц (YYYY-MM), новые сверху. Обновляются автоматически. */
export function useMonthTransactions(month: string) {
  const rows = useLiveQuery(() => getMonthTransactions(month), [month])
  return {
    loading: rows === undefined,
    transactions: rows ? sortTx(rows) : EMPTY,
  }
}

export function useAllTransactions() {
  const rows = useLiveQuery(() => db.transactions.toArray(), [])
  return { loading: rows === undefined, transactions: rows ? sortTx(rows) : EMPTY }
}

export function useTransactionCount() {
  return useLiveQuery(() => db.transactions.count(), [])
}

export function useBudgets(): Map<string, number> {
  const rows = useLiveQuery(() => db.budgets.toArray(), [])
  return new Map((rows ?? ([] as Budget[])).map((b) => [b.categoryId, b.limit]))
}

export function useSettings(): Settings {
  const rows = useLiveQuery(() => db.settings.toArray(), [])
  const settings = { ...DEFAULT_SETTINGS }
  for (const row of rows ?? []) Object.assign(settings, { [row.key]: row.value })
  return settings
}

function sortTx(rows: Transaction[]) {
  return [...rows].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
}
