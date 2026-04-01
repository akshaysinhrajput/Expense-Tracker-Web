// ===== SUPABASE CLIENT =====
const SUPABASE_URL = 'https://ggbwuqphtrbirxyarvlk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnYnd1cXBodHJiaXJ4eWFydmxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTc3MTQsImV4cCI6MjA4OTQ3MzcxNH0.aKGTXBKZ2fT_FCY_kI5kkxZZ9vrXHqvpmbxb5MsgwP0';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);