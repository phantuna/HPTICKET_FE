# TÀI LIỆU KỸ THUẬT HỆ THỐNG HPTICKET

## 1. Tổng quan kiến trúc (Architecture Overview)
HPTicket là hệ thống quản lý bán vé áp dụng kiến trúc **Client-Server** theo chuẩn hiện đại:
- **Backend (Server-side):** Xây dựng bằng Spring Boot, ứng dụng mô hình Domain-Driven Design (DDD). Xử lý nghiệp vụ phức tạp như logic giảm giá một lần (single per-order discount event) và quản lý xóa mềm (soft delete).
- **Frontend (Client-side):** Xây dựng bằng React/TypeScript với Component-based architecture. Tối ưu UI/UX với TailwindCSS và giả lập in ấn biên lai nhiệt (`@media print`).
- **Luồng dữ liệu (Data Flow):** Client sẽ authenticate để lấy JWT Token, sau đó gắn vào Header của các HTTP Requests. Backend dùng Spring Security kiểm tra quyền, dùng QueryDSL truy xuất DB PostgreSQL, map kết quả sang ResponseDTO (tránh Mass Assignment) và trả về cho Client.

## 2. Yêu cầu hệ thống & Cài đặt (Setup & Installation)

### 2.1 Yêu cầu môi trường
- JDK 17+
- Node.js 18+
- PostgreSQL 14+
- Apache Maven

### 2.2 Setup Backend (Spring Boot)
1. Tạo một database mới trên PostgreSQL: 
   ```sql
   CREATE DATABASE hpticket_db;
   ```
2. Cấu hình file `application.properties` (hoặc `application.yml`):
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/hpticket_db
   spring.datasource.username=postgres
   spring.datasource.password=your_password
   ```
3. Lưu ý: Không dùng `data.sql` cứng. Khi khởi động lần đầu, `IamDataInitializer` sẽ tự động tạo cấu trúc bảng (nhờ Hibernate Auto-DDL) và seed tài khoản mặc định.
4. Build & Run:
   ```bash
   mvn clean install -DskipTests
   mvn spring-boot:run
   ```

### 2.3 Setup Frontend (React)
1. Mở terminal vào thư mục frontend:
   ```bash
   cd d:\Code\hpticket-management-system
   ```
2. Cài đặt các packages cần thiết:
   ```bash
   npm install
   ```
3. Khởi chạy môi trường Dev:
   ```bash
   npm run dev
   ```
4. Ứng dụng sẽ chạy tại `http://localhost:3000`.

## 3. Tài liệu API (API Documentation)
Mọi thao tác thay đổi dữ liệu (POST, PUT, PATCH, DELETE) hoặc truy cập dữ liệu nhạy cảm đều yêu cầu xác thực JWT.
**Header yêu cầu:** `Authorization: Bearer <your_jwt_token>`

### 3.1 API Khởi tạo Đơn bán vé POS
- **Endpoint:** `POST /api/v1/sales/orders`
- **Mô tả:** Xử lý logic tạo đơn hàng, tính toán tự động giảm giá dựa trên config ticket và promotion.
- **Request Body (JSON):**
  ```json
  {
    "customer_name": "Nguyễn Văn An",
    "phone": "0988123456",
    "promotion_code": "WINTER2026",
    "items": [
      {
        "ticket_template_id": 1,
        "quantity": 2
      }
    ]
  }
  ```
- **Response Trả về (JSON):**
  ```json
  {
    "order_code": "ORD-8AF6A651",
    "total_amount": 400000,
    "discount_amount": 50000,
    "final_amount": 350000,
    "status": "COMPLETED"
  }
  ```

*(Khuyến nghị: Sử dụng Postman Collection lưu trong source code để xem và test toàn bộ các RESTful API của hệ thống).*

## 4. Cấu trúc Database (Database Schema)
Hệ thống sử dụng PostgreSQL, tổ chức thành các Domain chính:
- **Bảng `users` (Module IAM):** Lưu thông tin tài khoản, roles. Mật khẩu được mã hóa một chiều bằng BCrypt.
- **Bảng `ticket_templates` (Module Ticketing):** Lưu định nghĩa giá vé, loại vé và flag `is_promotion_applicable`.
- **Bảng `promotions` (Module Marketing):** Lưu trữ các mã voucher, giá trị giảm giá, ngày hết hạn.
- **Bảng `orders` & `order_items` (Module Sales):** Liên kết các vé đã xuất, lưu vết lịch sử giao dịch (Audit logs).

**⚠️ Quy tắc Soft Delete:**
Tất cả các bảng quan trọng đều có cột `deleted_at`. Hệ thống cấm sử dụng lệnh `DELETE` vật lý. Mọi truy vấn Read (`GET`) bắt buộc phải thêm logic filter:
```sql
SELECT * FROM table_name WHERE deleted_at IS NULL;
```

## 5. Hướng dẫn đóng góp (Contributing Guidelines)

### 5.1 Cấu trúc thư mục (Backend DDD)
Mã nguồn được phân tách theo Domain Module thay vì Layer để dễ mở rộng:
```text
src/main/java/org/example/hpticket/
 ├── modules/
 │    ├── iam/ (Security, Users)
 │    ├── sales/ (POS, Orders)
 │    ├── marketing/ (Promotions)
 │    └── ticketing/ (Ticket config)
 │         ├── controller/
 │         ├── service/
 │         ├── repository/
 │         └── dto/
 └── common/ (Exceptions, Utils, AuditingConfig)
```

### 5.2 Quy chuẩn Code
1. **Kiến trúc DTO (Data Transfer Object):** Bắt buộc sử dụng `RequestDTO` cho dữ liệu đầu vào và `ResponseDTO` cho dữ liệu trả về. Tuyệt đối không return trực tiếp Entity ra Controller. Hàm ánh xạ phải đặt tên là `mapToDto`.
2. **Data Validation:** Sử dụng Jakarta Validation (`@NotNull`, `@Valid`) ngay tại Controller để chặn dữ liệu rác trước khi xuống Service.
3. **Commit Convention:**
   - `feat:` Thêm tính năng mới (vd: `feat: add K80 receipt printing`)
   - `fix:` Sửa lỗi (vd: `fix: recalculate promotion logic`)
   - `docs:` Cập nhật tài liệu kỹ thuật hoặc Readme.
