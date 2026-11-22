import { expect, test } from '@playwright/test'
import { expectNoAccessibilityViolations, setTheme, signIn } from './support'

const visitorPages = ['/', '/shop', '/chat', '/login']

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    for (const path of visitorPages) {
      test(`${path} has no WCAG 2.1 AA violations for a visitor`, async ({ page }) => {
        await page.goto(path)
        await setTheme(page, theme)
        await expect(page.locator('main')).toBeVisible()
        await expectNoAccessibilityViolations(page)
      })
    }

    test('journals have no WCAG 2.1 AA violations for a signed-in user', async ({ page }) => {
      await signIn(page)
      await page.goto('/journals')
      await setTheme(page, theme)
      await expect(page.getByRole('heading', { name: 'Journals', level: 1 })).toBeVisible()
      await expectNoAccessibilityViolations(page)
    })
  })
}

test('the interface can be used from the keyboard: skip to the search with Ctrl K and submit', async ({
  page,
}) => {
  await page.goto('/')
  const search = page.getByRole('searchbox', { name: /Search plants/ })
  await expect(search).toBeVisible()
  await page.keyboard.press('Control+k')
  await expect(search).toBeFocused()
  await page.keyboard.type('basil')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/shop\?q=basil$/)
})
