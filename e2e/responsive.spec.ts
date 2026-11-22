import { expect, test } from '@playwright/test'
import { expectNoAccessibilityViolations } from './support'

for (const path of ['/', '/shop', '/login']) {
  test(`${path} fits a 375 px wide screen without sideways scrolling`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('main')).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
    await expectNoAccessibilityViolations(page)
  })
}

test('the shop keeps its controls usable on a phone', async ({ page }) => {
  await page.goto('/shop')
  const search = page.getByRole('searchbox', { name: /Search plants/ })
  await expect(search).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()

  const chip = page.getByRole('button', { name: 'All' })
  const box = await chip.boundingBox()
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
})
