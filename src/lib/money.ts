// Суммы хранятся целыми числами в минимальных единицах (копейках), чтобы не было ошибок округления.

export const CURRENCIES = [
  { code: 'RUB', label: 'Рубль ₽' },
  { code: 'USD', label: 'Доллар $' },
  { code: 'EUR', label: 'Евро €' },
  { code: 'KZT', label: 'Тенге ₸' },
  { code: 'UAH', label: 'Гривна ₴' },
  { code: 'BYN', label: 'Бел. рубль Br' },
]

const formatters = new Map<string, Intl.NumberFormat>()

function formatter(currency: string, compact: boolean, cents: boolean) {
  const key = `${currency}:${compact}:${cents}`
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      // Копейки показываем только если они есть, и тогда всегда двумя цифрами: 1 299,90 ₽
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: cents ? 2 : 0,
      ...(compact ? { notation: 'compact' as const } : {}),
    })
    formatters.set(key, f)
  }
  return f
}

/** 123456 (копеек) → «1 234,56 ₽» */
export function formatMoney(minor: number, currency: string, { compact = false, sign = false } = {}) {
  const abs = Math.abs(minor)
  const text = formatter(currency, compact, !compact && abs % 100 !== 0).format(abs / 100)
  if (!sign || minor === 0) return minor < 0 ? `−${text}` : text
  return `${minor > 0 ? '+' : '−'}${text}`
}

/** «1 234,5» → 123450. Возвращает NaN, если строка не число. */
export function parseMoneyInput(value: string): number {
  const clean = value.replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return Number.NaN
  return Math.round(Number(clean) * 100)
}

export const minorToInput = (minor: number) => (minor / 100).toString().replace('.', ',')
