import { buildGoogleAuthUrl, requireUser } from '../_shared/google.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }

    const user = await requireUser(authHeader)

    const statePayload = {
      userId: user.id,
      nonce: crypto.randomUUID(),
      ts: Date.now(),
    }

    const state = btoa(JSON.stringify(statePayload))
    const url = buildGoogleAuthUrl(state)

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
