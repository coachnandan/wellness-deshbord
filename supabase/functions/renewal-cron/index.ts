import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

serve(async (req) => {
  // Verify authorization for cron job (optional but recommended)
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Find memberships expiring in 3 days
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 3)
    const targetDateString = targetDate.toISOString().split('T')[0]

    const { data: memberships, error } = await supabase
      .from('memberships')
      .select('*, clients(*)')
      .eq('status', 'Active')
      .eq('expiry_date', targetDateString)

    if (error) throw error

    let processedCount = 0

    for (const membership of memberships) {
      const client = membership.clients
      if (client?.whatsapp_number) {
        // Invoke whatsapp-notify function
        await supabase.functions.invoke('whatsapp-notify', {
          body: {
            client_id: client.id,
            whatsapp_number: client.whatsapp_number,
            message_type: 'Renewal Reminder',
            client_name: client.name,
            expiry_date: targetDateString
          }
        })
        processedCount++
      }
    }

    return new Response(JSON.stringify({ success: true, processed: processedCount }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
