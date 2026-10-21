import { describe, it, expect } from 'vitest'
import {
  GOOGLE_ACCOUNT_PUBLIC_COLUMNS,
  GOOGLE_ACCOUNT_SELECT,
} from '@shared/constants/google-accounts'

/**
 * Guards the invariant behind the google_accounts column grants: the browser
 * must never ask for OAuth token columns. If someone adds a token column here,
 * this test fails before the request ever reaches Supabase.
 */
describe('google_accounts browser column list', () => {
  const SECRET_COLUMNS = ['access_token', 'refresh_token']

  it('never includes OAuth token columns', () => {
    for (const column of SECRET_COLUMNS) {
      expect(GOOGLE_ACCOUNT_PUBLIC_COLUMNS).not.toContain(column)
    }
  })

  it('keeps the select string in sync with the column list', () => {
    const fromSelect = GOOGLE_ACCOUNT_SELECT.split(',').map((column) => column.trim())

    expect(fromSelect).toEqual([...GOOGLE_ACCOUNT_PUBLIC_COLUMNS])
  })

  it('does not use a wildcard', () => {
    expect(GOOGLE_ACCOUNT_SELECT).not.toContain('*')
  })
})
