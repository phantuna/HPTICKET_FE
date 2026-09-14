-- ==============================================================================
-- FILE TẠO DATABASE CHO SUPABASE (CHẠY ĐỘC LẬP TỪ FRONTEND)
-- ==============================================================================
-- Hướng dẫn: 
-- 1. Copy toàn bộ nội dung file này.
-- 2. Mở Supabase Dashboard -> Chọn mục "SQL Editor".
-- 3. Dán vào và nhấn "RUN".
-- ==============================================================================

-- 1. Bảng lưu trữ thông tin Demo Khách hàng
CREATE TABLE IF NOT EXISTS public.demo_khach_hang (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ho_ten TEXT NOT NULL,
    so_dien_thoai TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tắt RLS để Frontend có thể tự do thêm sửa xóa (Dành cho bản Demo)
ALTER TABLE public.demo_khach_hang DISABLE ROW LEVEL SECURITY;


-- 2. Bảng lưu thông tin phụ của người dùng (từ Form ví dụ trước)
CREATE TABLE IF NOT EXISTS public.user_extra_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL, 
    cccd TEXT,
    dia_chi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tắt RLS để Frontend chèn dữ liệu không bị chặn
ALTER TABLE public.user_extra_info DISABLE ROW LEVEL SECURITY;


-- (Bạn có thể tự định nghĩa thêm các bảng khác ở dưới đây theo cú pháp tương tự)
-- Ví dụ: Bảng lưu phản hồi (Feedback)
-- CREATE TABLE IF NOT EXISTS public.feedbacks (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     noi_dung TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
-- );
-- ALTER TABLE public.feedbacks DISABLE ROW LEVEL SECURITY;

-- 3. B?ng luu tr?ng th�i to�n b? Mock DB (d�nh cho Demo Sync)
CREATE TABLE IF NOT EXISTS public.mock_db_state (
    id TEXT PRIMARY KEY,
    state JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.mock_db_state DISABLE ROW LEVEL SECURITY;
