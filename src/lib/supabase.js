import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gnqldsioxzetugweracg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducWxkc2lveHpldHVnd2VyYWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzkxOTMsImV4cCI6MjA5NjcxNTE5M30.vskyTsHSuhEQo6AWCLPgDvV90YbWnyrIBwA7cMANxOo'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
