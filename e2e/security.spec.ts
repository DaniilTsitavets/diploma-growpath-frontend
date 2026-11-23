import { expect, test, type Page } from '@playwright/test'
import { signIn } from './support'

const built = 'http://127.0.0.1:4173'

/** Collects every violation of the security policy that the browser reports while a page is used. */
async function watchViolations(page: Page) {
  const violations: string[] = []
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.error(
        `CSP-VIOLATION ${event.violatedDirective} ${event.blockedURI} ${event.sourceFile}:${event.lineNumber} ${event.sample}`,
      )
    })
  })
  page.on('console', (message) => {
    const text = message.text()
    if (/CSP-VIOLATION|Content Security Policy|Trusted Type/i.test(text)) violations.push(text)
  })
  page.on('pageerror', (error) => violations.push(`pageerror ${error.message}`))
  return violations
}

test.describe('security policy of the built application', () => {
  test.use({ baseURL: built })

  test('sends the policy and the companion headers', async ({ request }) => {
    const response = await request.get('/')
    const headers = response.headers()

    expect(headers['content-security-policy']).toContain("script-src 'self'")
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(headers['content-security-policy']).toContain("require-trusted-types-for 'script'")
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['referrer-policy']).toBeTruthy()
    expect(headers['permissions-policy']).toContain('camera=()')
  })

  test('also carries the policy in the page, for a host that sends no headers', async ({
    page,
  }) => {
    await page.goto('/')
    const policy = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content')
    expect(policy).toContain("script-src 'self'")
    expect(policy).not.toContain('frame-ancestors')
  })

  test('the public pages and the theme switch run with no violation', async ({ page }) => {
    const violations = await watchViolations(page)
    for (const path of ['/login', '/credits', '/shop/lavender', '/shop', '/']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.waitForLoadState('networkidle')
    }
    await page.getByRole('button', { name: /theme/i }).first().click()
    expect(violations).toEqual([])
  })

  test('signing in and the signed-in pages run with no violation', async ({ page }) => {
    const violations = await watchViolations(page)
    await signIn(page, 'user')
    for (const path of ['/journals', '/chat']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.waitForLoadState('networkidle')
    }
    await page.goto('/journals')
    const journal = page.locator('main a[href^="/journals/"]').first()
    // A fresh stack may have no journals yet; the other pages were already checked.
    if (!(await journal.isVisible({ timeout: 5_000 }).catch(() => false))) {
      expect(violations).toEqual([])
      return
    }
    await journal.click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.getByRole('link', { name: 'Add an update' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(violations).toEqual([])
  })
})
