export type TxType = 'expense' | 'income'

export interface Transaction {
  id: string
  type: TxType
  /** Сумма в минимальных единицах (копейках, центах), всегда положительная */
  amount: number
  categoryId: string
  note: string
  /** Дата операции в формате YYYY-MM-DD */
  date: string
  createdAt: number
}

export interface Category {
  id: string
  type: TxType
  name: string
  emoji: string
  /** Номер слота категориальной палитры (1–7) или 0 — нейтральный серый */
  slot: number
  /** Ключевые слова для распознавания из быстрого ввода */
  keywords: string[]
}

export interface Budget {
  categoryId: string
  /** Лимит на месяц в минимальных единицах */
  limit: number
}

export type ThemeSetting = 'system' | 'light' | 'dark'

export interface Settings {
  currency: string
  theme: ThemeSetting
  apiKey: string
}

/** Черновик операции (результат распознавания текста) */
export type TxDraft = Omit<Transaction, 'id' | 'createdAt'>
