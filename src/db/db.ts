import Dexie, { type EntityTable } from 'dexie'
import type { Budget, Settings, Transaction } from '../types'

interface SettingRow {
  key: keyof Settings
  value: Settings[keyof Settings]
}

/** Локальная база в IndexedDB: данные не покидают устройство. */
export const db = new Dexie('finance-tracker') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>
  budgets: EntityTable<Budget, 'categoryId'>
  settings: EntityTable<SettingRow, 'key'>
}

db.version(1).stores({
  transactions: 'id, date, type, categoryId, createdAt',
  budgets: 'categoryId',
  settings: 'key',
})

export const DEFAULT_SETTINGS: Settings = {
  currency: 'RUB',
  theme: 'system',
  apiKey: '',
}

export type { SettingRow }
