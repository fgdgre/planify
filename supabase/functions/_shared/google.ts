/// <reference lib="deno.ns" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function getEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) {
    throw new Error(`Missing env variable: ${name}`)
  }
  return value
}

export function createAdminClient() {
  return createClient(
    getEnv('SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY')
  )
}

export function createUserClient(authHeader: string) {
  return createClient(
    getEnv('SUPABASE_URL'),
    getEnv('SUPABASE_ANON_KEY'),
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  )
}

export async function requireUser(authHeader: string) {
  const supabase = createUserClient(authHeader)

  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new Error('Unauthorized')
  }

  return data.user
}

export function buildGoogleAuthUrl(state: string) {
  const clientId = getEnv('GOOGLE_CLIENT_ID')
  const redirectUri = getEnv('GOOGLE_REDIRECT_URI')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent select_account',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'openid',
      'email',
      'profile',
    ].join(' '),
    state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string) {
  const clientId = getEnv('GOOGLE_CLIENT_ID')
  const clientSecret = getEnv('GOOGLE_CLIENT_SECRET')
  const redirectUri = getEnv('GOOGLE_REDIRECT_URI')

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const json = await response.json()

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${JSON.stringify(json)}`)
  }

  return json as {
    access_token: string
    expires_in: number
    refresh_token?: string
    scope?: string
    token_type: string
    id_token?: string
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const clientId = getEnv('GOOGLE_CLIENT_ID')
  const clientSecret = getEnv('GOOGLE_CLIENT_SECRET')

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  const json = await response.json()

  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${JSON.stringify(json)}`)
  }

  return json as {
    access_token: string
    expires_in: number
    scope?: string
    token_type: string
  }
}

export async function getGoogleProfile(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const json = await response.json()

  if (!response.ok) {
    throw new Error(`Failed to fetch Google profile: ${JSON.stringify(json)}`)
  }

  return json as {
    id: string
    email: string
    name?: string
    picture?: string
  }
}

export async function ensureFreshAccessToken(googleAccountId: string) {
  const supabase = createAdminClient()

  const { data: account, error } = await supabase
    .from('google_accounts')
    .select('*')
    .eq('id', googleAccountId)
    .single()

  if (error || !account) {
    throw new Error('Google account not found')
  }

  const expiresAt = new Date(account.expires_at).getTime()
  const now = Date.now()
  const bufferMs = 60 * 1000

  if (expiresAt > now + bufferMs) {
    return {
      accessToken: account.access_token as string,
      account,
    }
  }

  const refreshed = await refreshAccessToken(account.refresh_token)

  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()

  const { error: updateError } = await supabase
    .from('google_accounts')
    .update({
      access_token: refreshed.access_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
      scopes: refreshed.scope ? refreshed.scope.split(' ') : account.scopes,
    })
    .eq('id', googleAccountId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  return {
    accessToken: refreshed.access_token,
    account: {
      ...account,
      access_token: refreshed.access_token,
      expires_at: newExpiresAt,
    },
  }
}
