import { createClient } from '@supabase/supabase-js'

// Lấy biến môi trường (Vite sử dụng prefix VITE_ hoặc SUPABASE_ từ cấu hình vite.config.ts)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Chưa cấu hình Supabase URL hoặc Anon Key trong file .env.local!");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder_key"
);
