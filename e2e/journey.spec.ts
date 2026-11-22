import { expect, test } from '@playwright/test'
import { expectNoAccessibilityViolations, setTheme, signIn, tinyPng } from './support'

const today = () => {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

test('a user orders a pack, keeps a journal, submits an update with photos and reads the diagnosis', async ({
  page,
}) => {
  test.setTimeout(180_000)
  await signIn(page)

  // The shop: order the first pack. Payment is simulated.
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Journals' })
    .click()
  await expect(page.getByRole('heading', { name: 'Journals', level: 1 })).toBeVisible()
  const journalLinks = page.getByRole('main').getByRole('listitem').getByRole('link')
  const before = await journalLinks.count()

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Shop' }).click()
  await page
    .getByRole('button', { name: /^Order / })
    .first()
    .click()
  await page.getByRole('button', { name: 'Confirm order' }).click()
  await expect(page.getByRole('heading', { name: 'Order placed' })).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  // The journal draft appears a moment later, because the backend creates it from an event.
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Journals' })
    .click()
  await expect(async () => {
    await page.reload()
    expect(await journalLinks.count()).toBeGreaterThan(before)
  }).toPass({ timeout: 90_000, intervals: [1_000, 2_000, 3_000] })

  // The journal: planting date and checkpoints.
  await journalLinks.first().click()
  await page.getByLabel('Planting date').fill(today())
  await page.getByRole('button', { name: /Record planting|Change date/ }).click()
  await expect(page.getByRole('list', { name: 'Checkpoints' })).toBeVisible()

  // A new update: questionnaire and the two required photos.
  await page.getByRole('link', { name: 'Add an update' }).click()
  await page.getByRole('button', { name: 'Submit update' }).click()
  await expect(page.getByText('Choose an option').first()).toBeVisible()

  await page.getByLabel('Drainage').selectOption('poor')
  await page.getByLabel('Lighting').selectOption('low')
  await page.getByLabel('Soil by finger test').selectOption('wet')
  await page.getByLabel('Pot weight').selectOption('heavier')
  await page
    .getByLabel(/^Whole plant/)
    .setInputFiles({ name: 'plant.png', mimeType: 'image/png', buffer: tinyPng })
  await page
    .getByLabel(/^Soil \(required\)/)
    .setInputFiles({ name: 'soil.png', mimeType: 'image/png', buffer: tinyPng })
  await page.getByRole('button', { name: 'Submit update' }).click()

  // The update page: the photos went to the presigned URLs and the diagnosis ran.
  await expect(page).toHaveURL(/\/updates\/[0-9a-f-]{36}$/, { timeout: 45_000 })
  await expect(page.getByText('Both required photos are uploaded.')).toBeVisible()
  const causes = page.getByRole('list', { name: /Possible causes/ })
  const fallback = page.getByText(
    /Nothing was charged|The AI needs one more detail|has not run yet/,
  )
  await expect(causes.or(fallback)).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('heading', { name: 'Expert help' })).toBeVisible()

  for (const theme of ['light', 'dark'] as const) {
    await setTheme(page, theme)
    await expectNoAccessibilityViolations(page)
  }

  // The care chat of the journal.
  await page.getByRole('link', { name: 'Back to the journal' }).click()
  await page.getByRole('link', { name: 'Ask a care question' }).click()
  await page.getByLabel('Your question').fill('How often should I water basil?')
  await page.getByRole('button', { name: 'Send question' }).click()
  await expect(page.getByRole('log', { name: 'Conversation' })).toContainText(
    'How often should I water basil?',
  )
  await expect(page.getByLabel('Your question')).toHaveValue('')
})
