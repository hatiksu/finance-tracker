import { createContext, useContext } from 'react'
import type { Settings, Transaction, TxDraft } from '../types'

export interface ToastOptions {
  action?: { label: string; onClick: () => void }
  tone?: 'default' | 'error'
}

export interface AppContextValue {
  settings: Settings
  month: string
  setMonth: (month: string) => void
  /** Открыть форму: новая операция (можно с черновиком) или редактирование существующей */
  openForm: (value?: Transaction | Partial<TxDraft>) => void
  toast: (message: string, options?: ToastOptions) => void
  navigate: (tab: TabId) => void
}

export type TabId = 'overview' | 'history' | 'budgets' | 'insights' | 'settings'

export const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp вызван вне AppContext')
  return ctx
}
