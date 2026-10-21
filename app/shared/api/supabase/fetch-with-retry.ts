const MAX_ATTEMPTS = 3
const BACKOFF_STEP_MS = 100

/**
 * `fetch` that retries transient network failures (3 attempts, linear backoff).
 * Aborted requests are rethrown immediately: retrying them would defeat the abort.
 */
export async function fetchWithRetry(req: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(req, init)
    } catch (error) {
      if (init?.signal?.aborted) {
        throw error
      }
      if (attempt === MAX_ATTEMPTS) {
        console.error(`Error fetching request ${req}`, error, init)
        throw error
      }
      console.warn(`Retrying fetch attempt ${attempt + 1} for request: ${req}`)
      await new Promise((resolve) => setTimeout(resolve, BACKOFF_STEP_MS * attempt))
    }
  }
}
