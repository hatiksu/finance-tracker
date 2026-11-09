import { useRef, useState } from 'react'
import { useApp } from '../../app/AppContext'
import { ScreenHeader } from '../../components/layout/ScreenHeader/ScreenHeader'
import { Button } from '../../components/ui/Button/Button'
import { Card } from '../../components/ui/Card/Card'
import { Icon } from '../../components/ui/Icon/Icon'
import { Segmented } from '../../components/ui/Segmented/Segmented'
import { db } from '../../db/db'
import { useTransactionCount } from '../../db/hooks'
import { clearAll, exportBackup, importBackup, loadDemo, saveSetting } from '../../db/repo'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { today } from '../../lib/dates'
import { downloadFile, transactionsToCSV } from '../../lib/download'
import { CURRENCIES } from '../../lib/money'
import type { ThemeSetting } from '../../types'
import ui from '../screen.module.css'
import styles from './Settings.module.css'

export function Settings() {
  const { settings, toast, navigate } = useApp()
  const count = useTransactionCount() ?? 0
  const install = useInstallPrompt()
  const [key, setKey] = useState(settings.apiKey)
  const [keyVisible, setKeyVisible] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const saveKey = async () => {
    await saveSetting('apiKey', key.trim())
    toast(key.trim() ? 'Ключ сохранён на этом устройстве' : 'Ключ удалён')
  }

  const exportJSON = async () => {
    const backup = await exportBackup(settings.currency)
    downloadFile(`finance-backup-${today()}.json`, JSON.stringify(backup, null, 2), 'application/json')
  }

  const exportCSV = async () => {
    const txs = await db.transactions.orderBy('date').reverse().toArray()
    downloadFile(`finance-${today()}.csv`, transactionsToCSV(txs, settings.currency), 'text/csv;charset=utf-8')
  }

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const n = await importBackup(JSON.parse(await file.text()))
      toast(`Импортировано операций: ${n}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Не удалось прочитать файл', { tone: 'error' })
    }
  }

  const reset = async () => {
    if (!confirm(`Удалить все операции (${count}) и бюджеты? Это нельзя отменить. Сначала можно сохранить резервную копию.`)) return
    await clearAll()
    toast('Все данные удалены')
  }

  const demo = async () => {
    await loadDemo()
    toast('Добавлены демо-данные за 2 месяца')
    navigate('overview')
  }

  return (
    <div className={ui.screen}>
      <ScreenHeader
        title="Настройки"
        right={
          <button type="button" className={ui.iconButton} onClick={() => navigate('overview')} aria-label="Закрыть настройки">
            <Icon name="close" />
          </button>
        }
      />

      {!install.installed && (
        <Card title="📲 Установить на телефон">
          {install.canPrompt ? (
            <>
              <p className={styles.text}>Приложение появится на главном экране и будет работать без интернета.</p>
              <Button variant="primary" onClick={install.install}>
                Установить
              </Button>
            </>
          ) : install.ios ? (
            <ol className={styles.steps}>
              <li>
                Откройте сайт в <strong>Safari</strong>
              </li>
              <li>
                Нажмите <Icon name="share" size={16} className={styles.inlineIcon} /> <strong>Поделиться</strong>
              </li>
              <li>
                Выберите <strong>«На экран „Домой“»</strong>
              </li>
            </ol>
          ) : (
            <p className={styles.text}>Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран».</p>
          )}
        </Card>
      )}

      <Card title="Внешний вид">
        <div className={styles.field}>
          <span className={styles.label}>Тема</span>
          <Segmented<ThemeSetting>
            label="Тема"
            value={settings.theme}
            onChange={(v) => saveSetting('theme', v)}
            options={[
              { value: 'system', label: 'Авто' },
              { value: 'light', label: 'Светлая' },
              { value: 'dark', label: 'Тёмная' },
            ]}
          />
        </div>
        <label className={styles.field}>
          <span className={styles.label}>Валюта</span>
          <select className={styles.select} value={settings.currency} onChange={(e) => saveSetting('currency', e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </Card>

      <Card title="✨ ИИ-помощник">
        <p className={styles.text}>
          Нужен для распознавания сложных фраз («вчера заправился на 2500 и купил воды за 80») и разбора месяца. Ключ хранится только
          на этом устройстве и отправляется напрямую в Anthropic.
        </p>
        <div className={styles.keyRow}>
          <input
            className={styles.input}
            type={keyVisible ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-ant-…"
            autoComplete="off"
            aria-label="API-ключ Anthropic"
          />
          <button type="button" className={styles.toggle} onClick={() => setKeyVisible((v) => !v)}>
            {keyVisible ? 'Скрыть' : 'Показать'}
          </button>
        </div>
        <Button variant="primary" onClick={saveKey} disabled={key.trim() === settings.apiKey}>
          Сохранить ключ
        </Button>
      </Card>

      <Card title="Данные">
        <p className={styles.text}>
          Все операции хранятся только на этом устройстве ({count} шт.). Делайте резервную копию, чтобы не потерять их при очистке браузера.
        </p>
        <div className={styles.buttons}>
          <Button onClick={exportJSON} icon={<Icon name="download" size={18} />} disabled={!count}>
            Резервная копия
          </Button>
          <Button onClick={() => fileRef.current?.click()} icon={<Icon name="upload" size={18} />}>
            Восстановить
          </Button>
          <Button onClick={exportCSV} icon={<Icon name="download" size={18} />} disabled={!count}>
            Экспорт в CSV
          </Button>
          <Button onClick={demo}>Демо-данные</Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
        <Button variant="danger" block onClick={reset} disabled={!count} icon={<Icon name="trash" size={18} />}>
          Удалить все данные
        </Button>
      </Card>

      <p className={styles.about}>Финансы · v1.0 · данные не покидают устройство</p>
    </div>
  )
}
