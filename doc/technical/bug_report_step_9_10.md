# Báo Cáo Lỗi (Bug Report) - Tích Hợp Toàn Luồng Phase 1 & 2

Dựa trên kịch bản kiểm thử (test guide) và thực tế hiển thị trên ứng dụng, dưới đây là chi tiết các lỗi (bugs) được ghi nhận tại **Bước 9** và **Bước 10**.

---

## 1. Phân tích lỗi tại Bước 9 (Giao diện Jockey)

**Kịch bản yêu cầu (Expected Result):** `[Jockey2] Tab Lịch Trình Đua -> Kiểm tra "SuperHorse" xuất hiện`

**Thực tế quan sát (Actual Result):**
Dựa vào giao diện của Jockey (Sarah Jockey), chức năng Lịch trình Đua đang gặp các vấn đề sau:

1. **Lỗi logic dữ liệu (Missing Data):** Trong danh sách "Lịch trình các trận đua đã đăng ký", hoàn toàn không có sự xuất hiện của ngựa `"SuperHorse"`. Hệ thống chỉ trả về dữ liệu của ngựa "Silver Bullet" và "Pegasus". Điều này cho thấy luồng phê duyệt từ Admin (Bước 8) chưa thành công hoặc API fetch lịch trình cho Jockey đang không map đúng ID của ngựa/jockey.
2. **Lỗi hiển thị tiếng Việt (Encoding Bug):** Ở dòng thứ 3 của bảng, tên trận đua bị lỗi font chữ nghiêm trọng, hiển thị thành `"Chung k?t chính th?c"` thay vì "Chung kết chính thức".
3. **Lỗi format thời gian (UI Formatting):** Tại cột "THỜI GIAN ĐUA", định dạng ngày giờ bị dính liền vào nhau gây khó đọc cho người dùng. 
   * *Ví dụ:* `2026-06-10114:00:00` (Thiếu khoảng trắng hoặc ký tự phân cách giữa ngày `2026-06-10` và giờ `14:00:00`).

---

## 2. Phân tích lỗi tại Bước 10 (Giao diện Owner)

**Kịch bản yêu cầu (Expected Result):**
`[Owner1] Tab Giải đấu đã đăng ký -> Trạng thái hiện APPROVED`

**Thực tế quan sát (Actual Result):**
Dựa vào giao diện của Owner (Arthur Owner), quá trình kiểm tra bị chặn lại do các lỗi sau:

1. **Lỗi System Alert / Validation (Blocker):** Hệ thống ném ra một thông báo lỗi màu đỏ (Error Banner) ở ngay đầu trang: `"Horse is already registered for this tournament"`. 
   * *Nguyên nhân tiềm năng:* Luồng đăng ký ở Bước 7 có thể đã bị gửi request hai lần (double-click), hoặc backend kiểm tra trạng thái sai khiến hệ thống lầm tưởng là đã đăng ký nhưng lại không cập nhật được trạng thái cuối cùng, dẫn đến việc Owner bị kẹt ở màn hình này.
2. **Lỗi thiếu UI (Missing Menu Item):** Kịch bản yêu cầu Owner truy cập vào tab `"Giải đấu đã đăng ký"`. Tuy nhiên, trên thanh điều hướng bên trái (Sidebar) của Owner **không hề tồn tại** tab nào mang tên này. Menu hiện tại chỉ có:
   * Quản lý Ngựa
   * Mời Jockey
   * Đăng ký Giải đấu (Tab đang đứng)
   * Bảng Xếp Hạng
   * *Hệ quả:* Tester hoặc người dùng không thể thực hiện được Bước 10 do giao diện chưa được phát triển đồng bộ với tài liệu thiết kế.

---
**Khuyến nghị sửa lỗi:**
* Kiểm tra lại backend logic ở các API `/register` và `/approve` để đảm bảo luồng state thay đổi từ *Pending* sang *Approved* hoạt động chính xác.
* Bổ sung tab "Giải đấu đã đăng ký" vào hệ thống định tuyến (router) và Sidebar của Owner.
* Thêm hàm format datetime ở Frontend (ví dụ: `moment.js` hoặc `date-fns`) và set charset UTF-8 cho response trả về để sửa lỗi font chữ.
