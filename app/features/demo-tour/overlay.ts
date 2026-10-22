import { createApp } from 'vue'
import TourOverlay from './components/TourOverlay.vue'
import { createTourVisuals, type TourVisuals } from './visuals'

/**
 * Mounts the ghost-cursor overlay on `document.body` as its own tiny Vue app,
 * so it sits above every page, sidebar and popover of the demo and survives
 * route changes. Returns the commands the tour uses to draw on it.
 */
export function mountTourOverlay(reducedMotion: boolean): TourVisuals {
  const { state, visuals } = createTourVisuals(reducedMotion)

  const host = document.createElement('div')
  host.dataset.tourOverlay = ''
  document.body.append(host)
  createApp(TourOverlay, { state }).mount(host)

  return visuals
}
