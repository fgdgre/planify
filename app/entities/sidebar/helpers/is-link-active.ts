/**
 * Whether a sidebar link should look active for the current route.
 *
 * The dashboard lives at the app root (`/app`, `/demo`), which is a prefix of
 * every other page, so it must match exactly or it would stay highlighted
 * everywhere. Every other link matches its own path and anything nested below
 * it, on a segment boundary (`/app/notes` is not active on `/app/notes-archive`).
 */
export function isSidebarLinkActive(currentPath: string, target: string, homePath: string): boolean {
  if (target === homePath) {
    return currentPath === target
  }
  return currentPath === target || currentPath.startsWith(`${target}/`)
}
