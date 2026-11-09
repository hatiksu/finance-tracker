// Сохранение файлов: JSON-резервная копия и CSV для Excel/Google Таблиц.
import { getCategory } from '../data/categories'
import type { Transaction } from '../types'

export function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

const csvCell = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

/** CSV с разделителем «;» и BOM — корректно открывается в Excel с русскими буквами. */
export function transactionsToCSV(txs: Transaction[], currency: string): string {
  const header = ['Дата', 'Тип', 'Категория', 'Описание', `Сумма (${currency})`]
  const rows = txs.map((t) => [
    t.date,
    t.type === 'income' ? 'Доход' : 'Расход',
    getCategory(t.categoryId).name,
    t.note,
    ((t.type === 'income' ? 1 : -1) * t.amount / 100).toFixed(2).replace('.', ','),
  ])
  return '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(';')).join('\n')
}
