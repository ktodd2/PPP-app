import { createClient } from '@supabase/supabase-js';

// Fallback to hardcoded values if env vars are missing/truncated
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hytbqxhzhzmbffrzushd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5dGJxeGh6aHptYmZmcnp1c2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTQ4NDEsImV4cCI6MjA5MDQ3MDg0MX0.8CVSZH9PPY3f-lQaqJGq3gI1u3nV1QuLnEEL7SXm_QY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
