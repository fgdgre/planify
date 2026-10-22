import { expect, test, type FrameLocator, type Page } from '@playwright/test'

/**
 * The landing embeds the real app (/demo/**) in a sandboxed iframe and drives it
 * with postMessage. This suite is the guard that an app change can never break
 * that silently, so it must run against the production build served with the
 * real `_headers` (E2E_STATIC=1, see playwright.config.ts): the dev server has
 * no CSP, no framing headers and no CORS on /_nuxt, so it would prove nothing.
 */
test.skip(process.env.E2E_STATIC !== '1', 'needs the production build served with _headers: run with E2E_STATIC=1 after `nuxt generate`')

/** Hosts the landing must never contact: the real backend and Google. */
const FORBIDDEN_HOST = /supabase\.co$|google/
/** The tour is paced for people (cursor glides, typing, pauses), so one step takes several seconds. */
const STEP_TIMEOUT = 30_000

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

interface SwapFrame {
  incoming?: { top: number; opacity: number }
  outgoing?: { top: number; opacity: number }
}

/** Samples the visible (desktop) step title of the incoming/outgoing blocks every animation frame while `scroll` runs. */
async function sampleStepSwap(page: Page, scroll: () => Promise<void>): Promise<{ frames: SwapFrame[]; settledTop: number }> {
  await page.evaluate(() => {
    const frames: SwapFrame[] = []
    ;(window as unknown as { __swap: SwapFrame[] }).__swap = frames
    const read = (selector: string) => {
      const heading = [...document.querySelectorAll<HTMLElement>(`#demo ${selector} h3`)].find((h) => h.getClientRects().length > 0)
      const block = heading?.closest<HTMLElement>('.absolute')
      return heading && block ? { top: heading.getBoundingClientRect().top, opacity: Number(getComputedStyle(block).opacity) } : undefined
    }
    const tick = () => {
      frames.push({ incoming: read('[class*="step-"][class*="-enter-"]'), outgoing: read('[class*="step-"][class*="-leave-"]') })
      requestAnimationFrame(tick)
    }
    tick()
  })
  await scroll()
  await page.waitForTimeout(1500)
  return page.evaluate(() => {
    const frames = (window as unknown as { __swap: SwapFrame[] }).__swap.filter((f) => f.incoming || f.outgoing)
    const settled = [...document.querySelectorAll<HTMLElement>('#demo h3')].filter((h) => h.getClientRects().length > 0 && !h.closest('.invisible') && h.closest('.absolute'))
    return { frames, settledTop: settled[0]!.getBoundingClientRect().top }
  })
}

test.describe('Landing demo', () => {
  test('the step text rises from the bottom of the screen when scrolling down and comes from above when scrolling up', async ({ page }) => {
    await page.goto('/')
    await scrollToStep(page, 1)
    await page.waitForTimeout(500)
    const height = page.viewportSize()!.height

    const down = await sampleStepSwap(page, () => scrollToStep(page, 2))
    const incoming = down.frames.filter((f) => f.incoming).map((f) => f.incoming!)
    expect(incoming[0]!.top).toBeGreaterThanOrEqual(height * 0.75)
    expect(incoming[0]!.opacity).toBeLessThan(0.5)
    expect(incoming.at(-1)!.top).toBeCloseTo(down.settledTop, -1)
    // It only ever travels up, and the old block leaves upwards and fades out.
    incoming.slice(1).forEach((frame, i) => expect(frame.top).toBeLessThanOrEqual(incoming[i]!.top + 0.5))
    const outgoing = down.frames.filter((f) => f.outgoing).map((f) => f.outgoing!)
    expect(outgoing.at(-1)!.top).toBeLessThan(outgoing[0]!.top)
    expect(Math.min(...outgoing.map((o) => o.opacity))).toBeLessThan(0.1)

    const up = await sampleStepSwap(page, () => scrollToStep(page, 1))
    const back = up.frames.filter((f) => f.incoming).map((f) => f.incoming!)
    expect(back[0]!.top).toBeLessThan(up.settledTop - 20)
    expect(back.at(-1)!.top).toBeCloseTo(up.settledTop, -1)
    const leaving = up.frames.filter((f) => f.outgoing).map((f) => f.outgoing!)
    expect(leaving.at(-1)!.top).toBeGreaterThan(leaving[0]!.top)
  })

  test('walks the whole tour inside the sandboxed iframe without errors', async ({ page }) => {
    test.setTimeout(120_000)

    const forbiddenRequests: string[] = []
    page.on('request', (request) => {
      if (FORBIDDEN_HOST.test(new URL(request.url()).hostname)) forbiddenRequests.push(request.url())
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

    // The ghost cursor guided the click and typing.
    await expect(demo.locator('.tour-cursor--visible')).toHaveCount(1)

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
    expect(forbiddenRequests).toEqual([])
    // The poster fallback must not have kicked in: the iframe is still there.
    await expect(page.locator('iframe[title="Interactive Planify demo"]')).toHaveCount(1)
  })

  test('wheel-scrolling the page over the demo keeps the tour running', async ({ page }) => {
    await openDemo(page)
    await waitForMessage(page, 'step-done', 1)

    const box = (await page.locator('iframe[title="Interactive Planify demo"]').boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    const before = await page.evaluate(() => window.scrollY)
    await page.mouse.wheel(0, 300)

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before)
    await expect(page.getByText("You're in control")).toBeHidden()
    expect((await demoMessages(page)).some((m) => m.type === 'user-took-control')).toBe(false)

    // The tour is still alive: scrolling on to the next sentinel moves the demo along.
    await scrollToStep(page, 2)
    await waitForMessage(page, 'step-done', 2)
  })

  test('replaying step 2 clears what it did and plays it again from scratch', async ({ page }) => {
    test.setTimeout(120_000)

    const demo = await openDemo(page)
    const stepDoneCount = (step: number) =>
      page.evaluate((step) => window.__demoMessages.filter((m) => m.type === 'step-done' && m.step === step).length, step)
    const clientCalls = demo.locator('.sx__event', { hasText: 'Client call' })

    await scrollToStep(page, 2)
    await waitForMessage(page, 'step-done', 2)
    await expect(clientCalls).toHaveCount(2)

    await scrollToStep(page, 3)
    await waitForMessage(page, 'step-done', 3)

    await scrollToStep(page, 2)
    await expect(demo.locator('input[placeholder="Event title"]')).toHaveValue('Client call', { timeout: STEP_TIMEOUT })
    await expect.poll(() => stepDoneCount(2), { timeout: STEP_TIMEOUT }).toBe(2)
    await expect(clientCalls).toHaveCount(2)

    const messages = await demoMessages(page)
    expect(messages.filter((m) => m.type === 'error' || m.type === 'step-failed')).toEqual([])
  })

  test('clicking the demo hands over control and the tour can resume', async ({ page }) => {
    const demo = await openDemo(page)
    await waitForMessage(page, 'step-done', 1)

    await page.getByRole('button', { name: 'Click to try it yourself' }).click()
    await waitForMessage(page, 'user-took-control')
    // After the hand-over the frame takes pointer input itself.
    await demo.locator('body').click({ position: { x: 640, y: 400 } })

    await expect(page.getByText("You're in control")).toBeVisible()
    // The tour's cursor and glow leave the screen as soon as the visitor takes over.
    await expect(demo.locator('.tour-cursor--visible, .tour-glow--visible')).toHaveCount(0)
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
