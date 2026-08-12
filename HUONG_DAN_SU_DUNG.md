# TÀI LIỆU HƯỚNG DẪN SỬ DỤNG HPTICKET

## 1. Tổng quan
HPTicket là hệ thống quản lý bán vé và soát vé thông minh dành cho các khu vui chơi giải trí. Hệ thống giúp thu ngân bán vé nhanh chóng tại quầy, áp dụng các mã khuyến mãi tự động, và hỗ trợ ban quản lý cấu hình các tính năng hệ thống dễ dàng. 

## 2. Bắt đầu nhanh (Getting Started)
**Cách đăng nhập vào hệ thống:**
- **Step 1:** Mở trình duyệt web và truy cập vào đường dẫn phần mềm (Ví dụ: `http://localhost:3000`).
- **Step 2:** Tại thanh công cụ trên cùng, nhấn vào nút có biểu tượng chìa khóa **`🔐 Đăng nhập (CSDL Backend)`**.
- **Step 3:** Bảng đăng nhập sẽ hiện ra. Chọn tài khoản được cấp (Ví dụ: nhấn vào `Admin` hoặc `Thu Ngân POS`), sau đó nhấn nút **`ĐĂNG NHẬP (NHẬN JWT TOKEN)`**. 
- **Step 4:** Khi đăng nhập thành công, tên của bạn sẽ hiển thị ở góc trên cùng bên phải.

*(Gợi ý: [Chèn hình ảnh nút đăng nhập tại đây])*

## 3. Hướng dẫn theo tính năng chính (Core Features)

### 3.1. Cách bán vé và thanh toán (Dành cho Thu ngân)
- **Step 1:** Ở thanh menu bên trái, chọn mục **`C. Quản Lý Vé & POS`** -> **`1. POS / Đặt vé / Bán vé thu ngân`**.
- **Step 2 (Tùy chọn):** Chọn nhóm khách ở ô **`Nhóm nguồn khách`** để hệ thống tự động giảm % giá vé (VD: Nhóm VIP).
- **Step 3:** Nếu khách hàng cung cấp mã giảm giá, bấm vào ô **`Khuyến mại`** và chọn mã chương trình tương ứng.
- **Step 4:** Ở danh sách vé bên phải màn hình, **tích vào ô vuông** cạnh loại vé khách muốn mua. Tổng tiền sẽ tự động cập nhật bên dưới.
- **Step 5:** Nhấn nút màu xanh **`Thanh toán & In vé`** ở góc dưới cùng bên phải.
- **Step 6:** Cửa sổ Hóa đơn hiện ra, bạn nhấn **`In Ngay`** để xuất vé ra máy in nhiệt, sau đó nhấn **`Hoàn Tất Đơn Vé`** để trở về màn hình sẵn sàng đón khách tiếp theo.

*(Gợi ý: [Chèn hình ảnh màn hình POS và giỏ hàng tại đây])*

### 3.2. Cách tạo chương trình khuyến mại mới (Dành cho Admin)
- **Step 1:** Ở thanh menu bên trái, chọn **`A. Khai Báo Hệ Thống`** -> **`15. Khai báo chương trình khuyến mại`**.
- **Step 2:** Nhấn nút **`Thêm mới`**.
- **Step 3:** Điền các thông tin quan trọng: **Mã Khuyến Mại** (VD: SUMMER2026), **Tên Chương Trình**, và **Số Tiền Giảm Giá (VND)**.
- **Step 4:** Nhấn **`Lưu Khuyến Mại`**. 
- **Step 5 (Quan trọng):** Về lại màn hình POS và nhấn nút biểu tượng **Reload/Sync** (vòng lặp) trên thanh trên cùng để hệ thống làm mới và cập nhật mã giảm giá bạn vừa tạo.

### 3.3. Cách giả lập soát vé tại cổng
- **Step 1:** Vào mục **`C. Quản Lý Vé & POS`** -> **`3. Kiểm tra vé / Soát cổng`**.
- **Step 2:** Ở ô **`Chọn Thiết Bị Cổng Soát`**, chọn một thiết bị trong danh sách.
- **Step 3:** Nhấn vào các nút giả lập (Ví dụ: **`Vé Lẻ Thường (1 Lượt)`**) để xem hệ thống thông báo trạng thái vé (Màu Xanh là hợp lệ, Màu Đỏ là từ chối).

## 4. Câu hỏi thường gặp (FAQ) & Khắc phục sự cố

- **Lỗi: Không áp dụng được mã giảm giá?**
  *Cách xử lý:* Vui lòng kiểm tra xem mã đã hết hạn chưa, hoặc vé bạn chọn có được phép áp dụng giảm giá không. Hãy thử nhấn nút **Reload/Sync** (biểu tượng vòng lặp ở thanh trên cùng) để làm mới dữ liệu hệ thống.
  
- **Lỗi: Không in được biên lai vé?**
  *Cách xử lý:* Đảm bảo máy in đã bật nguồn và cắm cáp kết nối vào máy tính. Kiểm tra lại cuộn giấy in nhiệt xem mặt láng của giấy đã được ngửa lên trên chưa.
  
- **Lỗi: Danh sách hóa đơn không nhìn thấy hàng đầu tiên?**
  *Cách xử lý:* Do thanh công cụ có thể tạm thời che khuất, bạn hãy click chuột vào bảng danh sách hóa đơn và cuộn chuột (hoặc kéo thanh cuộn) lên trên cùng để xem dòng đầu.
  
- **Lỗi: Hệ thống không tải được dữ liệu, hoặc báo lỗi khi truy cập trang?**
  *Cách xử lý:* Phiên đăng nhập của bạn có thể đã hết hạn. Hãy click vào **[Đăng xuất]** trên cùng, sau đó bấm **`🔐 Đăng nhập (CSDL Backend)`** để đăng nhập lại.
