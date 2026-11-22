import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export function credentials(role: 'user' | 'expert') {
  const prefix = role === 'user' ? 'E2E_USER' : 'E2E_EXPERT'
  const email = process.env[`${prefix}_EMAIL`]
  const password = process.env[`${prefix}_PASSWORD`]
  if (!email || !password) {
    throw new Error(`Set ${prefix}_EMAIL and ${prefix}_PASSWORD in .env.local (see .env.example)`)
  }
  return { email, password }
}

export async function signIn(page: Page, role: 'user' | 'expert' = 'user') {
  const { email, password } = credentials(role)
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('link', { name: 'GrowPath' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
}

export async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((value) => {
    localStorage.setItem('growpath.theme', value)
    document.documentElement.dataset.theme = value
  }, theme)
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
}

/** WCAG 2.1 A and AA rules of axe-core on the page as it is now. */
export async function expectNoAccessibilityViolations(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(
    result.violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`),
    'accessibility violations',
  ).toEqual([])
}

/** A valid 1x1 PNG, enough for the upload checks (type and size) and the presigned PUT. */
export const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)
