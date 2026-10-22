import { expect, test, type FrameLocator, type Page } from '@playwright/test'

/**
 * The landing embeds the real app (/demo/**) in a sandboxed iframe and drives it
 * with postMessage. This suite is the guard that an app change can never break
 * that silently, so it must run against the production build served with the
 * real `_headers` (E2E_STATIC=1, see playwright.config.ts): the dev server has
 * no CSP, no framing headers and no CORS on /_nuxt, so it would prove nothing.
 */
test.skip(process.env.E2E_STATIC !== '1', 'needs the production build served with _headers: run with E2E_STATIC=1 after `nuxt generate`')

const SUPABASE_HOST = /\.supabase\.co$/
const STEP_TIMEOUT = 20_000

interface DemoMessage {
  source: string
  type: string
  step?: number
  reason?: string
}

declare global {
  interface Window {
    __demoMessages: DemoMessage[]
  }
}

/** Records every message the demo posts to the landing, before any page script runs. */
async function recordDemoMessages(page: Page) {
  await page.addInitScript(() => {
    window.__demoMessages = []
    window.addEventListener('message', (event) => {
      const data = event.data
      if (data && typeof data === 'object' && data.source === 'planify-demo') window.__demoMessages.push(data)
    })
  })
}

const demoMessages = (page: Page) => page.evaluate(() => window.__demoMessages)

const waitForMessage = (page: Page, type: string, step?: number) =>
  page.waitForFunction(
    ({ type, step }) => window.__demoMessages.some((m) => m.type === type && (step === undefined || m.step === step)),
    { type, step },
    { timeout: STEP_TIMEOUT },
  )

/** Scrolls so the middle of the viewport sits in the scroll sentinel of `step`, which is what activates it. */
async function scrollToStep(page: Page, step: number) {
  await page.evaluate((step) => {
    const sentinel = document.querySelectorAll('[data-testid="demo-step-sentinel"]')[step - 1]
    if (!sentinel) throw new Error(`no scroll sentinel for step ${step}`)
    const rect = sentinel.getBoundingClientRect()
    window.scrollBy(0, rect.top + rect.height / 2 - window.innerHeight / 2)
  }, step)
}

async function openDemo(page: Page): Promise<FrameLocator> {
  await recordDemoMessages(page)
  await page.goto('/')
  // Start the tour on step 1 before the iframe loads: `ready` makes the landing send the current step.
  await scrollToStep(page, 1)
  await waitForMessage(page, 'ready')
  return page.frameLocator('iframe[title="Interactive Planify demo"]')
}

test.use({ viewport: { width: 1440, height: 900 } })

test.describe('Landing demo', () => {
  test('walks the whole tour inside the sandboxed iframe without errors', async ({ page }) => {
    test.setTimeout(120_000)

    const supabaseRequests: string[] = []
    page.on('request', (request) => {
      if (SUPABASE_HOST.test(new URL(request.url()).hostname)) supabaseRequests.push(request.url())
    })

    const demo = await openDemo(page)
    await expect(page.locator('iframe[title="Interactive Planify demo"]')).toHaveAttribute('sandbox', 'allow-scripts')

    // 1: the week grid with seeded events.
    await waitForMessage(page, 'step-done', 1)
    await expect(demo.getByText('Acme standup').first()).toBeVisible({ timeout: STEP_TIMEOUT })

    // 2: the tour creates a "Client call" today at 14:00 and shows it.
    await scrollToStep(page, 2)
    await waitForMessage(page, 'step-done', 2)
    // The seed already has a Tuesday "Client call", so the created one makes it at least two.
    await expect
      .poll(() => demo.getByText('Client call').count(), { timeout: STEP_TIMEOUT })
      .toBeGreaterThanOrEqual(2)

    // 3: the notes sidebar of the Acme standup, with its note open.
    await scrollToStep(page, 3)
    await waitForMessage(page, 'step-done', 3)
    await expect(demo.getByText('Acme standup notes').first()).toBeVisible({ timeout: STEP_TIMEOUT })

    // 4: calendar search typed "acme" and lists matches.
    await scrollToStep(page, 4)
    await waitForMessage(page, 'step-done', 4)
    await expect(demo.locator('input[value="acme" i]').first()).toBeVisible({ timeout: STEP_TIMEOUT })
    // Search results list each match with its date, e.g. "Oct 23, 9:00 AM".
    await expect(demo.getByText(/^[A-Z][a-z]{2} \d{1,2}, \d{1,2}:\d{2} [AP]M$/).first()).toBeVisible()

    // 5: the dashboard.
    await scrollToStep(page, 5)
    await waitForMessage(page, 'step-done', 5)
    await expect(demo.getByText("Today's Schedule")).toBeVisible({ timeout: STEP_TIMEOUT })
    await expect(demo.getByText('Events This Week')).toBeVisible()

    const messages = await demoMessages(page)
    expect(messages.some((m) => m.type === 'ready')).toBe(true)
    expect(messages.filter((m) => m.type === 'error' || m.type === 'step-failed')).toEqual([])
    expect(supabaseRequests).toEqual([])
    // The poster fallback must not have kicked in: the iframe is still there.
    await expect(page.locator('iframe[title="Interactive Planify demo"]')).toHaveCount(1)
  })

  test('clicking inside the demo hands over control and the tour can resume', async ({ page }) => {
    const demo = await openDemo(page)
    await waitForMessage(page, 'step-done', 1)

    await demo.locator('body').click({ position: { x: 640, y: 400 } })

    await expect(page.getByText("You're in control")).toBeVisible()
    const resume = page.getByRole('button', { name: /Resume tour/ })
    await expect(resume).toBeVisible()

    await resume.click()
    await expect(resume).toBeHidden()
  })

  test('falls back to the poster and a live-demo link when the demo cannot load', async ({ page }) => {
    await page.route('**/demo/**', (route) => route.abort())
    await page.goto('/')
    await page.locator('#demo').scrollIntoViewIfNeeded()

    // READY_TIMEOUT_MS is 8s; allow headroom.
    await expect(page.getByRole('link', { name: 'Open the live demo' })).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('iframe[title="Interactive Planify demo"]')).toHaveCount(0)
    await expect(page.getByAltText(/Planify calendar showing the week/)).toBeVisible()
  })
})
