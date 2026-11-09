import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { AppContext, type AppContextValue, type TabId, type ToastOptions } from './app/AppContext'
import { TabBar } from './components/layout/TabBar/TabBar'
import { TransactionForm } from './components/transactions/TransactionForm/TransactionForm'
import { Sheet } from './components/ui/Sheet/Sheet'
import { Toast, type ToastItem } from './components/ui/Toast/Toast'
import { getCategory } from './data/categories'
import { useSettings } from './db/hooks'
import { addTransactions, deleteTransaction, restoreTransaction, updateTransaction } from './db/repo'
import { useTheme } from './hooks/useTheme'
import { currentMonth } from './lib/dates'
import { formatMoney } from './lib/money'
import { Budgets } from './screens/Budgets/Budgets'
import { History } from './screens/History/History'
import { Insights } from './screens/Insights/Insights'
import { Overview } from './screens/Overview/Overview'
import { Settings } from './screens/Settings/Settings'
import type { Transaction, TxDraft } from './types'
import styles from './App.module.css'

const TABS: TabId[] = ['overview', 'history', 'budgets', 'insights', 'settings']
const tabFromHash = (): TabId => {
  const h = location.hash.slice(1) as TabId
  return TABS.includes(h) ? h : 'overview'
}

const SCREENS: Record<TabId, () => React.JSX.Element> = {
  overview: Overview,
  history: History,
  budgets: Budgets,
  insights: Insights,
  settings: Settings,
}

type FormState = { open: false } | { open: true; value?: Transaction | Partial<TxDraft> }

export default function App() {
  const settings = useSettings()
  useTheme(settings.theme)

  const [tab, setTab] = useState<TabId>(tabFromHash)
  const [month, setMonth] = useState(currentMonth)
  const [form, setForm] = useState<FormState>({ open: false })
  const [toastItem, setToastItem] = useState<ToastItem | null>(null)
  const toastTimer = useRef<number>(undefined)

  // Вкладка хранится в адресе (#history), чтобы работала кнопка «Назад» на Android
  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = useCallback((next: TabId) => {
    if (location.hash.slice(1) !== next) location.hash = next
    setTab(next)
    window.scrollTo({ top: 0 })
  }, [])

  const toast = useCallback((message: string, options: ToastOptions = {}) => {
    window.clearTimeout(toastTimer.current)
    setToastItem({ id: Date.now(), message, ...options })
    toastTimer.current = window.setTimeout(() => setToastItem(null), options.action ? 5000 : 3000)
  }, [])

  const openForm = useCallback((value?: Transaction | Partial<TxDraft>) => setForm({ open: true, value }), [])
  const closeForm = useCallback(() => setForm({ open: false }), [])

  // Обновления PWA и готовность к работе без сети
  const updateRef = useRef<(reload?: boolean) => Promise<void>>(undefined)
  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh: () => toast('Доступна новая версия', { action: { label: 'Обновить', onClick: () => updateRef.current?.(true) } }),
    onOfflineReady: () => toast('Приложение готово к работе без интернета'),
  })
  useEffect(() => {
    updateRef.current = updateServiceWorker
  }, [updateServiceWorker])

  useEffect(() => {
    const onOffline = () => toast('Нет сети — всё работает, данные сохраняются на устройстве')
    window.addEventListener('offline', onOffline)
    return () => window.removeEventListener('offline', onOffline)
  }, [toast])

  const editing = form.open && form.value && 'id' in form.value ? (form.value as Transaction) : null

  const submitForm = async (draft: TxDraft) => {
    if (editing) {
      await updateTransaction({ ...editing, ...draft })
      toast('Изменения сохранены')
    } else {
      const [row] = await addTransactions([draft])
      const c = getCategory(row.categoryId)
      toast(`${c.emoji} ${row.note || c.name} · ${formatMoney(row.amount, settings.currency)}`, {
        action: { label: 'Отменить', onClick: () => deleteTransaction(row.id) },
      })
      // Если добавили операцию за другой месяц — показываем его
      if (!row.date.startsWith(month)) setMonth(row.date.slice(0, 7))
    }
    closeForm()
  }

  const removeEditing = async () => {
    if (!editing) return
    await deleteTransaction(editing.id)
    closeForm()
    toast('Операция удалена', { action: { label: 'Вернуть', onClick: () => restoreTransaction(editing) } })
  }

  const ctx = useMemo<AppContextValue>(
    () => ({ settings, month, setMonth, openForm, toast, navigate }),
    [settings, month, openForm, toast, navigate],
  )

  const Screen = SCREENS[tab]

  return (
    <MotionConfig reducedMotion="user">
      <AppContext.Provider value={ctx}>
        <main className={styles.main}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <Screen />
            </motion.div>
          </AnimatePresence>
        </main>

        <TabBar active={tab === 'settings' ? 'overview' : tab} onChange={navigate} onAdd={() => openForm()} />

        <Sheet open={form.open} title={editing ? 'Редактирование' : 'Новая операция'} onClose={closeForm}>
          {form.open && (
            <TransactionForm
              key={editing?.id ?? 'new'}
              initial={form.value}
              currency={settings.currency}
              onSubmit={submitForm}
              onDelete={editing ? removeEditing : undefined}
            />
          )}
        </Sheet>

        <Toast toast={toastItem} onDismiss={() => setToastItem(null)} />
      </AppContext.Provider>
    </MotionConfig>
  )
}
