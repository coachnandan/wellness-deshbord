// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER') || 'whatsapp:+14155238886'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: any) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  // Simple GET handler for health check / info
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ message: 'Mock Supabase Edge Function is running', port: 54321 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify authentication
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { client_id, whatsapp_number, message_type, client_name, plan, expiry_date, new_expiry_date } = await req.json()

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials are not configured')
    }

    // Format destination number (ensure it starts with whatsapp:)
    let to_number = whatsapp_number
    if (!to_number.startsWith('whatsapp:')) {
      // Remove any non-digit characters except +
      const clean_number = to_number.replace(/[^\d+]/g, '')
      to_number = `whatsapp:${clean_number.startsWith('+') ? clean_number : '+' + clean_number}`
    }

    // Compose message
    let body = ''
    switch (message_type) {
      case 'Welcome':
        body = `Welcome to Elevate Sanctuary, ${client_name}! We are thrilled to guide your wellness journey.`
        break
      case 'MembershipCreated':
        body = `Hello ${client_name}, your ${plan} membership has been successfully activated. Welcome to the Sanctuary!`
        break
      case 'Welcome Plan':
        body = `Hello ${client_name}, your membership has been successfully renewed until ${expiry_date || new_expiry_date}. We're glad to have you back in the flow!`
        break
      case 'Renewal Confirmation':
        body = `Hi ${client_name}, this confirms your membership renewal. Your new access is valid until ${new_expiry_date}. Stay elevated.`
        break
      default:
        body = `Hello ${client_name}, this is a notification from Elevate Sanctuary.`
    }

    // Send via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
    const twilioData = new URLSearchParams()
    twilioData.append('To', to_number)
    twilioData.append('From', TWILIO_WHATSAPP_NUMBER)
    twilioData.append('Body', body)

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: twilioData
    })

    const twilioResult = await twilioResponse.json()

    if (!twilioResponse.ok) {
      console.error('Twilio Error:', twilioResult)
      throw new Error(`Twilio Error: ${twilioResult.message}`)
    }

    // Log the successful notification
    await supabaseClient.from('notification_logs').insert({
      client_id: client_id,
      message_type: message_type,
      status: 'Sent'
    })

    return new Response(JSON.stringify({ success: true, sid: twilioResult.sid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
