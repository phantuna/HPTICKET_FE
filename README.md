# HPTICKET - HỆ THỐNG QUẢN LÝ BÁN VÉ VÀ KIỂM SOÁT RA VÀO
*(HPTicket Modular Monolith Management System)*

---

## 1. GIỚI THIỆU CHUNG

**HPTicket** là giải pháp phần mềm toàn diện chuyên dụng cho các khu du lịch, công viên giải trí, danh lam thắng cảnh, khu vui chơi, sự kiện và bãi xe. 

Hệ thống tích hợp đầy đủ các luồng nghiệp vụ từ **Bán vé tại điểm POS**, **Phát hành mã QR Code bảo mật**, **Kiểm soát cổng vào tự động (Turnstile Gate Control)**, đến **Quản trị phân quyền (IAM)** và **Báo cáo doanh thu - lưu lượng khách**.

---

## 2. CÁC TÍNH NĂNG NỔI BẬT

* **Bán vé & Thanh toán nhanh (POS):** Hỗ trợ thao tác bán vé siêu tốc, chọn loại vé, ngày sử dụng và tích hợp đa phương thức thanh toán (Tiền mặt, Chuyển khoản VietQR, Thẻ POS). In vé nhiệt và mã QR code tức thì.
* **Kiểm soát cổng tự động (Gate Control):** Tích hợp máy quét QR Code tại cổng xoay Turnstile. Xác thực vé theo thời gian thực (real-time validation), chống quay vòng vé (anti-passback) và tự động mở cổng.
* **Quản trị & Phân quyền (IAM):** Quản lý tài khoản nhân viên chặt chẽ theo vai trò (RBAC - Role-Based Access Control). Hỗ trợ cấp thẻ nhân viên bằng mã QR đa định dạng.
* **Báo cáo & Phân tích:** Cung cấp hệ thống báo cáo doanh thu chi tiết, trực quan hóa biểu đồ lưu lượng khách ra vào theo thời gian thực để tối ưu vận hành.
* **Quản lý danh mục linh hoạt:** Dễ dàng cấu hình bảng giá vé theo ngày thường/lễ tết, thiết lập phân khu (zones) và các chương trình khuyến mãi (Marketing).

---

## 3. CÔNG NGHỆ SỬ DỤNG (Dự kiến)

* **Frontend:** React, TypeScript, Tailwind CSS, Vite.
* **Backend:** Java Spring Boot (Kiến trúc Modular Monolith).
* **Database:** PostgreSQL.
* **Tích hợp phần cứng:** Máy in bill nhiệt 80mm, Máy quét QR code, Mạch điều khiển cổng xoay (như ZKTeco C3-200).

---

## 4. HƯỚNG DẪN KHỞI CHẠY BẢN FRONTEND

**Yêu cầu môi trường:** Node.js (phiên bản v18 trở lên).

1. Cài đặt các gói phụ thuộc (Dependencies):
   ```bash
   npm install
   ```
2. Khởi chạy ứng dụng ở môi trường phát triển (Development):
   ```bash
   npm run dev
   ```

Hệ thống sẽ chạy tại địa chỉ: `http://localhost:3000/`

---
*Tài liệu nội bộ dự án HPTicket.*
