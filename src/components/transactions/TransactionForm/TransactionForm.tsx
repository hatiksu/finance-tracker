import { useEffect, useRef, useState } from 'react'
import { categoriesOf, categoryColor, fallbackCategory } from '../../../data/categories'
import { today } from '../../../lib/dates'
import { minorToInput, parseMoneyInput } from '../../../lib/money'
import type { Transaction, TxDraft, TxType } from '../../../types'
import { Icon } from '../../ui/Icon/Icon'
import { Segmented } from '../../ui/Segmented/Segmented'
import styles from './TransactionForm.module.css'

interface TransactionFormProps {
  /** Существующая операция (редактирование) или черновик (новая) */
  initial?: Transaction | Partial<TxDraft>
  currency: string
  onSubmit: (draft: TxDraft) => void
  onDelete?: () => void
}

const currencySymbol = (currency: string) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency

export function TransactionForm({ initial, currency, onSubmit, onDelete }: TransactionFormProps) {
  const [type, setType] = useState<TxType>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(initial?.amount ? minorToInput(initial.amount) : '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? fallbackCategory(initial?.type ?? 'expense'))
  const [note, setNote] = useState(initial?.note ?? '')
  const [date, setDate] = useState(initial?.date ?? today())
  const [error, setError] = useState('')
  const amountRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // На новой операции сразу ставим курсор в сумму
    if (!initial?.amount) {
      const t = setTimeout(() => amountRef.current?.focus(), 350)
      return () => clearTimeout(t)
    }
  }, [initial?.amount])

  const changeType = (next: TxType) => {
    setType(next)
    if (!categoriesOf(next).some((c) => c.id === categoryId)) setCategoryId(fallbackCategory(next))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const minor = parseMoneyInput(amount)
    if (!Number.isFinite(minor) || minor <= 0) {
      setError('Введите сумму больше нуля')
      amountRef.current?.focus()
      return
    }
    onSubmit({ type, amount: minor, categoryId, note: note.trim(), date })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <Segmented
        label="Тип операции"
        value={type}
        onChange={changeType}
        options={[
          { value: 'expense', label: 'Расход' },
          { value: 'income', label: 'Доход' },
        ]}
      />

      <label className={styles.amountField}>
        <span className="visually-hidden">Сумма</span>
        <input
          ref={amountRef}
          className={`${styles.amount} tabular`}
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value.replace(/[^\d.,\s]/g, ''))
            setError('')
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'amount-error' : undefined}
        />
        <span className={styles.currency}>{currencySymbol(currency)}</span>
      </label>
      {error && (
        <p id="amount-error" className={styles.error}>
          {error}
        </p>
      )}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Категория</legend>
        <div className={styles.categories}>
          {categoriesOf(type).map((c) => (
            <button
              key={c.id}
              type="button"
              className={`${styles.category} ${categoryId === c.id ? styles.categoryActive : ''}`}
              style={{ '--cat': categoryColor(c) } as React.CSSProperties}
              onClick={() => setCategoryId(c.id)}
              aria-pressed={categoryId === c.id}
            >
              <span className={styles.categoryEmoji}>{c.emoji}</span>
              <span className={styles.categoryName}>{c.name}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.legend}>Описание</span>
          <input className={styles.input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Например, кофе с собой" maxLength={80} />
        </label>
        <label className={`${styles.field} ${styles.dateField}`}>
          <span className={styles.legend}>Дата</span>
          <input className={styles.input} type="date" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
      </div>

      <div className={styles.actions}>
        {onDelete && (
          <button type="button" className={styles.delete} onClick={onDelete} aria-label="Удалить операцию">
            <Icon name="trash" size={20} />
          </button>
        )}
        <button type="submit" className={styles.submit}>
          {onDelete ? 'Сохранить' : 'Добавить'}
        </button>
      </div>
    </form>
  )
}
