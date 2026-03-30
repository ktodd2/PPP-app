import { createClient } from '@supabase/supabase-js';

// Hardcoded config to avoid env var issues
const CONFIG = {
  url: ['https://hytbqxhzhzmbffrzushd', '.supabase.co'].join(''),
  key: [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5dGJxeGh6aHptYmZmcnp1c2hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTQ4NDEsImV4cCI6MjA5MDQ3MDg0MX0',
    '8CVSZH9PPY3f-lQaqJGq3gI1u3nV1QuLnEEL7SXm_QY'
  ].join('.')
};

export const supabase = createClient(CONFIG.url, CONFIG.key);
