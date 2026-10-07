import { createClient } from '@supabase/supabase-js';

// Lấy biến môi trường Supabase từ .env / .env.local
const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.SUPABASE_URL || '';
const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  rawUrl !== 'https://placeholder.supabase.co' &&
  !rawUrl.includes('placeholder') &&
  rawKey !== 'placeholder_key'
);

export const supabase = createClient(
  isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? rawKey : 'placeholder_key'
);

/**
 * Đồng bộ trạng thái Mock Database lên bảng mock_db_state của Supabase.
 * Hỗ trợ giữ trạng thái khi demo trên nhiều máy/thiết bị khác nhau.
 */
export async function syncStateToSupabase(statePayload: Record<string, any>): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('mock_db_state')
      .upsert({
        id: 'demo_hpticket_state',
        state: statePayload,
        updated_at: new Date().toISOString(),
      });
    if (error) {
      console.warn('[Supabase Sync] Upsert failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Sync] Error during sync:', err);
    return false;
  }
}

/**
 * Tải trạng thái Mock Database từ Supabase về.
 */
export async function loadStateFromSupabase(): Promise<Record<string, any> | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('mock_db_state')
      .select('state')
      .eq('id', 'demo_hpticket_state')
      .single();
    if (error || !data) {
      return null;
    }
    return data.state;
  } catch (err) {
    console.warn('[Supabase Sync] Error loading state:', err);
    return null;
  }
}

/**
 * Lưu dữ liệu bản ghi vào bảng demo tùy ý trên Supabase (vd: demo_khach_hang, feedbacks...)
 */
export async function insertDemoRecord(table: string, record: Record<string, any>): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from(table).insert([record]);
    return !error;
  } catch {
    return false;
  }
}
