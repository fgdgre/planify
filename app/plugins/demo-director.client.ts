import { isDemoMode } from '@shared/api/demo'
import { reportDemoErrors, startDemoDirector } from '@features/demo-tour'

/**
 * Lets the landing page drive and monitor the demo when it is framed there.
 * Demo mode only; the real app never installs these listeners.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (!isDemoMode()) return

  // Error reporting starts at boot so startup failures reach the landing too.
  reportDemoErrors(nuxtApp)

  // After mount, so `ready` means the app is interactive and the router is settled.
  nuxtApp.hook('app:mounted', () => startDemoDirector(useRouter()))
})
