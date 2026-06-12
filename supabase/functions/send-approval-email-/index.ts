// Edge Function: send-approval-email-
// Deployed on Supabase project ujwxjlhhwlxekqcyrkka (duty-swap-app)
// Sends approval-request / completion emails via Brevo.
// Secrets required (Supabase Dashboard → Edge Functions → Secrets): BREVO_API_KEY
// NOTE: This file is a backup of the deployed function. If you edit it here,
// you must re-deploy via the Supabase dashboard (or `supabase functions deploy`).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, swap, supervisors } = await req.json()
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
    const viewUrl = 'https://ustarman.github.io/duty-swap-app/screen4?swapId=' + swap.id
    const weekType = swap.weekType === 'sunday' ? 'Sunday Only' : swap.weekType === 'sun-fri' ? 'Sunday to Friday' : 'Monday to Friday'
    const approvalDate = swap.supervisorSignedDate
  ? new Date(swap.supervisorSignedDate).toLocaleString('en-AU', {
      timeZone: 'Australia/Brisbane',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  : ''

    let subject = ''
    let html = ''

    if (type === 'approval') {
      subject = '[Action Required] Please Approve: Duty Swap Request - ' + swap.title + ' | Week of ' + swap.weekCommencing
      html = '<p>Hi Team,</p><p>A duty swap request is awaiting your approval. Please ensure this is reviewed and approved within 24 hours.</p>'
      html += '<p><strong>Reference No:</strong> ' + swap.title + '<br/>'
      html += '<strong>Week Commencing:</strong> ' + swap.weekCommencing + '<br/>'
      html += '<strong>Week Type:</strong> ' + weekType + '</p>'
      html += '<p>Driver A: ' + swap.driverAName + ' - Current Duty: ' + swap.driverADuty + ', New Duty: ' + swap.driverBDuty + '<br/>'
      html += 'Driver B: ' + swap.driverBName + ' - Current Duty: ' + swap.driverBDuty + ', New Duty: ' + swap.driverADuty + '</p>'
      html += '<p><a href="' + viewUrl + '">Click here to review and approve</a></p>'
      html += '<p>Regards,<br/>Brisbane Transport Admin Team</p>'
    } else {
      subject = 'Confirmation: Duty Swap Request Completed - ' + swap.title + ' | Week of ' + swap.weekCommencing
      html = '<p>Hi Team,</p><p>Please be advised that the following duty swap request has been approved and completed.</p>'
      html += '<p><strong>Reference No:</strong> ' + swap.title + '<br/>'
      html += '<strong>Week Commencing:</strong> ' + swap.weekCommencing + '<br/>'
      html += '<strong>Week Type:</strong> ' + weekType + '</p>'
      html += '<p><strong>Driver A:</strong> ' + swap.driverAName + '<br/>'
      html += 'Current Duty: ' + swap.driverADuty + ', New Duty: ' + swap.driverBDuty + '</p>'
      html += '<p><strong>Driver B:</strong> ' + swap.driverBName + '<br/>'
      html += 'Current Duty: ' + swap.driverBDuty + ', New Duty: ' + swap.driverADuty + '</p>'
      html += '<p><strong>Approved by:</strong> ' + swap.supervisorName + '<br/>'
      html += '<strong>Approval Date:</strong> ' + approvalDate + '</p>'
      html += '<p><a href="' + viewUrl + '">Click here to view swap details</a></p>'
      html += '<p>Regards,<br/>PTCs</p>'
    }

    await Promise.all(supervisors.map((s: { email: string }) =>
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': BREVO_API_KEY!, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Duty Swap', email: 'heycomeon@gmail.com' },
          to: [{ email: s.email }],
          subject,
          htmlContent: html,
        }),
      })
    ))

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
