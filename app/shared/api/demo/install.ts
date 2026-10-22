import { registerDemoClientFactory } from './client-registry'
import { getFakeClient } from './fake-client'
import { DEMO_USER } from './seed'

/**
 * Entry point of the lazily loaded demo backend (fake client + seed). Imported
 * dynamically by the demo plugin, only when the app booted under /demo.
 * Returns the demo identity so the caller can seed the user store.
 */
export function installDemoBackend() {
  registerDemoClientFactory(getFakeClient)
  return DEMO_USER
}
