import { toDemoMessage, type DemoMessageBody } from '@shared/api/demo'

/** The page framing the demo, or null when the demo is opened on its own. */
export const getLandingWindow = (): Window | null => (window.parent === window ? null : window.parent)

/** Sends `body` to the landing page. targetOrigin '*' on purpose: the sandboxed frame has no origin we could name. */
export function sendToLanding(landing: Window, body: DemoMessageBody): void {
  landing.postMessage(toDemoMessage(body), '*')
}
