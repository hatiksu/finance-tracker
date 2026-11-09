import type { Category, TxType } from '../types'

// Цвет категории закреплён за ней навсегда (слот палитры), а не зависит от места в рейтинге.
// Слотов 7 + нейтральный серый для «Другое»: больше цветов палитра не различает надёжно.
export const CATEGORIES: Category[] = [
  {
    id: 'food',
    type: 'expense',
    name: 'Продукты',
    emoji: '🛒',
    slot: 1,
    keywords: ['продукт', 'магазин', 'пятерочк', 'пятёрочк', 'магнит', 'перекрест', 'вкусвилл', 'ашан', 'лента', 'еда', 'хлеб', 'молок', 'овощ', 'фрукт', 'мясо', 'вода', 'воды', 'сыр', 'яйц', 'супермаркет'],
  },
  {
    id: 'cafe',
    type: 'expense',
    name: 'Кафе и рестораны',
    emoji: '☕',
    slot: 2,
    keywords: ['кафе', 'кофе', 'ресторан', 'бар', 'пицц', 'суши', 'роллы', 'бургер', 'обед', 'ужин', 'завтрак', 'шаурм', 'доставк', 'макдак', 'вкусно и точка', 'kfc', 'чай'],
  },
  {
    id: 'transport',
    type: 'expense',
    name: 'Транспорт',
    emoji: '🚕',
    slot: 3,
    keywords: ['такси', 'метро', 'автобус', 'бензин', 'заправ', 'топливо', 'парковк', 'каршеринг', 'электричк', 'поезд', 'проезд', 'транспорт', 'самокат', 'мойк'],
  },
  {
    id: 'home',
    type: 'expense',
    name: 'Дом и связь',
    emoji: '🏠',
    slot: 4,
    keywords: ['аренд', 'квартир', 'жкх', 'коммунал', 'свет', 'электричеств', 'газ', 'интернет', 'связь', 'телефон', 'мобильн', 'ремонт', 'подписк'],
  },
  {
    id: 'shopping',
    type: 'expense',
    name: 'Покупки',
    emoji: '🛍️',
    slot: 5,
    keywords: ['одежд', 'обув', 'кроссовк', 'футболк', 'куртк', 'техник', 'наушник', 'ozon', 'озон', 'wildberries', 'вб', 'вайлдберриз', 'маркетплейс', 'подарок', 'косметик'],
  },
  {
    id: 'health',
    type: 'expense',
    name: 'Здоровье и спорт',
    emoji: '💊',
    slot: 6,
    keywords: ['аптек', 'лекарств', 'врач', 'стоматолог', 'анализ', 'клиник', 'спорт', 'зал', 'фитнес', 'тренировк', 'бассейн', 'витамин'],
  },
  {
    id: 'fun',
    type: 'expense',
    name: 'Развлечения',
    emoji: '🎮',
    slot: 7,
    keywords: ['кино', 'игр', 'концерт', 'театр', 'музей', 'боулинг', 'кальян', 'клуб', 'стим', 'steam', 'книг', 'отпуск', 'путешеств', 'отел', 'билет'],
  },
  {
    id: 'other',
    type: 'expense',
    name: 'Другое',
    emoji: '📦',
    slot: 0,
    keywords: [],
  },
  {
    id: 'salary',
    type: 'income',
    name: 'Зарплата',
    emoji: '💼',
    slot: 3,
    keywords: ['зарплат', 'зп', 'аванс', 'оклад', 'премия', 'преми'],
  },
  {
    id: 'freelance',
    type: 'income',
    name: 'Подработка',
    emoji: '💻',
    slot: 1,
    keywords: ['подработк', 'фриланс', 'заказ', 'проект', 'клиент'],
  },
  {
    id: 'gift-in',
    type: 'income',
    name: 'Подарки и переводы',
    emoji: '🎁',
    slot: 5,
    keywords: ['подарили', 'перевод от', 'перевели', 'вернули', 'долг вернул'],
  },
  {
    id: 'cashback',
    type: 'income',
    name: 'Кэшбэк и проценты',
    emoji: '💸',
    slot: 7,
    keywords: ['кэшбэк', 'кешбэк', 'кэшбек', 'cashback', 'процент', 'вклад', 'дивиденд'],
  },
  {
    id: 'other-in',
    type: 'income',
    name: 'Другой доход',
    emoji: '➕',
    slot: 0,
    keywords: [],
  },
]

const byId = new Map(CATEGORIES.map((c) => [c.id, c]))

export function getCategory(id: string): Category {
  return byId.get(id) ?? byId.get('other')!
}

export function categoriesOf(type: TxType): Category[] {
  return CATEGORIES.filter((c) => c.type === type)
}

export const fallbackCategory = (type: TxType) => (type === 'expense' ? 'other' : 'other-in')

/** CSS-переменная цвета категории */
export const categoryColor = (c: Category) => (c.slot ? `var(--series-${c.slot})` : 'var(--series-neutral)')
