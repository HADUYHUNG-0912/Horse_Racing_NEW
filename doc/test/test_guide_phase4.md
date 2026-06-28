# 🧪 HƯỚNG DẪN KIỂM THỬ TÍCH HỢP (INTEGRATION TEST GUIDE) - PHASE 4

Tài liệu này hướng dẫn các kịch bản kiểm thử tích hợp (end-to-end) cho các tính năng mới trong **Phase 4** bao gồm phân hệ của **Gia Huy, Huệ, Thái Châu, Thuỳ Anh, Thu Mây và Bùi Huy** trên nhánh `dev-GiaHuy`.

---

## 🛠️ Chuẩn bị môi trường & Dữ liệu mẫu

### 1. Cập nhật Database cấu trúc mới nhất
Hãy chắc chắn rằng Database của bạn đã được cập nhật đầy đủ cấu trúc bảng mới (bao gồm các bảng `Prizes`, `Awards`, và các cột bổ sung ở Phase 4):
```powershell
cd source-code/backend
# Kích hoạt venv và chạy script thiết lập cơ sở dữ liệu
.\venv312\Scripts\activate
python db_setup.py
```

### 2. Tài khoản thử nghiệm mẫu (Seeding Data)
*   **Admin:** `admin` | `password123`
*   **Chủ ngựa (Owner):** `owner1` | `owner123`
*   **Nài ngựa (Jockey):** `jockey1` | `jockey123`
*   **Trọng tài (Referee):** `referee1` | `referee123`
*   **Khán giả (Spectator):** `spectator1` | `spec123`

---

## 📋 Các kịch bản thử nghiệm tích hợp (E2E Test Cases)

### Kịch bản 1: Quản trị viên quản lý Giải đấu, Vòng đấu, Trận đấu & Cơ cấu giải thưởng
> **Mục tiêu:** Kiểm tra tab Tổng quan Analytics, cấu hình Giải thưởng cho giải đấu và đổi trạng thái để kích hoạt tự động trao giải.

1.  **Đăng nhập** hệ thống với tài khoản Admin (`admin` / `password123`).
2.  **Xem tab "📊 Tổng quan hệ thống":**
    *   Nhấn nút **"📊 Tải thống kê"**.
    *   **Kết quả mong đợi:** Hiển thị chi tiết số lượng người dùng, giải đấu, trận đấu, nài ngựa, thống kê độ chính xác dự đoán của khán giả, và Top 5 nài ngựa/ngựa xuất sắc nhất.
3.  **Xem tab "🏆 Quản lý Giải đấu":**
    *   Tạo một giải đấu mới (ví dụ: *"Giải đua Thử Nghiệm Phase 4"*).
4.  **Cấu hình Giải thưởng:**
    *   Chuyển sang tab **"🏅 Quản lý Giải thưởng"** (hoặc **"🥇 Cấu hình Giải thưởng"**).
    *   Chọn giải đấu *"Giải đua Thử Nghiệm Phase 4"*.
    *   Nhập thông tin tạo Giải thưởng:
        *   **Hạng:** `1` | **Tên giải:** `Cúp Vô Địch Phase 4` | **Trị giá:** `50000000` | **Mô tả:** `Giải nhất`
    *   Nhấn **"Tạo giải thưởng"**.
    *   **Kết quả mong đợi:** Giải thưởng mới hiển thị trong bảng danh sách ở dưới. Có nút **Xóa** hoạt động tốt gọi đến API `DELETE`.
5.  **Quy trình kết thúc giải đấu & Tự động trao giải:**
    *   Quay lại tab **"🏆 Quản lý Giải đấu"**, tìm giải đấu vừa tạo và cập nhật trạng thái giải đấu từ `UPCOMING` sang `ACTIVE`.
    *   Sau khi các trận đua của giải đấu được nhập kết quả và xác nhận hoàn thành, chuyển trạng thái giải đấu sang **`COMPLETED`**.
    *   **Kết quả mong đợi:** 
        *   Hệ thống tự động chạy logic xếp hạng và trao giải `Award` dựa trên tổng điểm của các ngựa tham gia.
        *   Chuyển sang tab **"🏆 Xem Awards"**: Bản ghi trao giải cho vị trí số 1 xuất hiện tự động kèm tên Ngựa và Jockey chiến thắng.

---

### Kịch bản 2: Quy trình Lời mời và Cập nhật Hồ sơ của Nài Ngựa (Jockey)
> **Mục tiêu:** Kiểm tra tính năng cập nhật hồ sơ cá nhân lưu trực tiếp vào Database, nhận và đồng ý lời mời thi đấu từ Chủ ngựa.

1.  **Gửi lời mời từ Chủ ngựa:**
    *   Đăng nhập bằng tài khoản Chủ ngựa (`owner1` / `owner123`).
    *   Chọn tab **"✉️ Mời Jockey"**, gửi lời mời đến Jockey (`jockey1`) tham gia thi đấu cùng ngựa của mình.
2.  **Đồng ý lời mời & Cập nhật Hồ sơ với tư cách Jockey:**
    *   Đăng nhập bằng tài khoản Jockey (`jockey1` / `jockey123`).
    *   Truy cập tab **"👤 Hồ sơ cá nhân"**:
        *   Nhập thông tin Chiều cao, Cân nặng, Số năm kinh nghiệm, Bio.
        *   Nhấn **"Lưu thay đổi hồ sơ"**.
        *   **Kết quả mong đợi:** Hệ thống báo cập nhật thành công. Tải lại trang thông tin vẫn được giữ nguyên (không bị mất do đã lưu trực tiếp vào SQL Server).
    *   Chọn tab **"✉️ Lời mời Nhận được"**:
        *   Xem chi tiết lời mời vừa được gửi từ `owner1`. Nhấn nút **"Đồng ý"**.
        *   **Kết quả mong đợi:** Lời mời chuyển sang trạng thái `ACCEPTED`.
    *   Chọn tab **"🏁 Lịch trình Đua"**:
        *   **Kết quả mong đợi:** Danh sách trận đấu mà bạn (Jockey) được xếp lịch chạy xuất hiện đầy đủ thông tin ngựa đua và thời gian chạy.

---

### Kịch bản 3: Xem Lịch thi đấu & Lịch sử vi phạm của Chủ ngựa (Horse Owner)
> **Mục tiêu:** Kiểm tra khả năng cập nhật profile, bộ lọc thời gian trận đấu sắp diễn ra (sửa múi giờ Việt Nam) và xem lịch sử vi phạm.

1.  **Đăng nhập** bằng tài khoản Chủ ngựa (`owner1` / `owner123`).
2.  **Cập nhật thông tin cá nhân:**
    *   Vào tab **"👤 Hồ sơ cá nhân"**, thay đổi Họ và tên hoặc Số điện thoại và bấm **"Cập nhật hồ sơ"**.
    *   **Kết quả mong đợi:** Giao diện lưu thành công, dữ liệu được ghi xuống bảng `Users` và `HorseOwnerProfiles` tương ứng.
3.  **Xem lịch thi đấu tương lai:**
    *   Vào tab **"📅 Lịch thi đấu của Ngựa"**.
    *   **Kết quả mong đợi:** Chỉ hiển thị các trận đấu có lịch khởi tranh **sau thời gian hiện tại của bạn** (sử dụng so sánh múi giờ Việt Nam naive).
4.  **Xem kết quả & Lịch sử vi phạm:**
    *   Vào tab **"🏆 Kết quả thi đấu"**.
    *   **Kết quả mong đợi:** Hiển thị danh sách ngựa đua của bạn kèm thứ hạng kết quả, điểm số, danh sách các vi phạm/mức phạt tiền do Trọng tài ghi nhận.

---

### Kịch bản 4: Trọng tài quản lý chi tiết trận đấu & Giới hạn mức phạt
> **Mục tiêu:** Kiểm tra giao diện xem chi tiết trận đấu (làn chạy, ngựa, jockey) và các ràng buộc khi ghi nhận vi phạm.

1.  **Đăng nhập** bằng tài khoản Trọng tài (`referee1` / `referee123`).
2.  **Xem chi tiết danh sách trận đấu:**
    *   Trong bảng danh sách các trận đấu được phân công, nhấn vào dòng trận đấu hoặc nút **"Xem chi tiết"**.
    *   **Kết quả mong đợi:** Một bảng thông tin chi tiết hiện ra bên dưới hiển thị rõ: Số làn chạy, Tên ngựa đua, Tên Jockey điều khiển, Trạng thái tham gia.
3.  **Ghi nhận vi phạm & Kiểm tra giới hạn phạt:**
    *   Tìm trận đấu, nhấn nút **"Nhập vi phạm"**.
    *   Nhập số tiền phạt là `-50000` (âm) hoặc `20000000` (vượt quá 9.999.999 VNĐ). Nhấn Lưu.
    *   **Kết quả mong đợi:** Hệ thống báo lỗi và chặn lại (Số tiền phạt không được âm và giới hạn tối đa là 9.999.999 VNĐ).
    *   Nhập số tiền phạt hợp lệ là `1500000`, mô tả vi phạm, bấm Lưu.
    *   **Kết quả mong đợi:** Hệ thống báo thành công, vi phạm được ghi nhận.

---

### Kịch bản 5: Chặn dự đoán khi quá giờ của Khán giả (Spectator)
> **Mục tiêu:** Kiểm tra cơ chế tự động khóa nút/form dự đoán khi thời gian hiện tại vượt quá giờ thi đấu của trận đấu.

1.  **Đăng nhập** bằng tài khoản Khán giả (`spectator1` / `spec123`).
2.  Chuyển sang tab **"Dự đoán Trận đua"**.
3.  Tìm một trận đấu có thời gian bắt đầu chạy **đã trôi qua** so với thời gian thực tế (ví dụ: trận đấu chạy lúc 8:00 sáng nay).
4.  **Kết quả mong đợi:** 
    *   Nút gửi dự đoán của trận đấu đó bị mờ đi (Disabled).
    *   Hệ thống hiển thị trạng thái: `"Đã quá giờ dự đoán"` hoặc `"Trận đấu đã bắt đầu"`.
    *   Nếu cố tình gọi API gửi lên, Backend sẽ trả về lỗi `HTTP 400 Bad Request: Prediction time has ended`.

---

### Kịch bản 6: Bộ lọc giải đấu động trên Bảng xếp hạng & Tab giải thưởng
> **Mục tiêu:** Kiểm tra tính năng lọc động gọi từ Backend cho Bảng xếp hạng chung và Tab giải thưởng của Jockey.

1.  **Kiểm tra Bảng xếp hạng chung:**
    *   Chuyển sang trang **Leaderboard (Bảng xếp hạng)** từ thanh điều hướng chính.
    *   Mặc định khi chọn **"Tất cả"**: Hiển thị bảng xếp hạng toàn cục.
    *   Click vào các nút giải đấu cụ thể (ví dụ: *"Giải đua Thử Nghiệm Phase 4"*).
    *   **Kết quả mong đợi:**
        *   Component hiển thị chữ `"📋 Đang xem: [Tên giải đấu] — Đang tải dữ liệu..."` trong giây lát.
        *   Dữ liệu được tải động từ API `/results/rankings?tournament_id={id}` và cập nhật chính xác thứ tự xếp hạng của Ngựa & Jockey trong giải đấu đó.
2.  **Kiểm tra Tab giải thưởng trong Hồ sơ Jockey:**
    *   Đăng nhập bằng tài khoản Jockey (`jockey1` / `jockey123`).
    *   Chuyển sang tab **"🏆 Giải thưởng & Thành tích thi đấu"**.
    *   Sử dụng dropdown chọn giải đấu cụ thể.
    *   **Kết quả mong đợi:** Điểm số tích lũy, Hạng cao nhất và danh sách các giải thưởng được cập nhật động và khớp hoàn toàn với kết quả của giải đấu được chọn.
