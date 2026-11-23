import { expect, test } from '@playwright/test'
import { expectNoAccessibilityViolations, hasCredentials, setTheme, signIn } from './support'

test.describe('administrator', () => {
  test.skip(!hasCredentials('admin'), 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in .env.local')

  test('lands on the users page and sees only the administration in the navigation', async ({
    page,
  }) => {
    await signIn(page, 'admin')
    await expect(page).toHaveURL(/\/admin\/users$/)
    await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible()

    const nav = page.getByRole('navigation', { name: 'Main' })
    await expect(nav.getByRole('link', { name: 'Users' })).toBeVisible()
    await expect(
      nav.getByRole('link', { name: /Shop|AI chat|Journals|Expert tickets/ }),
    ).toHaveCount(0)
  })

  test('lists users, and cannot change their own role or status', async ({ page }) => {
    await signIn(page, 'admin')
    await expect(page.getByText('(you)')).toBeVisible()

    const own = page.getByRole('row').filter({ hasText: '(you)' })
    await expect(own.getByRole('button', { name: /^Change role of/ })).toBeDisabled()
    await expect(own.getByRole('button', { name: /^Disable / })).toBeDisabled()
    await expect(own.getByRole('button', { name: /^Reset password of/ })).toBeEnabled()
  })

  test('opens and closes the dialogs from the keyboard', async ({ page }) => {
    await signIn(page, 'admin')
    await page.getByRole('button', { name: 'Create user' }).click()
    const dialog = page.getByRole('dialog', { name: 'Create a user' })
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: 'Create user' }).click()
    await expect(dialog.getByText('Enter an email')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('is closed to the shop, the chat and the journals', async ({ page }) => {
    await signIn(page, 'admin')
    for (const path of ['/shop', '/chat', '/journals']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: 'No access' })).toBeVisible()
    }
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`the users page has no WCAG 2.1 AA violations in the ${theme} theme`, async ({ page }) => {
      await signIn(page, 'admin')
      await setTheme(page, theme)
      await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible()
      await expect(page.getByRole('table')).toBeVisible()
      await expectNoAccessibilityViolations(page)
    })
  }
})

test('a regular user and a visitor cannot open the users page', async ({ page }) => {
  await page.goto('/admin/users')
  await expect(page).toHaveURL(/\/login$/)

  await signIn(page, 'user')
  await page.goto('/admin/users')
  await expect(page.getByRole('heading', { name: 'No access' })).toBeVisible()
})
