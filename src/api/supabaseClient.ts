import { createClient } from '@supabase/supabase-js'

// Lấy biến môi trường (Vite sử dụng prefix VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Chưa cấu hình Supabase URL hoặc Anon Key trong file .env.local!");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder_key"
);
