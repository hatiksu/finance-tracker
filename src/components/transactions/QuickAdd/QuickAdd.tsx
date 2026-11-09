import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useApp } from '../../../app/AppContext'
import { getCategory } from '../../../data/categories'
import { addTransactions, deleteTransaction } from '../../../db/repo'
import { formatMoney } from '../../../lib/money'
import { parseQuickInput } from '../../../lib/parse'
import { Icon } from '../../ui/Icon/Icon'
import styles from './QuickAdd.module.css'

/**
 * Быстрый ввод одной строкой: «кофе 350», «такси 420 вчера», «+50000 зарплата».
 * Простые фразы распознаются локально; для сложных («вчера заправился на 2500 и купил воды за 80»)
 * есть кнопка ИИ.
 */
export function QuickAdd() {
  const { settings, toast, openForm, navigate } = useApp()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const preview = text.trim() ? parseQuickInput(text) : null

  const saved = async (drafts: Parameters<typeof addTransactions>[0]) => {
    const rows = await addTransactions(drafts)
    setText('')
    const first = rows[0]
    const label =
      rows.length === 1
        ? `${getCategory(first.categoryId).emoji} ${first.note || getCategory(first.categoryId).name} · ${formatMoney(first.amount, settings.currency)}`
        : `Добавлено операций: ${rows.length}`
    toast(label, {
      action: { label: 'Отменить', onClick: () => rows.forEach((r) => deleteTransaction(r.id)) },
    })
  }

  const submitLocal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    if (preview) await saved([preview.draft])
    else openForm({ note: text.trim() })
  }

  const submitAI = async () => {
    if (!text.trim() || busy) return
    if (!settings.apiKey) {
      toast('Добавьте API-ключ Anthropic в настройках', { action: { label: 'Открыть', onClick: () => navigate('settings') } })
      return
    }
    setBusy(true)
    try {
      const { parseWithAI } = await import('../../../lib/ai')
      const drafts = await parseWithAI(settings.apiKey, text)
      if (!drafts.length) toast('ИИ не нашёл в тексте сумм', { tone: 'error' })
      else await saved(drafts)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Ошибка ИИ', { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={styles.quick} onSubmit={submitLocal}>
      <div className={styles.field}>
        <input
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="кофе 350 · такси 420 вчера · +50000 зп"
          aria-label="Быстрый ввод операции"
          enterKeyHint="done"
          autoComplete="off"
        />
        <button
          type="button"
          className={`${styles.ai} ${busy ? styles.busy : ''}`}
          onClick={submitAI}
          disabled={!text.trim() || busy}
          aria-label="Распознать с помощью ИИ"
          title="Распознать с помощью ИИ (можно несколько трат в одной фразе)"
        >
          <Icon name="sparkles" size={20} />
        </button>
        <button type="submit" className={styles.send} disabled={!text.trim() || busy} aria-label="Добавить">
          <Icon name="send" size={20} />
        </button>
      </div>

      <AnimatePresence>
        {preview && (
          <motion.p
            className={styles.preview}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {getCategory(preview.draft.categoryId).emoji} {getCategory(preview.draft.categoryId).name} ·{' '}
            <strong className="tabular">
              {preview.draft.type === 'income' ? '+' : '−'}
              {formatMoney(preview.draft.amount, settings.currency)}
            </strong>
            {!preview.confident && <span className={styles.hint}> — категорию не узнал, попробуйте ✨</span>}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  )
}
