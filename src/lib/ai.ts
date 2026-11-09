// ИИ-функции на Claude. Модуль подгружается лениво, только когда пользователь вызывает ИИ.
// Запросы идут напрямую из браузера с ключом пользователя.
import Anthropic from '@anthropic-ai/sdk'
import { CATEGORIES } from '../data/categories'
import type { TxDraft } from '../types'
import { today } from './dates'

const MODEL = 'claude-opus-5-5'

function client(apiKey: string) {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

/** Переводит ошибки SDK в понятные сообщения. */
function humanize(err: unknown): Error {
  if (err instanceof Anthropic.AuthenticationError) return new Error('Неверный API-ключ Anthropic')
  if (err instanceof Anthropic.PermissionDeniedError) return new Error('У ключа нет доступа к модели')
  if (err instanceof Anthropic.RateLimitError) return new Error('Слишком много запросов — попробуйте через минуту')
  if (err instanceof Anthropic.APIConnectionError) return new Error('Нет соединения с интернетом')
  if (err instanceof Anthropic.APIError) return new Error(`Ошибка API (${err.status ?? '—'}): ${err.message}`)
  return err instanceof Error ? err : new Error(String(err))
}

async function askJSON<T>(apiKey: string, params: { system: string; prompt: string; schema: Record<string, unknown>; effort: 'low' | 'medium' }): Promise<T> {
  let response
  try {
    response = await client(apiKey).beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: params.effort,
        format: { type: 'json_schema', schema: params.schema },
      },
      system: params.system,
      messages: [{ role: 'user', content: params.prompt }],
    })
  } catch (err) {
    throw humanize(err)
  }
  if (response.stop_reason === 'refusal') throw new Error('Модель отказалась обрабатывать запрос')
  if (response.stop_reason === 'max_tokens') throw new Error('Ответ модели оборвался — попробуйте ещё раз')
  const text = response.content.find((b) => b.type === 'text')
  if (!text || text.type !== 'text') throw new Error('Пустой ответ модели')
  return JSON.parse(text.text) as T
}

// ---------- Распознавание фразы ----------

const expenseIds = CATEGORIES.filter((c) => c.type === 'expense').map((c) => c.id)
const incomeIds = CATEGORIES.filter((c) => c.type === 'income').map((c) => c.id)

const PARSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'amount', 'categoryId', 'note', 'date'],
        properties: {
          type: { type: 'string', enum: ['expense', 'income'] },
          amount: { type: 'number', description: 'Сумма в основных единицах валюты, например 350.5' },
          categoryId: { type: 'string', enum: [...expenseIds, ...incomeIds] },
          note: { type: 'string', description: 'Короткое описание с заглавной буквы, 1–4 слова' },
          date: { type: 'string', description: 'Дата в формате YYYY-MM-DD' },
        },
      },
    },
  },
}

const categoryList = CATEGORIES.map((c) => `${c.id} (${c.type === 'expense' ? 'расход' : 'доход'}): ${c.name}`).join('\n')

/** Разбирает свободную фразу в одну или несколько операций. */
export async function parseWithAI(apiKey: string, text: string): Promise<TxDraft[]> {
  const result = await askJSON<{ items: { type: 'expense' | 'income'; amount: number; categoryId: string; note: string; date: string }[] }>(apiKey, {
    effort: 'low',
    schema: PARSE_SCHEMA,
    system: `Ты разбираешь записи о тратах и доходах для приложения учёта финансов.
Верни все операции из фразы. Если сумм несколько — это несколько операций.
Категории:
${categoryList}
Сегодня ${today()}. «Вчера», «в пятницу» и т.п. переводи в дату. Если дата не указана — сегодня.
Если операций нет, верни пустой список.`,
    prompt: text,
  })
  const valid = new Set(CATEGORIES.map((c) => c.id))
  return result.items
    .filter((i) => Number.isFinite(i.amount) && i.amount > 0 && valid.has(i.categoryId) && /^\d{4}-\d{2}-\d{2}$/.test(i.date))
    .map((i) => ({
      type: i.type,
      amount: Math.round(i.amount * 100),
      categoryId: i.categoryId,
      note: i.note.slice(0, 80),
      date: i.date,
    }))
}

// ---------- Разбор месяца ----------

export interface AIInsights {
  summary: string
  highlights: { emoji: string; title: string; text: string }[]
  tips: string[]
}

const INSIGHTS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'highlights', 'tips'],
  properties: {
    summary: { type: 'string', description: '2–3 предложения: общая картина месяца' },
    highlights: {
      type: 'array',
      description: '2–4 наблюдения',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['emoji', 'title', 'text'],
        properties: {
          emoji: { type: 'string' },
          title: { type: 'string', description: 'Заголовок до 5 слов' },
          text: { type: 'string', description: '1–2 предложения с конкретными цифрами' },
        },
      },
    },
    tips: { type: 'array', description: '2–4 конкретных совета, что можно урезать или изменить', items: { type: 'string' } },
  },
}

/** Анализ месяца по агрегированной сводке (сами операции целиком не отправляются). */
export async function analyzeMonth(apiKey: string, summary: object): Promise<AIInsights> {
  return askJSON<AIInsights>(apiKey, {
    effort: 'medium',
    schema: INSIGHTS_SCHEMA,
    system: `Ты — внимательный финансовый помощник. Анализируешь траты человека за месяц и пишешь по-русски, дружелюбно и по делу, без морализаторства.
Опирайся только на данные из сводки, называй конкретные суммы и категории. Советы — реалистичные и измеримые («сократить доставку еды до 2 раз в неделю — минус ~3 000 ₽»).`,
    prompt: `Сводка за месяц (суммы в основных единицах валюты):\n${JSON.stringify(summary, null, 2)}`,
  })
}
