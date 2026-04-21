import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jozhcryabkfdvfyjqmdd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvemhjcnlhYmtmZHZmeWpxbWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTEzNTMsImV4cCI6MjA5MjM2NzM1M30.SuNIr7kzLWqnVe8ezPJssceQTRH1Y3VhorIyrvIJHpY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)