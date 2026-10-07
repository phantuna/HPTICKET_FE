-- ==============================================================================
-- HPTICKET DEMO - SUPABASE DATABASE INITIALIZATION SCRIPT
-- ==============================================================================
-- HUONG DAN SU DUNG:
-- 1. Dang nhap vao Supabase Dashboard: https://supabase.com/dashboard/project/whzglfhvkuivwfhxkfgz
-- 2. Chon muc "SQL Editor" o menu ben trai.
-- 3. Nhan "New query", dan toan bo noi dung file nay vao.
-- 4. Nhan nut xanh "Run" (hoac bam Ctrl + Enter) de thuc thi.
-- ==============================================================================

-- 1. BANG LUU TRANG THAI MOCK DATABASE (DONG BO 2 CHIEU CHO BAN DEMO)
-- Bang nay chua toan bo kho du lieu: San pham, Ve, Quay POS, Don hang, Khuyen mai...
CREATE TABLE IF NOT EXISTS public.mock_db_state (
    id TEXT PRIMARY KEY,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tat RLS de ung dung Frontend co the doc ghi bang Anon Key
ALTER TABLE public.mock_db_state DISABLE ROW LEVEL SECURITY;

-- 2. BANG LUU THONG TIN KHACH HANG / LEADS THU THAP TU FORM
CREATE TABLE IF NOT EXISTS public.demo_khach_hang (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ho_ten TEXT NOT NULL,
    so_dien_thoai TEXT,
    email TEXT,
    nhom_khach TEXT DEFAULT 'KHACH_LE',
    ghi_chu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.demo_khach_hang DISABLE ROW LEVEL SECURITY;

-- 3. BANG LUU DON HANG POS (TUY CHON LUU RIENG BANG DOC LAP)
CREATE TABLE IF NOT EXISTS public.demo_don_hang (
    id TEXT PRIMARY KEY,
    order_code TEXT NOT NULL,
    sales_counter_name TEXT,
    customer_name TEXT,
    total_amount NUMERIC(15, 2) DEFAULT 0,
    final_amount NUMERIC(15, 2) DEFAULT 0,
    payment_method TEXT,
    status TEXT DEFAULT 'PAID',
    items JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.demo_don_hang DISABLE ROW LEVEL SECURITY;

-- 4. BANG LUU Y KIEN PHAN HOI / FEEDBACK TU KHACH HANG
CREATE TABLE IF NOT EXISTS public.demo_phan_hoi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nguoi_gui TEXT,
    danh_gia INTEGER CHECK (danh_gia >= 1 AND danh_gia <= 5),
    noi_dung TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.demo_phan_hoi DISABLE ROW LEVEL SECURITY;

-- 5. BANG LUU THONG TIN NGUOI DUNG BO SUNG
CREATE TABLE IF NOT EXISTS public.user_extra_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    cccd TEXT,
    dia_chi TEXT,
    so_dien_thoai TEXT,
    ghi_chu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_extra_info DISABLE ROW LEVEL SECURITY;

-- 6. BAT TINH NANG REALTIME CHO SUPABASE (NEU MUON DU LIEU TU DONG NHAY GIAO DIEN)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'mock_db_state'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.mock_db_state;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Bo qua neu publication chua duoc khoi tao
        NULL;
END $$;

-- THONG BAO HOAN TAT
COMMENT ON TABLE public.mock_db_state IS 'Kho luu tru trang thai Mock Database dong bo voi HPTicket Frontend Demo';
COMMENT ON TABLE public.demo_khach_hang IS 'Danh sach khach hang dang ky tu Form Frontend';
