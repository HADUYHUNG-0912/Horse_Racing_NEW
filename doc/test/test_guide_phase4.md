# 📋 HƯỚNG DẪN KIỂM THỬ TÍCH HỢP (INTEGRATION TEST GUIDE) - PHASE 4

Tài liệu này được xây dựng dựa trên kịch bản chạy thử nghiệm UAT liên hoàn quy định tại mục 3 của tài liệu **[team_task_assignment_phase4.md](file:///c:/Users/USER/.gemini/antigravity-ide/brain/8d692f35-4bb4-49cf-81fb-f0251acc762c/team_task_assignment_phase4.md)**. Hướng dẫn chi tiết từng bước kiểm thử luồng tích hợp nghiệp vụ giữa các vai trò trên nhánh `dev-GiaHuy`.

---

## 🛠️ Chuẩn bị môi trường & Dữ liệu mẫu

### 1. Cập nhật Database cấu trúc mới nhất
Để đảm bảo toàn bộ cơ sở dữ liệu (Prizes, Awards, etc.) được thiết lập sạch sẽ trước khi thực hiện UAT:
```powershell
cd source-code/backend
# Kích hoạt môi trường ảo Python
.\venv312\Scripts\activate
# Chạy script cài đặt DB và nạp seed data mặc định
python db_setup.py
```

### 2. Tài khoản thử nghiệm liên hoàn (Credentials)
*   **Admin:** `admin` | `password123`
*   **Chủ ngựa (Owner):** `owner1` | `owner123`
*   **Nài ngựa (Jockey):** `jockey1` | `jockey123`
*   **Trọng tài (Referee):** `referee1` | `referee123`
*   **Khán giả (Spectator):** `spectator1` | `spec123`

---

## 📋 Quy trình kiểm thử UAT liên hoàn (E2E UAT Workflow)

### Bước 1: Khởi tạo Giải đấu & Cơ cấu giải thưởng (Vai trò: Admin)
1.  **Đăng nhập** tài khoản Admin (`admin` / `password123`).
2.  Chuyển sang tab **"🏆 Quản lý Giải đấu"**, nhấn tạo giải đấu mới:
    *   **Tên giải:** `Giải Đua Siêu Cúp Phase 4`
    *   **Mô tả:** `Giải đấu kiểm thử tích hợp liên hoàn Phase 4`
    *   **Thời gian:** Chọn ngày bắt đầu và kết thúc phù hợp (ví dụ: ngày hôm nay).
    *   **Địa điểm:** `Đường đua Phú Thọ`
3.  Chuyển sang tab **"🏅 Quản lý Giải thưởng"**:
    *   Chọn giải đấu vừa tạo: `Giải Đua Siêu Cúp Phase 4`.
    *   Thêm cơ cấu giải thưởng:
        *   **Hạng 1:** `Cúp Vàng Phú Thọ` | **Trị giá:** `10000000` | **Mô tả:** `Dành cho ngựa vô địch`
        *   **Hạng 2:** `Cúp Bạc Phú Thọ` | **Trị giá:** `5000000` | **Mô tả:** `Dành cho ngựa về nhì`
4.  Quay lại tab **"🏆 Quản lý Giải đấu"**, tìm giải đấu vừa tạo và click vào nút **"Kích hoạt"** (hoặc nút trạng thái) để chuyển trạng thái sang **`ACTIVE`**.
5.  **Kết quả mong đợi:** 
    *   Giải đấu và các giải thưởng được tạo thành công trong DB.
    *   Trạng thái giải đấu hiển thị là `ACTIVE`.

---

### Bước 2: Cập nhật hồ sơ, Mời Jockey & Đăng ký giải (Vai trò: Chủ ngựa - Owner)
1.  **Đăng nhập** tài khoản Chủ ngựa (`owner1` / `owner123`).
2.  Chuyển sang tab **"👤 Hồ sơ cá nhân"**:
    *   Nhập/Cập nhật thông tin: Thay đổi Họ tên hoặc Số điện thoại.
    *   Nhấn **"Cập nhật hồ sơ"**.
    *   **Kết quả mong đợi:** Giao diện báo lưu thành công, tải lại trang dữ liệu mới được hiển thị đúng.
3.  Chuyển sang tab **"✉️ Mời Jockey"**:
    *   Gửi lời mời đến Jockey `jockey1` tham gia cùng một ngựa của mình tại giải đấu `Giải Đua Siêu Cúp Phase 4`.
4.  Chuyển sang tab **"🏆 Đăng ký Giải đấu"**:
    *   Chọn giải đấu `Giải Đua Siêu Cúp Phase 4`, chọn Ngựa đua và Jockey tương ứng để đăng ký tham gia giải.
5.  **Kết quả mong đợi:**
    *   Lời mời ở trạng thái `PENDING` được lưu trong bảng `JockeyInvitations`.
    *   Bản ghi đăng ký hiển thị trong danh sách ở trạng thái chờ xét duyệt.

---

### Bước 3: Phản hồi lời mời & Lập lịch trận đua (Vai trò: Jockey & Admin)
1.  **Đồng ý lời mời thi đấu (Jockey):**
    *   **Đăng nhập** tài khoản Jockey (`jockey1` / `jockey123`).
    *   Chuyển sang tab **"👤 Hồ sơ cá nhân"**, nhập các thông số (Chiều cao, Cân nặng, Số năm kinh nghiệm) và nhấn Lưu.
    *   Chuyển sang tab **"✉️ Lời mời Nhận được"**, tìm lời mời từ `owner1` và nhấn **"Đồng ý"**.
    *   **Kết quả mong đợi:** Trạng thái lời mời chuyển sang `ACCEPTED`.
2.  **Duyệt đăng ký & Xếp lịch đua (Admin):**
    *   **Đăng nhập** tài khoản Admin (`admin` / `password123`).
    *   Vào tab **"📋 Xét duyệt Đăng ký"**, tìm bản đăng ký của giải đấu `Giải Đua Siêu Cúp Phase 4` và click **"Duyệt"** (Approved).
    *   Vào tab **"🏁 Lập lịch Trận đua"**:
        *   Tạo trận đấu mới và xếp nài/ngựa vừa duyệt vào làn chạy.
        *   **Kiểm thử logic trùng lịch (Conflict Check):** Cố tình xếp nài ngựa hoặc ngựa đó vào một trận đấu khác diễn ra cách trận đấu này dưới 2 tiếng.
        *   **Kết quả mong đợi:** Hệ thống chặn lại và báo lỗi trùng lịch của ngựa/jockey.
        *   Tiến hành xếp lịch hợp lệ (trận đấu duy nhất hoặc cách nhau trên 2 tiếng).

---

### Bước 4: Giám sát, ghi nhận vi phạm & nhập kết quả (Vai trò: Trọng tài - Referee)
1.  **Đăng nhập** tài khoản Trọng tài (`referee1` / `referee123`).
2.  **Kiểm tra xem chi tiết:**
    *   Click vào trận đấu được phân công.
    *   **Kết quả mong đợi:** Hiển thị chi tiết bảng danh sách các làn chạy, tên ngựa, tên nài tương ứng đầy đủ thay vì chỉ hiện con số.
3.  **Nhập vi phạm & phạt:**
    *   Click **"Nhập vi phạm"**. Nhập số tiền phạt `-1000` hoặc `20000000` (ngoài khoảng 0 đến 9.999.999).
    *   **Kết quả mong đợi:** Hệ thống báo lỗi không hợp lệ.
    *   Nhập số tiền phạt hợp lệ (ví dụ: `1000000` VNĐ) và lưu.
    *   **Kết quả mong đợi:** Vi phạm được lưu thành công.
4.  **Nhập kết quả nháp & Xác nhận chính thức:**
    *   Nhấn **"Nhập kết quả"**, phân hạng cho các làn chạy và lưu nháp (Trận đấu chuyển sang `RESULTS_ENTERED`).
    *   Nhấn **"Xác nhận kết quả chính thức"** (Trận đấu chuyển sang `COMPLETED`).
    *   **Kết quả mong đợi:** Bảng điểm Rankings được cập nhật tự động ở Backend.

---

### Bước 5: Chặn dự đoán & Kiểm tra bảng xếp hạng (Vai trò: Khán giả - Spectator)
1.  **Đăng nhập** tài khoản Khán giả (`spectator1` / `spec123`).
2.  Chuyển sang tab **"Dự đoán Trận đua"**:
    *   Tìm trận đấu đã kết thúc hoặc trận đấu có giờ chạy nằm trong quá khứ.
    *   **Kết quả mong đợi:** Nút dự đoán bị khóa (Disabled) kèm cảnh báo quá giờ. Nếu gửi API thủ công, Backend báo lỗi `HTTP 400`.
3.  **Kiểm tra bảng xếp hạng Khán giả:**
    *   Chuyển sang trang **Leaderboard**, click tab **"Khán giả xuất sắc"**.
    *   **Kết quả mong đợi:** Hiển thị Top 10 khán giả có điểm cao nhất kèm tỷ lệ chính xác (Spectator `spectator1` cập nhật đúng điểm số nếu đoán đúng trận đấu vừa rồi).

---

### Bước 6: Dynamic Leaderboard & Tự động trao giải (Vai trò: Admin)
1.  **Kiểm tra bảng xếp hạng động:**
    *   Tại trang **Leaderboard**, chọn bộ lọc các giải đấu cụ thể qua các nút bấm giải đấu.
    *   **Kết quả mong đợi:** Dữ liệu xếp hạng thay đổi động theo từng giải đấu và hiển thị chính xác (thay vì trống trơn như lỗi cũ).
2.  **Kết thúc giải đấu & Kiểm tra trao giải tự động:**
    *   **Đăng nhập** tài khoản Admin (`admin` / `password123`).
    *   Vào tab **"🏆 Quản lý Giải đấu"**, chuyển trạng thái giải đấu `Giải Đua Siêu Cúp Phase 4` sang **`COMPLETED`**.
    *   Vào tab **"🏆 Xem Awards"**:
        *   **Kết quả mong đợi:** Bản ghi tự động trao giải tương ứng với Hạng 1 (`Cúp Vàng Phú Thọ`) và Hạng 2 (`Cúp Bạc Phú Thọ`) được ghi nhận khớp chính xác với ngựa đua/jockey đạt tổng điểm cao nhất trong giải đấu.
