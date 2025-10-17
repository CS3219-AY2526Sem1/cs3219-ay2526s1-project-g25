import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY 

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials missing:", {
    SUPABASE_URL: supabaseUrl ? 'LOADED' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: supabaseKey ? 'LOADED' : 'MISSING'
  })
  throw new Error("Missing Supabase credentials in environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseKey)