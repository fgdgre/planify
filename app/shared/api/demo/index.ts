// Light, always-bundled part of demo mode. The fake client and seed are NOT
// exported here on purpose: import them from './install' (lazily) or, in tests,
// from './fake-client' and './seed', so the entry bundle never pulls them in.
export { DEMO_BASE, isDemoMode, __resetDemoModeForTests } from './demo-mode'
export { registerDemoClientFactory, getDemoClient, __resetDemoClientRegistryForTests } from './client-registry'
export { toDemoPath, resolveAppPath, isDemoPath } from './demo-routes'
export * from './director-protocol'
export { getTourTarget, useTourTarget, type TourTarget } from './tour-targets'
