import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// Ensure URL is a valid HTTP/HTTPS endpoint and not a default placeholder
const isValidHttpUrl = (url: string) => {
  return (url.startsWith('http://') || url.startsWith('https://')) && !url.includes('your-supabase-url');
};

export const supabase = isValidHttpUrl(supabaseUrl) && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

