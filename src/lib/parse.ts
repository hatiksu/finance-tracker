// Локальное распознавание быстрого ввода: «кофе 350», «такси 420 вчера», «+50000 зарплата».
// Работает без сети. Для сложных фраз есть распознавание через ИИ (lib/ai.ts).
import { CATEGORIES, fallbackCategory } from '../data/categories'
import type { TxDraft, TxType } from '../types'
import { addDays, today } from './dates'

// \b в JS не работает с кириллицей, поэтому границы слов — через lookaround
const NOT_LETTER_AFTER = '(?![a-zа-яё])'
const AMOUNT_RE = new RegExp(
  String.raw`(^|\s)(\+)?(\d+(?:[  ]\d{3})*(?:[.,]\d{1,2})?)\s*(к|k|тыс\.?|тысяч[иа]?)?(?=$|\s|₽|руб|р${NOT_LETTER_AFTER})\s*(₽|р\.?|руб(?:лей|ля|ль)?\.?)?${NOT_LETTER_AFTER}`,
  'i',
)

const DATE_WORDS: [RegExp, number][] = [
  [/(?<![а-яё])позавчера(?![а-яё])/i, -2],
  [/(?<![а-яё])вчера(?![а-яё])/i, -1],
  [/(?<![а-яё])сегодня(?![а-яё])/i, 0],
]

function detectCategory(text: string, type: TxType): string | null {
  const lower = text.toLowerCase()
  for (const c of CATEGORIES) {
    if (c.type !== type) continue
    if (c.keywords.some((k) => lower.includes(k))) return c.id
  }
  return null
}

export interface ParseResult {
  draft: TxDraft
  /** Категорию удалось определить по ключевым словам */
  confident: boolean
}

export function parseQuickInput(input: string): ParseResult | null {
  let text = ` ${input.trim()} `
  const m = text.match(AMOUNT_RE)
  if (!m) return null

  let amount = Number(m[3].replace(/\s/g, '').replace(',', '.'))
  if (m[4]) amount *= 1000
  if (!Number.isFinite(amount) || amount <= 0) return null
  text = text.replace(m[0], ' ')

  let date = today()
  for (const [re, shift] of DATE_WORDS) {
    if (re.test(text)) {
      date = addDays(today(), shift)
      text = text.replace(re, ' ')
      break
    }
  }

  const incomeCategory = detectCategory(text, 'income')
  const type: TxType = m[2] === '+' || incomeCategory ? 'income' : 'expense'
  const detected = type === 'income' ? incomeCategory : detectCategory(text, 'expense')

  const note = text.replace(/\s+/g, ' ').trim()
  return {
    draft: {
      type,
      amount: Math.round(amount * 100),
      categoryId: detected ?? fallbackCategory(type),
      note: note ? note[0].toUpperCase() + note.slice(1) : '',
      date,
    },
    confident: Boolean(detected),
  }
}
