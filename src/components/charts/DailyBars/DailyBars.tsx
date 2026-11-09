import { useState } from 'react'
import { motion } from 'motion/react'
import { formatShortDay, today } from '../../../lib/dates'
import { formatMoney } from '../../../lib/money'
import styles from './DailyBars.module.css'

interface DailyBarsProps {
  month: string
  values: number[]
  currency: string
  /** Сколько дней уже прошло — по ним считается среднее */
  elapsed: number
}

const W = 340
const H = 150
const PAD_TOP = 10
const PAD_BOTTOM = 20
const RADIUS = 4

/** Красивый «потолок» шкалы: 1, 2, 2.5, 5 × 10^n */
function niceMax(v: number) {
  if (v <= 0) return 1
  const pow = 10 ** Math.floor(Math.log10(v))
  for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= v) return m * pow
  return 10 * pow
}

/** Столбик со скруглённым верхом, прижатый к базовой линии. */
function barPath(x: number, w: number, h: number, base: number) {
  if (h <= 0) return ''
  const r = Math.min(RADIUS, w / 2, h)
  const top = base - h
  return `M${x} ${base}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + w - r}Q${x + w} ${top} ${x + w} ${top + r}V${base}Z`
}

/** Расходы по дням месяца. Тап по столбику показывает сумму за день. */
export function DailyBars({ month, values, currency, elapsed }: DailyBarsProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const max = niceMax(Math.max(...values))
  const base = H - PAD_BOTTOM
  const plotH = base - PAD_TOP
  const slot = W / values.length
  const gap = 2
  const barW = Math.max(2, slot - gap)
  const todayIdx = today().startsWith(month) ? Number(today().slice(8, 10)) - 1 : -1
  const avg = elapsed ? values.slice(0, elapsed).reduce((a, b) => a + b, 0) / elapsed : 0
  const avgY = base - (avg / max) * plotH

  const shown = selected ?? (todayIdx >= 0 ? todayIdx : null)
  const dateOf = (i: number) => `${month}-${String(i + 1).padStart(2, '0')}`

  return (
    <div className={styles.root}>
      <div className={styles.readout} aria-live="polite">
        {shown !== null ? (
          <>
            <span className={styles.readoutLabel}>{selected === null ? 'Сегодня' : formatShortDay(dateOf(shown))}</span>
            <strong className="tabular">{formatMoney(values[shown], currency)}</strong>
          </>
        ) : (
          <span className={styles.readoutLabel}>Нажмите на столбик, чтобы увидеть сумму</span>
        )}
        {avg > 0 && (
          <span className={styles.avg}>
            <i className={styles.avgLine} /> в среднем {formatMoney(Math.round(avg / 100) * 100, currency)}/день
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={`Расходы по дням, максимум за день ${formatMoney(Math.max(...values), currency)}`}>
        {[0.5, 1].map((f) => (
          <g key={f}>
            <line x1={0} x2={W} y1={base - f * plotH} y2={base - f * plotH} stroke="var(--grid)" strokeWidth={1} />
            <text x={W} y={base - f * plotH - 3} textAnchor="end" className={styles.axis}>
              {formatMoney(max * f, currency, { compact: true })}
            </text>
          </g>
        ))}
        <line x1={0} x2={W} y1={base} y2={base} stroke="var(--border-strong)" strokeWidth={1} />

        {values.map((v, i) => {
          const h = (v / max) * plotH
          const x = i * slot + gap / 2
          const isSel = shown === i
          return (
            <g key={i}>
              <motion.path
                d={barPath(x, barW, Math.max(h, v > 0 ? 2 : 0), base)}
                fill="var(--series-1)"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: shown === null || isSel ? 1 : 0.45, scaleY: 1 }}
                transition={{ duration: 0.5, delay: i * 0.012, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: `0px ${base}px` }}
              />
              {/* Широкая невидимая зона нажатия — больше самого столбика */}
              <rect
                x={i * slot}
                y={0}
                width={slot}
                height={H}
                fill="transparent"
                className={styles.hit}
                onClick={() => setSelected((cur) => (cur === i ? null : i))}
              >
                <title>{`${formatShortDay(dateOf(i))}: ${formatMoney(v, currency)}`}</title>
              </rect>
            </g>
          )
        })}

        {avg > 0 && <line x1={0} x2={W} y1={avgY} y2={avgY} stroke="var(--text-2)" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} />}

        {[1, 10, 20, values.length].map((d) => (
          <text key={d} x={(d - 0.5) * slot} y={H - 4} textAnchor="middle" className={styles.axis}>
            {d}
          </text>
        ))}
      </svg>
    </div>
  )
}
