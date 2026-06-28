# 🐛 Báo Cáo Lỗi & Khuyến Nghị Sửa Đổi - Phase 4 (Gia Huy - Backend Admin)

*   **Nhánh Git:** `feature/be-admin-phase4-prizes`
*   **Người thực hiện:** Gia Huy
*   **Trạng thái review:** Cần cập nhật lại code (Có lỗi Regression nghiêm trọng)

---

## 🚨 CÁC LỖI NGHIÊM TRỌNG (REGRESSIONS)
Do nhánh của bạn được tách ra hoặc cập nhật từ phiên bản cũ mà chưa gộp đầy đủ các cập nhật mới nhất trên nhánh chính `dev-GiaHuy`, việc push code của bạn đã vô tình ghi đè và xóa mất các sửa đổi/vá lỗi của nhóm trưởng trước đó. Vui lòng khôi phục lại các nội dung sau:

### 1. Model cơ sở dữ liệu bị mất các trường và property vá lỗi
*   **File:** [database_models.py](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/backend/app/models/database_models.py)
*   **Lỗi chi tiết:**
    *   Bị xóa mất hai cột `phone_number` và `avatar` trong bảng `User`.
    *   Bị xóa mất cột `favorite_jockey` trong bảng `SpectatorProfile`.
    *   Bị xóa sạch các `@property` helper dùng để map tên thật thay vì hiển thị ID trong `JockeyInvitation` (gồm: `owner_name`, `horse_name`, `tournament_name`, `jockey_name`).
*   **Hậu quả:** Gây crash lỗi 500 khi đăng nhập/cập nhật thông tin profile khán giả. Làm giao diện của Jockey và Owner quay trở lại hiển thị ID thô thay vì tên thật (Tái phát lỗi Step 9 & 10).
*   **Khắc phục:** Giữ lại các cột và thuộc tính `@property` này trong model `User`, `SpectatorProfile`, `JockeyInvitation`.

### 2. Mất logic kiểm tra trùng lịch trận đua và ngày giải đấu
*   **File:** [races.py](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/backend/app/api/v1/races.py)
*   **Lỗi chi tiết:**
    *   Bị xóa mất đoạn kiểm tra trùng lịch thi đấu của Ngựa và Jockey trong vòng 2 tiếng khi xếp lịch (`horse_conflicts`, `jockey_conflicts`).
    *   Bị xóa mất đoạn kiểm tra giờ đua phải nằm trong ngày bắt đầu và kết thúc của giải đấu khi tạo trận hoặc lập lịch.
*   **Hậu quả:** Admin có thể xếp lịch cho một nài ngựa/ngựa chạy 2 trận cùng lúc hoặc ngoài ngày giải đấu diễn ra.
*   **Khắc phục:** Khôi phục lại các logic validation kiểm tra trùng lịch đua này.

### 3. Mất quyền kiểm soát danh sách ngựa theo vai trò Owner
*   **File:** [horses.py](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/backend/app/api/v1/horses.py)
*   **Lỗi chi tiết:** Bị xóa mất dependency `current_user = Depends(get_current_user)` và logic lọc ngựa theo ID của Owner hiện tại khi lấy danh sách ngựa.
*   **Hậu quả:** Lộ dữ liệu toàn bộ ngựa trong hệ thống cho bất kỳ tài khoản Owner nào đăng nhập.
*   **Khắc phục:** Khôi phục kiểm tra role `OWNER` để tự động trả về đúng danh sách ngựa của họ.

### 4. Mất bộ lọc bảng xếp hạng theo Giải đấu (Leaderboard Filter)
*   **File:** [results.py](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/backend/app/api/v1/results.py)
*   **Lỗi chi tiết:** Trong API `GET /results/rankings`, bạn đã xóa mất parameter `tournament_id: Optional[int] = None` và khối code tính toán điểm số xếp hạng động theo từng giải đấu.
*   **Hậu quả:** Phá vỡ tính năng lọc bảng xếp hạng Ngựa & Jockey theo giải đấu ở phía giao diện (frontend chọn giải đấu nào API cũng chỉ trả về bảng xếp hạng chung toàn cục).
*   **Khắc phục:** Giữ nguyên tham số `tournament_id` và logic tính điểm động theo giải đấu như ở nhánh chính `dev-GiaHuy`.

### 5. Ghi đè giao diện AdminPanel.js làm mất validation số nhập vào
*   **File:** [AdminPanel.js](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/frontend/app/dashboard/components/AdminPanel.js)
*   **Lỗi chi tiết:** Do ghi đè file cũ, bạn đã xóa mất các thuộc tính `onKeyDown` và `onChange` chặn nhập ký tự lạ (`e`, `-`, `.`) và chuẩn hóa giá trị nhỏ nhất về `1` tại các ô số làn chạy (lane number) và khoảng cách (distance). Ngoài ra, nút thay đổi trạng thái đăng ký của chủ ngựa quay lại `PENDING` cũng bị xóa.
*   **Khắc phục:** Hãy giữ nguyên file `AdminPanel.js` ở nhánh gốc và chỉ thay đổi những phần thật sự cần thiết.

---

## ⚙️ CÁC THAY ĐỔI CẤU HÌNH CẦN LƯU Ý
*   **File:** [config.py](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/backend/app/core/config.py) & [db_setup.py](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/backend/db_setup.py)
*   **Chi tiết:** Bạn đã đổi host mặc định SQL Server từ `localhost\SQLEXPRESS` sang `(localdb)\MSSQLLocalDB`.
*   **Khuyến nghị:** Nếu các thành viên khác đang cài đặt `localhost\SQLEXPRESS` local, việc này sẽ làm hỏng kết nối DB của họ. Nên khôi phục lại host mặc định là `localhost\SQLEXPRESS` và cấu hình host của bạn qua biến môi trường `.env` (`SQL_SERVER_HOST`).

---

## 🤝 CHỒNG LẤN GIAO DIỆN (DUPLICATE UI)
*   Bạn đã tự viết một component giao diện quản lý giải thưởng là [PrizesPanel.js](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/frontend/app/dashboard/components/PrizesPanel.js). Trong khi đó, Huệ (Frontend Admin) cũng tự code phần này trực tiếp trong `AdminPanel.js`.
*   **Giải pháp:** Giao diện của bạn có hỗ trợ đầy đủ chức năng Xóa (API DELETE) còn của Huệ thì chưa. Nhóm trưởng sẽ quyết định giữ lại `PrizesPanel.js` của bạn và loại bỏ phần code trùng lặp của Huệ để tránh xung đột khi gộp code.
