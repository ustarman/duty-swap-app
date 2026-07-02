// Edge Function: send-approval-email-v2
// Deployed on Supabase project ujwxjlhhwlxekqcyrkka (duty-swap-app)
// Sends approval-request / completion emails via Brevo.
//
// v2 changes vs send-approval-email-:
//  - Client sends only { type, swapId }. The swap row and the recipient list
//    are loaded server-side, so callers cannot send arbitrary content to
//    arbitrary addresses (the anon key is public in the app bundle).
//  - Brevo responses are checked. If no email could be delivered (quota
//    exceeded, bad API key, no active recipients), the function returns 500
//    so the app shows its "contact a supervisor directly" warning.
//
// Secrets required (Supabase Dashboard → Edge Functions → Secrets): BREVO_API_KEY
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.
// NOTE: This file is a backup of the deployed function. If you edit it here,
// you must re-deploy via `supabase functions deploy send-approval-email-v2`.

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
    const { type, swapId } = await req.json()
    if (type !== 'approval' && type !== 'completion') return json({ error: 'Invalid type' }, 400)
    if (!swapId || typeof swapId !== 'string') return json({ error: 'Missing swapId' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Load the swap server-side — email content cannot be forged by the caller
    const { data: swap, error: swapErr } = await supabase
      .from('shift_swap_requests')
      .select('*')
      .eq('id', swapId)
      .single()
    if (swapErr || !swap) return json({ error: 'Swap not found' }, 404)

    // Load recipients server-side.
    // approval → active supervisors with signing authority
    // completion → all active recipients
    let query = supabase.from('supervisors').select('email').eq('active', true)
    if (type === 'approval') query = query.eq('authority_to_sign', true)
    const { data: recipients, error: recErr } = await query
    if (recErr) return json({ error: 'Failed to load recipients' }, 500)
    if (!recipients || recipients.length === 0) return json({ error: 'No active recipients configured' }, 500)

    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
    if (!BREVO_API_KEY) return json({ error: 'BREVO_API_KEY not configured' }, 500)

    const viewUrl = 'https://ustarman.github.io/duty-swap-app/screen4?swapId=' + swap.id
    const weekType = swap.week_type === 'sunday' ? 'Sunday Only'
      : swap.week_type === 'sun-fri' ? 'Sunday to Friday'
      : swap.week_type === 'mon-fri' ? 'Monday to Friday'
      : 'Full Week'
    const approvalDate = swap.supervisor_signed_date
      ? new Date(swap.supervisor_signed_date).toLocaleString('en-AU', {
          timeZone: 'Australia/Brisbane',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
      : ''

    let subject = ''
    let html = ''

    if (type === 'approval') {
      subject = '[Action Required] Please Approve: Duty Swap Request - ' + swap.title + ' | Week of ' + swap.week_commencing
      html = '<p>Hi Team,</p><p>A duty swap request is awaiting your approval. Please ensure this is reviewed and approved within 24 hours.</p>'
      html += '<p><strong>Reference No:</strong> ' + swap.title + '<br/>'
      html += '<strong>Week Commencing:</strong> ' + swap.week_commencing + '<br/>'
      html += '<strong>Week Type:</strong> ' + weekType + '</p>'
      html += '<p>Driver A: ' + swap.driver_a_name + ' - Current Duty: ' + swap.driver_a_duty + ', New Duty: ' + swap.driver_b_duty + '<br/>'
      html += 'Driver B: ' + swap.driver_b_name + ' - Current Duty: ' + swap.driver_b_duty + ', New Duty: ' + swap.driver_a_duty + '</p>'
      html += '<p><a href="' + viewUrl + '">Click here to review and approve</a></p>'
      html += '<p>Regards,<br/>Brisbane Transport Admin Team</p>'
    } else {
      subject = 'Confirmation: Duty Swap Request Completed - ' + swap.title + ' | Week of ' + swap.week_commencing
      html = '<p>Hi Team,</p><p>Please be advised that the following duty swap request has been approved and completed.</p>'
      html += '<p><strong>Reference No:</strong> ' + swap.title + '<br/>'
      html += '<strong>Week Commencing:</strong> ' + swap.week_commencing + '<br/>'
      html += '<strong>Week Type:</strong> ' + weekType + '</p>'
      html += '<p><strong>Driver A:</strong> ' + swap.driver_a_name + '<br/>'
      html += 'Current Duty: ' + swap.driver_a_duty + ', New Duty: ' + swap.driver_b_duty + '</p>'
      html += '<p><strong>Driver B:</strong> ' + swap.driver_b_name + '<br/>'
      html += 'Current Duty: ' + swap.driver_b_duty + ', New Duty: ' + swap.driver_a_duty + '</p>'
      html += '<p><strong>Approved by:</strong> ' + swap.supervisor_name + '<br/>'
      html += '<strong>Approval Date:</strong> ' + approvalDate + '</p>'
      html += '<p><a href="' + viewUrl + '">Click here to view swap details</a></p>'
      html += '<p>Regards,<br/>PTCs</p>'
    }

    // Send one email per recipient and check every Brevo response
    const results = await Promise.all(recipients.map(async (s: { email: string }) => {
      try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: { name: 'Duty Swap', email: 'heycomeon@gmail.com' },
            to: [{ email: s.email }],
            subject,
            htmlContent: html,
          }),
        })
        if (!res.ok) {
          console.error('Brevo send failed for', s.email, res.status, await res.text())
          return false
        }
        return true
      } catch (e) {
        console.error('Brevo send error for', s.email, e)
        return false
      }
    }))

    const sent = results.filter(Boolean).length
    const failed = results.length - sent
    if (sent === 0) return json({ error: 'All email sends failed', sent, failed }, 500)

    return json({ success: true, sent, failed })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
