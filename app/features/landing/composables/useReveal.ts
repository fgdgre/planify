import type { Ref } from 'vue'
import { landingEffects } from '../effects'

export function useReveal(el: Ref<HTMLElement | null>): Ref<boolean> {
  const reducedMotion = usePreferredReducedMotion()
  const off = computed(() => !landingEffects.reveal || reducedMotion.value === 'reduce')
  const shown = ref(off.value)
  let observer: IntersectionObserver | undefined

  watch(off, (isOff) => {
    if (!isOff) return
    shown.value = true
    observer?.disconnect()
  })

  onMounted(() => {
    if (shown.value || !el.value) return
    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        shown.value = true
        observer?.disconnect()
      },
      { rootMargin: '0px 0px -20% 0px' },
    )
    observer.observe(el.value)
  })

  onBeforeUnmount(() => observer?.disconnect())

  return shown
}
