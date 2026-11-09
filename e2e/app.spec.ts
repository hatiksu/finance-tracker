import { expect, test } from '@playwright/test'

// Ответ Claude подменяем: тесты не должны ходить в настоящий API и тратить деньги
function mockClaude(page: import('@playwright/test').Page, payload: object) {
  return page.route('https://api.anthropic.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        model: 'claude-opus-5-5',
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: JSON.stringify(payload) }],
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    }),
  )
}

const toast = (page: import('@playwright/test').Page) => page.getByRole('status')

test('первый запуск: приветствие и демо-данные', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByText('Добро пожаловать!')).toBeVisible()
  await page.getByRole('button', { name: 'Заполнить демо-данными' }).click()
  await expect(page.getByText('Расходы по категориям')).toBeVisible()
  await expect(page.getByRole('img', { name: /Расходы по категориям/ })).toBeVisible()
})

test('быстрый ввод одной строкой и отмена', async ({ page }) => {
  await page.goto('./')
  const input = page.getByLabel('Быстрый ввод операции')
  await input.fill('кофе 350')
  await expect(page.getByText('Кафе и рестораны · −350 ₽')).toBeVisible()
  await page.getByRole('button', { name: 'Добавить', exact: true }).click()
  await expect(toast(page)).toContainText('Кофе')

  await page.getByRole('button', { name: 'История' }).click()
  await expect(page.getByRole('button', { name: /Кофе/ })).toBeVisible()

  // Отмена из уведомления удаляет операцию
  await page.getByRole('button', { name: 'Обзор' }).click()
  await input.fill('такси 420')
  await page.getByRole('button', { name: 'Добавить', exact: true }).click()
  // Пока исчезает уведомление про кофе, появляется новое — отменить должно именно такси
  await toast(page).getByRole('button', { name: 'Отменить' }).click()
  await page.getByRole('button', { name: 'История' }).click()
  await expect(page.getByRole('button', { name: /Такси/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Кофе/ })).toBeVisible()
})

test('форма: проверка суммы, добавление, редактирование и удаление', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Добавить операцию' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Добавить' }).click()
  await expect(dialog.getByText('Введите сумму больше нуля')).toBeVisible()

  await dialog.getByLabel('Сумма').fill('1 299,90')
  await dialog.getByRole('button', { name: /Покупки/ }).click()
  await dialog.getByPlaceholder('Например, кофе с собой').fill('Наушники')
  await dialog.getByRole('button', { name: 'Добавить' }).click()
  await expect(toast(page)).toContainText('1 299,90')

  await page.getByRole('button', { name: 'История' }).click()
  await page.getByLabel('Поиск операций').fill('наушники')
  await expect(page.getByText(/Найдено 1/)).toBeVisible()

  await page.getByRole('button', { name: /Наушники/ }).click()
  await page.getByRole('button', { name: 'Удалить операцию' }).click()
  await expect(toast(page)).toContainText('Операция удалена')
  await toast(page).getByRole('button', { name: 'Вернуть' }).click()
  await expect(page.getByRole('button', { name: /Наушники/ })).toBeVisible()
})

test('бюджет: установка лимита', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Бюджеты' }).click()
  await page.getByRole('button', { name: /Кафе и рестораны/ }).click()
  await page.getByRole('dialog').getByRole('textbox').fill('5000')
  await page.getByRole('dialog').getByRole('button', { name: 'Сохранить' }).click()
  await expect(toast(page)).toContainText('5 000')
  await expect(page.getByText('Потрачено из бюджета')).toBeVisible()
})

test('ИИ разбирает фразу на несколько операций', async ({ page }) => {
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
  await mockClaude(page, {
    items: [
      { type: 'expense', amount: 2500, categoryId: 'transport', note: 'Заправка', date: yesterday },
      { type: 'expense', amount: 80, categoryId: 'food', note: 'Вода', date: yesterday },
    ],
  })
  await page.goto('./#settings')
  await page.getByLabel('API-ключ Anthropic').fill('sk-ant-test')
  await page.getByRole('button', { name: 'Сохранить ключ' }).click()
  await page.getByRole('button', { name: 'Закрыть настройки' }).click()

  await page.getByLabel('Быстрый ввод операции').fill('вчера заправился на 2500 и купил воды за 80')
  await page.getByRole('button', { name: 'Распознать с помощью ИИ' }).click()
  await expect(toast(page)).toContainText('Добавлено операций: 2')
})

test('работает без интернета после первого открытия', async ({ page, context }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Заполнить демо-данными' }).click()
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Финансы' })).toBeVisible()
  await expect(page.getByText('Баланс за месяц')).toBeVisible()
  await context.setOffline(false)
})
