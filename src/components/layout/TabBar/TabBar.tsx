import { motion } from 'motion/react'
import type { TabId } from '../../../app/AppContext'
import { Icon, type IconName } from '../../ui/Icon/Icon'
import styles from './TabBar.module.css'

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'overview', label: 'Обзор', icon: 'home' },
  { id: 'history', label: 'История', icon: 'list' },
  { id: 'budgets', label: 'Бюджеты', icon: 'target' },
  { id: 'insights', label: 'ИИ', icon: 'sparkles' },
]

interface TabBarProps {
  active: TabId
  onChange: (tab: TabId) => void
  onAdd: () => void
}

/** Нижняя навигация с центральной кнопкой «Добавить». */
export function TabBar({ active, onChange, onAdd }: TabBarProps) {
  const renderTab = (tab: (typeof TABS)[number]) => {
    const isActive = active === tab.id
    return (
      <button
        key={tab.id}
        type="button"
        className={`${styles.tab} ${isActive ? styles.active : ''}`}
        onClick={() => onChange(tab.id)}
        aria-current={isActive ? 'page' : undefined}
      >
        {isActive && <motion.span layoutId="tab-indicator" className={styles.indicator} transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
        <Icon name={tab.icon} size={22} />
        <span className={styles.label}>{tab.label}</span>
      </button>
    )
  }

  return (
    <nav className={styles.bar} aria-label="Разделы">
      <div className={styles.inner}>
        {TABS.slice(0, 2).map(renderTab)}
        <motion.button
          type="button"
          className={styles.add}
          onClick={onAdd}
          aria-label="Добавить операцию"
          whileTap={{ scale: 0.9 }}
        >
          <Icon name="plus" size={26} strokeWidth={2.4} />
        </motion.button>
        {TABS.slice(2).map(renderTab)}
      </div>
    </nav>
  )
}
