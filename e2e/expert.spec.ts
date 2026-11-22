import { expect, test } from '@playwright/test'
import { credentials, signIn } from './support'

test.describe('expert view', () => {
  test('a regular user is told the area is for experts', async ({ page }) => {
    await signIn(page, 'user')
    await page.goto('/expert/tickets')
    await expect(page.getByRole('heading', { name: 'No access' })).toBeVisible()
  })

  test('an expert sees the queue and can read a ticket', async ({ page }) => {
    credentials('expert')
    await signIn(page, 'expert')
    await page.getByRole('link', { name: 'Expert tickets' }).click()
    await expect(page.getByRole('heading', { name: 'Open tickets' })).toBeVisible()

    const tickets = page.getByRole('list', { name: 'Open tickets' }).getByRole('link')
    const empty = page.getByText(/No open tickets/)
    await expect(tickets.first().or(empty)).toBeVisible()

    if ((await tickets.count()) > 0) {
      await tickets.first().click()
      await expect(page.getByRole('heading', { name: 'Answer', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Photos' })).toBeVisible()
    }
  })
})
