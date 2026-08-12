# TỔNG QUAN HỆ THỐNG QUẢN LÝ BÁN VÉ VÀ KIỂM SOÁT RA VÀO HPTICKET
*(HPTicket Modular Monolith Management System)*

---

## 1. GIỚI THIỆU CHUNG

**HPTicket** là giải pháp phần mềm toàn diện theo kiến trúc **Modular Monolith** chuyên dụng cho các khu du lịch, công viên giải trí, danh lam thắng cảnh, khu vui chơi, sự kiện và bãi xe. 

Hệ thống tích hợp đầy đủ các luồng nghiệp vụ từ **Bán vé tại điểm POS**, **Phát hành mã QR Code bảo mật**, **Kiểm soát cổng vào tự động (Turnstile Gate Control)**, đến **Quản trị phân quyền (IAM)** và **Báo cáo doanh thu - lưu lượng khách**.

---

## 2. KIẾN TRÚC VÀ CÁC MODULE CHÍNH

Hệ thống HPTicket bao gồm **10 Module nghiệp vụ cốt lõi**:

```
                               ┌────────────────────────────────────────┐
                               │       HPTICKET MANAGEMENT SYSTEM       │
                               └───────────────────┬────────────────────┘
                                                   │
     ┌───────────────────┬─────────────────────┼─────────────────────┬───────────────────┐
     ▼                   ▼                     ▼                     ▼                   ▼
┌─────────┐        ┌──────────┐        ┌──────────────┐        ┌──────────┐        ┌──────────┐
│ 1. POS  │        │ 2. Gate  │        │ 3. Orders    │        │ 4. IAM   │        │ 5. Report│
│ Bán Vé  │        │ Soát Vé  │        │ Đơn Hàng Vé  │        │ PhânQuyền│        │ Báo Cáo  │
└─────────┘        └──────────┘        └──────────────┘        └──────────┘        └──────────┘
     │                   │                     │                     │                   │
     ▼                   ▼                     ▼                     ▼                   ▼
┌─────────┐        ┌──────────┐        ┌──────────────┐        ┌──────────┐        ┌──────────┐
│6.Ticket │        │7.Location│        │ 8. Marketing │        │9.Inventory│       │10. Logs  │
│  LoạiVé │        │Địa Điểm  │        │ Khuyến Mãi   │        │ Kho Phôi │       │ Nhật Ký  │
└─────────┘        └──────────┘        └──────────────┘        └──────────┘        └──────────┘
```

---

## 3. CHI TIẾT NGHIỆP VỤ TỪNG CHỨC NĂNG

### 3.1. Module Bán Vé POS (POS Module)
* **Nghiệp vụ chính:**
  * **Chọn loại vé & Sản phẩm dịch vụ:** Cho phép thu ngân chọn nhanh các loại vé (Vé người lớn, Vé trẻ em, Vé cao tuổi, Vé combo kèm xe điện/trò chơi...).
  * **Chọn ngày sử dụng vé (Visit/Usage Date):** Cho phép thu ngân chọn ngày khách hàng dự định thăm quan/sử dụng vé (mặc định là ngày hiện tại hoặc linh hoạt chọn ngày đặt trước trong tương lai), làm cơ sở cho bộ lọc và xác thực ngày sử dụng tại cổng kiểm soát.
  * **Áp dụng khuyến mãi & Giảm giá:** Tích hợp mã voucher/coupon giảm giá theo % hoặc số tiền cố định từ các chiến dịch Marketing.
  * **Thanh toán đa phương thức:**
    * Tiền mặt (Cash) với tính năng tính tiền thừa tự động.
    * Chuyển khoản QR Ngân hàng (VietQR / Chuyển khoản trực tiếp với mã VietQR tự động sinh).
    * Thẻ POS / Ví điện tử.
  * **Phát hành & In vé tức thì:** Sinh mã QR bảo mật riêng biệt cho từng lượt vé (`HPT-PASS-xxx`). Hỗ trợ in vé qua máy in nhiệt POS 80mm hoặc xuất mã điện tử gửi qua Email/Zalo.

---

### 3.2. Module Kiểm Soát Cổng Vào (Gate Scanner & Turnstile Module)
* **Nghiệp vụ chính:**
  * **Quét mã QR vé khách hàng:** Tiếp nhận mã QR từ máy quét mã vạch USB, camera điện thoại/tablet hoặc máy quét chuyên dụng lắp tại cổng xoay Turnstile.
  * **Xác thực logic & Thời gian thực (Real-time Validation):**
    * Tự động kiểm tra trạng thái vé: **Hợp lệ (Chưa sử dụng)** -> Chuyển trạng thái sang **Đã sử dụng (Used)** và ghi nhận thời gian qua cổng.
    * Từ chối nếu vé đã được quét trước đó (Cảnh báo quay vòng vé - Antipassback).
    * Kiểm tra hạn sử dụng vé và đúng khung giờ/ngày áp dụng.
  * **Tín hiệu điều khiển cổng xoay (Turnstile Control Signal):** Phát lệnh mở cổng (Green Pass), từ chối (Red Reject) kèm âm thanh / còi báo động.
  * **Quét mã QR Nhân viên (Staff Entry Verification):** Cho phép nhân viên nội bộ quét mã thẻ nhân viên (mã QR/SĐT) để qua cổng kiểm tra hoặc điểm danh ca làm việc.
  * **Nhật ký cổng vào (Gate Access Logs):** Ghi nhận chi tiết theo thời gian thực: Mã vé, Tên khách/NV, Tên cổng (Gate 01, Gate 02, Turnstile 03...), Kết quả (Thành công / Thất bại) và lý do.

---

### 3.3. Module Quản Lý Đơn Hàng & Mã Vé (Orders & Issued Tickets Module)
* **Nghiệp vụ chính:**
  * **Tra cứu & Tìm kiếm:** Tìm kiếm đơn hàng theo Mã đơn (`ORD-xxx`), Số điện thoại khách hàng, Tên khách hàng hoặc Mã QR vé.
  * **Quản lý danh sách vé phát hành (Issued Tickets):** Xem chi tiết từng mã vé trong đơn hàng, trạng thái lượt đi (Chưa dùng, Đã qua cổng, Đã hủy).
  * **In lại vé (Re-print QR):** Hỗ trợ in lại mã QR vé cho khách hàng trong trường hợp mất vé giấy hoặc vé điện tử không hiển thị được.
  * **Hủy vé & Hoàn tiền (Refund / Cancel):** Xử lý nghiệp vụ hủy đơn hàng/vé chưa qua cổng theo chính sách hoàn tiền của đơn vị.

---

### 3.4. Module Khai Báo Địa Điểm & Điểm Bán (Location & Gate Configuration)
* **Nghiệp vụ chính:**
  * **Khai báo Doanh nghiệp / Khu du lịch:** Cấu hình tên công ty, địa chỉ, mã số thuế, hotline và logo thương hiệu hiển thị trên cuống vé.
  * **Quản lý Khu vực & Phân khu (Zones):** Chia hệ thống thành các phân khu chức năng (VD: Zone A - Khu công viên nước, Zone B - Khu trò chơi mạo hiểm).
  * **Quản lý Quầy POS & Cổng kiểm soát (POS Terminals & Gates):** Khai báo danh sách các quầy bán vé và các máy kiểm soát cửa/cổng Turnstile kết nối trong mạng LAN.

---

### 3.5. Module Cấu Hình Loại Vé & Bảng Giá (Ticketing & Pricing Module)
* **Nghiệp vụ chính:**
  * **Khai báo Đối tượng khách hàng:** Phân loại đối tượng (Người lớn, Trẻ em, Học sinh/Sinh viên, Người cao tuổi, Thẻ cư dân/VIP).
  * **Khai báo Loại vé & Mẫu vé (Ticket Templates):**
    * Vé lượt đơn (Một lần vào cổng).
    * Vé Combo (Có hiệu lực qua nhiều cổng soát vé khác nhau).
    * Vé ngày / Vé tháng / Thẻ thành viên cố định.
  * **Cấu hình Bảng giá linh hoạt:** Đặt giá vé áp dụng theo ngày thường (Weekday), ngày cuối tuần (Weekend), hoặc ngày lễ tết (Holidays).

---

### 3.6. Module Marketing & Khuyến Mãi (Marketing & Source Group Module)
* **Nghiệp vụ chính:**
  * **Quản lý Nhóm nguồn khách:** Khai báo và phân loại nguồn khách (Khách lẻ tự do, Đoàn tour du lịch, Đại lý lữ hành, Công ty đối tác).
  * **Chương trình Khuyến mãi (Promotions):** Tạo các mã giảm giá, chương trình chiết khấu theo % hoặc tiền mặt, áp dụng tự động tại quầy POS.

---

### 3.7. Module Phân Quyền & Quản Trị IAM (Identity & Access Management)
* **Nghiệp vụ chính:**
  * **Quản lý Tài khoản Nhân viên:** Tạo lập và quản lý tài khoản truy cập hệ thống (Họ tên, SĐT, Username, Mật khẩu, Mã QR định danh).
  * **Phân quyền Vai trò (RBAC - Role-Based Access Control):**
    * Định nghĩa các Vai trò (Admin, Thu ngân POS, Nhân viên Soát vé cổng, Quản lý kho, Kế toán).
    * Gán phân quyền chi tiết (Permissions) cho từng chức năng.
  * **Cấp Thẻ Nhân Viên QR Code đa định dạng:**
    * Chế độ **Văn Bản & SĐT:** Camera điện thoại cá nhân thông thường quét sẽ hiển thị trực tiếp Họ tên, SĐT, Chức danh.
    * Chế độ **Danh Bạ vCard:** Cho phép quét lưu trực tiếp thông tin liên hệ vào danh bạ điện thoại.
    * Chế độ **Mã Cổng Turnstile:** Dùng cho máy quét USB cổng soát vé chuyên dụng.
  * **Tích hợp Camera Scanner trực tiếp (Live Camera QR Scanner):** Hỗ trợ bật camera trên máy tính / thiết bị di động để quét mã thẻ nhân viên hoặc mã vé tức thì.

---

### 3.8. Module Quản Lý Kho & Phôi Vé (Inventory Module)
* **Nghiệp vụ chính:**
  * **Quản lý Hàng hóa đi kèm:** Nhập - Xuất - Tồn các mặt hàng kinh doanh tại điểm du lịch (Nước uống, Đồ lưu niệm, Cho thuê trang phục/dụng cụ).
  * **Quản lý Phôi vé & Thẻ từ:** Quản lý số lượng phôi vé giấy in nhiệt, thẻ từ NFC/RFID cấp cho các quầy POS.

---

### 3.9. Module Báo Cáo & Thống Kê (Reports & Analytics Module)
* **Nghiệp vụ chính:**
  * **Báo cáo Doanh thu Bán vé:** Thống kê chi tiết doanh thu theo ca làm việc, theo thu ngân, theo phương thức thanh toán (Tiền mặt, Chuyển khoản, POS).
  * **Báo cáo Lưu lượng Khách qua cổng:** Biểu đồ phân tích số lượng lượt khách vào cổng theo từng khung giờ trong ngày (Peak hours), giúp tối ưu hóa nhân sự soát vé.
  * **Báo cáo Phân tích Loại vé:** Đánh giá loại vé bán chạy nhất, doanh thu theo phân khu/đối tượng.

---

### 3.10. Module Nhật Ký & Nhật Ký Bảo Mật (System Audit Logs Module)
* **Nghiệp vụ chính:**
  * Ghi nhận lịch sử thao tác của tất cả người dùng trên hệ thống (Tạo đơn, Hủy vé, Thay đổi bảng giá, Đăng nhập, Thay đổi quyền).
  * Truy vết sự cố nghiệp vụ và đảm bảo tính minh bạch dữ liệu.

---

## 4. QUY TRÌNH LUỒNG HOẠT ĐỘNG CHUẨN (WORKFLOW)

```
[Khách Hàng] ──► [Quầy POS / Online] ──► [Thanh Toán & In Vé Mã QR]
                                                      │
                                                      ▼
[Mở Cổng Tự Động] ◄── [Đạt Yêu Cầu] ◄── [Quét Mã QR Tại Cổng Turnstile]
```

1. **Bước 1: Bán vé & Phát hành:** Thu ngân chọn loại vé trên POS, nhận thanh toán (Tiền mặt / QR Ngân hàng) -> Hệ thống sinh mã `HPT-PASS-xxx` & in cuống vé QR Code.
2. **Bước 2: Soát vé tại Cổng:** Khách hàng cầm vé đến cổng xoay Turnstile và đưa mã QR vào đầu quét.
3. **Bước 3: Xác thực & Mở cổng:** Máy quét gửi mã đến dịch vụ Soát vé -> Hệ thống kiểm tra hợp lệ -> Đổi trạng thái vé thành "Đã sử dụng" -> Phát tín hiệu mở cổng xoay cho khách vào.
4. **Bước 4: Báo cáo & Lưu trữ:** Lượt vào được ghi nhận ngay lập tức vào Gate Access Logs và cập nhật lên Biểu đồ lưu lượng thời gian thực.

---

## 5. TỔNG KẾT
Hệ thống **HPTicket** đáp ứng hoàn hảo các yêu cầu về tốc độ xử lý bán vé, tính an toàn trong kiểm soát cửa vào, chống thất thoát vé, đồng thời mang lại khả năng quản trị vận hành linh hoạt cho ban quản lý khu du lịch / công viên.
