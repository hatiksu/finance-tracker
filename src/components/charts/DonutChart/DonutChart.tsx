import { useState } from 'react'
import { motion } from 'motion/react'
import { categoryColor } from '../../../data/categories'
import { formatMoney } from '../../../lib/money'
import type { CategorySlice } from '../../../lib/stats'
import styles from './DonutChart.module.css'

interface DonutChartProps {
  slices: CategorySlice[]
  total: number
  currency: string
  label: string
}

const SIZE = 220
const R_OUTER = 104
const R_INNER = 74
const C = SIZE / 2

function polar(r: number, angle: number) {
  return [C + r * Math.cos(angle), C + r * Math.sin(angle)]
}

/** Путь сектора кольца от угла a0 до a1 (радианы, 0 — вверх). */
function arcPath(a0: number, a1: number) {
  const start = a0 - Math.PI / 2
  const end = a1 - Math.PI / 2
  const large = end - start > Math.PI ? 1 : 0
  const [x0, y0] = polar(R_OUTER, start)
  const [x1, y1] = polar(R_OUTER, end)
  const [x2, y2] = polar(R_INNER, end)
  const [x3, y3] = polar(R_INNER, start)
  return `M${x0} ${y0}A${R_OUTER} ${R_OUTER} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${R_INNER} ${R_INNER} 0 ${large} 0 ${x3} ${y3}Z`
}

const pct = (share: number) => `${share < 0.01 ? '<1' : Math.round(share * 100)}%`

/** Кольцевая диаграмма расходов по категориям с легендой-таблицей. Тап по сектору или строке выделяет категорию. */
export function DonutChart({ slices, total, currency, label }: DonutChartProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const active = slices.find((s) => s.category.id === selected) ?? null

  // Накопительные углы секторов
  const arcs: { slice: CategorySlice; d: string }[] = []
  for (let i = 0, angle = 0; i < slices.length; i++) {
    const sweep = Math.max(slices[i].share * Math.PI * 2, 0.0001)
    // Полный круг путём дуги не нарисовать — чуть укорачиваем
    arcs.push({ slice: slices[i], d: arcPath(angle, angle + Math.min(sweep, Math.PI * 2 - 0.0001)) })
    angle += sweep
  }

  const toggle = (id: string) => setSelected((cur) => (cur === id ? null : id))

  return (
    <div className={styles.root}>
      <div className={styles.chart}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.svg} role="img" aria-label={label}>
          <circle cx={C} cy={C} r={(R_OUTER + R_INNER) / 2} fill="none" stroke="var(--surface-2)" strokeWidth={R_OUTER - R_INNER} />
          {arcs.map(({ slice, d }, i) => {
            const dim = active && active.category.id !== slice.category.id
            return (
              <motion.path
                key={slice.category.id}
                d={d}
                fill={categoryColor(slice.category)}
                stroke="var(--surface)"
                strokeWidth={2}
                strokeLinejoin="round"
                className={styles.arc}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: dim ? 0.28 : 1, scale: active?.category.id === slice.category.id ? 1.04 : 1 }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: `${C}px ${C}px` }}
                onClick={() => toggle(slice.category.id)}
              />
            )
          })}
        </svg>
        <div className={styles.center} aria-live="polite">
          {active ? (
            <>
              <span className={styles.centerEmoji}>{active.category.emoji}</span>
              <strong className={`${styles.centerValue} tabular`}>{formatMoney(active.amount, currency, { compact: active.amount >= 10_000_000 })}</strong>
              <span className={styles.centerLabel}>
                {active.category.name} · {pct(active.share)}
              </span>
            </>
          ) : (
            <>
              <span className={styles.centerLabel}>Всего расходов</span>
              <strong className={`${styles.centerValue} tabular`}>{formatMoney(total, currency, { compact: total >= 10_000_000 })}</strong>
            </>
          )}
        </div>
      </div>

      <ul className={styles.legend}>
        {slices.map((s) => (
          <li key={s.category.id}>
            <button
              type="button"
              className={`${styles.row} ${selected === s.category.id ? styles.rowActive : ''}`}
              onClick={() => toggle(s.category.id)}
              aria-pressed={selected === s.category.id}
            >
              <span className={styles.swatch} style={{ background: categoryColor(s.category) }} />
              <span className={styles.name}>
                {s.category.emoji} {s.category.name}
              </span>
              <span className={`${styles.share} tabular`}>{pct(s.share)}</span>
              <span className={`${styles.amount} tabular`}>{formatMoney(s.amount, currency)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
