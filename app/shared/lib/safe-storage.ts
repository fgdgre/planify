import { isDemoMode } from '@shared/api/demo'

/** `Storage` that lives in memory only, for contexts where the page must not touch the browser's storage. */
class MemoryStorage implements Storage {
  private items = new Map<string, string>()

  get length() {
    return this.items.size
  }

  clear() {
    this.items.clear()
  }

  getItem(key: string) {
    return this.items.get(key) ?? null
  }

  key(index: number) {
    return [...this.items.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.items.delete(key)
  }

  setItem(key: string, value: string) {
    this.items.set(key, value)
  }

  [name: string]: unknown
}

let memoryStorage: Storage | null = null

/**
 * Where drafts and other persisted UI state should live: `localStorage` in the
 * real app, memory in the demo.
 *
 * The demo runs in a sandboxed iframe with an opaque origin, where merely
 * reading `localStorage` throws, and it must not leave traces on the host
 * site's storage anyway. Returns `undefined` outside the browser so
 * `useStorage` falls back to its own server-safe default.
 */
export function getSafeStorage(): Storage | undefined {
  if (isDemoMode()) {
    memoryStorage ??= new MemoryStorage()
    return memoryStorage
  }

  return typeof window === 'undefined' ? undefined : window.localStorage
}
