import { describe, expect, it } from 'vitest'
import { isSidebarLinkActive } from '../../app/entities/sidebar/helpers/is-link-active'

describe('isSidebarLinkActive', () => {
  it('matches the dashboard only on the exact home path', () => {
    expect(isSidebarLinkActive('/app', '/app', '/app')).toBe(true)
    expect(isSidebarLinkActive('/app/calendar', '/app', '/app')).toBe(false)
    expect(isSidebarLinkActive('/demo/notes', '/demo', '/demo')).toBe(false)
    expect(isSidebarLinkActive('/demo', '/demo', '/demo')).toBe(true)
  })

  it('prefix-matches other links on segment boundaries', () => {
    expect(isSidebarLinkActive('/app/notes', '/app/notes', '/app')).toBe(true)
    expect(isSidebarLinkActive('/app/notes/123', '/app/notes', '/app')).toBe(true)
    expect(isSidebarLinkActive('/app/notes-archive', '/app/notes', '/app')).toBe(false)
    expect(isSidebarLinkActive('/app/calendar', '/app/notes', '/app')).toBe(false)
  })
})
