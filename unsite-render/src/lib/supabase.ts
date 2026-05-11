import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key, {
  realtime: { params: { eventsPerSecond: 10 } }
})

export type GlobalState = {
  id: number
  session_owner: string | null
  session_expiry: string | null
  queue: string[]
  messages: { t: string; ts: number }[]
  mood_val: number
  snap: string | null
  cursor_x: number | null
  cursor_y: number | null
  total_visits: number
}
