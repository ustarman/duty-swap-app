// Edge Function: admin-supervisors
// Deployed on Supabase project ujwxjlhhwlxekqcyrkka (duty-swap-app)
//
// Performs supervisor / mailing-list writes (add / update / delete) with the
// service role, gated by a server-side PIN check. This exists because the
// supervisors table now has RLS enabled (anon can read but not write), so the
// Admin "Mailing List" tab can no longer write directly with the anon key.
//
// Security model:
//  - The mailing-list PIN is stored ONLY as the Supabase secret
//    MAILING_ADMIN_PIN — it is no longer shipped in the client bundle.
//  - Every write re-checks the PIN server-side, so calling this function
//    directly with the anon key (bypassing the UI) still requires the PIN.
//  - action 'verify' just checks the PIN so the UI can gate the tab.
//
// Secrets: MAILING_ADMIN_PIN (set via `supabase secrets set`).
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.
// NOTE: backup of the deployed function — re-deploy via
//   supabase functions deploy admin-supervisors

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pin, action, data } = await req.json()

    const SECRET = Deno.env.get('MAILING_ADMIN_PIN')
    if (!SECRET) return json({ error: 'MAILING_ADMIN_PIN not configured' }, 500)
    if (typeof pin !== 'string' || pin !== SECRET) return json({ error: 'Invalid PIN' }, 401)

    // PIN-only check for the UI gate
    if (action === 'verify') return json({ ok: true })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (action === 'add') {
      if (!data?.name?.trim?.() || !data?.email?.trim?.()) {
        return json({ error: 'Name and email are required' }, 400)
      }
      const { data: res, error } = await supabase
        .from('supervisors')
        .insert({
          name: data.name,
          email: data.email,
          role: data.role ?? null,
          authority_to_sign: !!data.authorityToSign,
          active: true,
        })
        .select()
        .single()
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true, supervisor: res })
    }

    if (action === 'update') {
      if (data?.id == null) return json({ error: 'id is required' }, 400)
      const u: Record<string, unknown> = {}
      const up = data.updates ?? {}
      if (up.authorityToSign !== undefined) u.authority_to_sign = up.authorityToSign
      if (up.active !== undefined) u.active = up.active
      if (up.name !== undefined) u.name = up.name
      if (up.email !== undefined) u.email = up.email
      if (Object.keys(u).length === 0) return json({ error: 'No fields to update' }, 400)
      const { error } = await supabase.from('supervisors').update(u).eq('id', data.id)
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true })
    }

    if (action === 'delete') {
      if (data?.id == null) return json({ error: 'id is required' }, 400)
      const { error } = await supabase.from('supervisors').delete().eq('id', data.id)
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true })
    }

    return json({ error: 'Invalid action' }, 400)
  } catch (err) {
    return json({ error: (err as Error).message }, 500)
  }
})
