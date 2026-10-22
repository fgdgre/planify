import { isDemoMode } from '@shared/api/demo'
import { reportDemoErrors } from '@features/demo-tour/error-reporting'

/**
 * Lets the landing page drive and monitor the demo when it is framed there.
 * Demo mode only; the real app never installs these listeners.
 *
 * Error reporting is a tiny static module that starts at boot, so startup
 * failures reach the landing too. The director itself pulls in the calendar,
 * editor and seed, so it is imported dynamically and only after mount.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (!isDemoMode()) return

  reportDemoErrors(nuxtApp)

  nuxtApp.hook('app:mounted', async () => {
    const { startDemoDirector } = await import('@features/demo-tour/start')
    startDemoDirector(useRouter())
  })
})
