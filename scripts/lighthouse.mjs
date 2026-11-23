// Runs Lighthouse on the built application (served by `vite preview`) for desktop and mobile and prints the scores.
// Usage: npm run lighthouse [-- --min 90]   (builds first; reports go to the git-ignored .lighthouse/ folder)
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

try {
  process.loadEnvFile('.env.local')
} catch {
  // The variables may come from the environment.
}

const origin = 'http://127.0.0.1:4173'
const pages = ['/', '/shop', '/shop/lavender', '/login']
const categories = ['performance', 'accessibility', 'best-practices', 'seo']
const minIndex = process.argv.indexOf('--min')
const minimum = minIndex > -1 ? Number(process.argv[minIndex + 1]) : null

async function isUp() {
  try {
    return (await fetch(origin)).ok
  } catch {
    return false
  }
}

async function startPreview() {
  if (await isUp()) return () => undefined
  const child = spawn('npx', ['vite', 'preview'], { stdio: 'ignore' })
  for (let attempt = 0; attempt < 40 && !(await isUp()); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  if (!(await isUp())) throw new Error('The preview server did not start')
  return () => child.kill()
}

const seconds = (audit) => (audit?.numericValue ?? 0) / 1000
const format = (value) => value.toFixed(2)

async function run(chrome, path, form) {
  const flags = { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: categories }
  const config = form === 'desktop' ? desktopConfig : undefined
  const { lhr } = await lighthouse(`${origin}${path}`, flags, config)
  const scores = Object.fromEntries(
    categories.map((name) => [name, Math.round(lhr.categories[name].score * 100)]),
  )
  const metrics = {
    FCP: seconds(lhr.audits['first-contentful-paint']),
    LCP: seconds(lhr.audits['largest-contentful-paint']),
    TBT: (lhr.audits['total-blocking-time'].numericValue ?? 0) / 1000,
    CLS: lhr.audits['cumulative-layout-shift'].numericValue ?? 0,
    SI: seconds(lhr.audits['speed-index']),
  }
  mkdirSync('.lighthouse', { recursive: true })
  writeFileSync(`.lighthouse/${form}${path.replaceAll('/', '_') || '_'}.json`, JSON.stringify(lhr))
  return { scores, metrics }
}

const stop = await startPreview()
const chrome = await launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
})
let failed = false
try {
  console.log(
    'page'.padEnd(18),
    'form'.padEnd(8),
    'perf  a11y  best  seo   FCP    LCP    TBT    CLS    SI',
  )
  for (const form of ['mobile', 'desktop']) {
    for (const path of pages) {
      const { scores, metrics } = await run(chrome, path, form)
      const row = categories.map((name) => String(scores[name]).padEnd(5)).join(' ')
      console.log(
        path.padEnd(18),
        form.padEnd(8),
        row,
        [metrics.FCP, metrics.LCP, metrics.TBT, metrics.CLS, metrics.SI]
          .map((value) => format(value).padEnd(6))
          .join(' '),
      )
      if (minimum !== null && scores.performance < minimum) failed = true
    }
  }
} finally {
  await chrome.kill()
  stop()
}
if (failed) {
  console.error(`Performance is below ${minimum} on at least one page`)
  process.exitCode = 1
}
