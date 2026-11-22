import { expect, test } from '@playwright/test'
import { credentials } from './support'

test.describe('visitor', () => {
  test('reads the shop without an account and is asked to sign in to order', async ({ page }) => {
    await page.goto('/shop')

    await expect(page.getByRole('heading', { name: 'Shop', level: 1 })).toBeVisible()
    const firstCard = page
      .getByRole('listitem')
      .filter({ has: page.getByRole('heading', { level: 2 }) })
      .first()
    await expect(firstCard).toBeVisible()
    await expect(page.getByRole('button', { name: /^Sign in to order/ }).first()).toBeVisible()

    await page
      .getByRole('button', { name: /^Sign in to order/ })
      .first()
      .click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('the sign-in page is only the sign-in window and returns to the shop', async ({ page }) => {
    await page.goto('/shop?q=basil')
    await page
      .getByRole('button', { name: /^Sign in to order/ })
      .first()
      .click()

    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByRole('banner')).toHaveCount(0)
    await expect(page.getByRole('contentinfo')).toHaveCount(0)

    const { email, password } = credentials('user')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/shop\?q=basil$/)
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  })

  test('wrong credentials give a clear message and keep the user in the window', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('nobody@growpath.test')
    await page.getByLabel('Password').fill('not-the-password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByRole('alert')).toContainText('Incorrect email or password')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('a protected page sends a visitor to sign in and back', async ({ page }) => {
    await page.goto('/journals')
    await expect(page).toHaveURL(/\/login$/)

    const { email, password } = credentials('user')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/journals$/)
    await expect(page.getByRole('heading', { name: 'Journals', level: 1 })).toBeVisible()
  })
})
