const SCROLLABLE_OVERFLOW = new Set(['auto', 'scroll', 'overlay'])

const documentScroller = () => document.scrollingElement ?? document.documentElement

const scrollParentOf = (element: HTMLElement): Element => {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const scrollsVertically = SCROLLABLE_OVERFLOW.has(getComputedStyle(parent).overflowY)
    if (scrollsVertically && parent.scrollHeight > parent.clientHeight) return parent
  }
  return documentScroller()
}

export function centerInScrollParent(element: HTMLElement, behavior: ScrollBehavior): void {
  const container = scrollParentOf(element)
  const isDocument = container === documentScroller()
  const containerTop = isDocument ? 0 : container.getBoundingClientRect().top
  const visibleHeight = isDocument ? window.innerHeight : container.clientHeight
  const elementRect = element.getBoundingClientRect()
  const top = container.scrollTop + elementRect.top - containerTop - (visibleHeight - elementRect.height) / 2

  container.scrollTo({ top: Math.max(0, top), behavior })
}
