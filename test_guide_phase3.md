# 🧪 HƯỚNG DẪN KIỂM THỬ TÍCH HỢP (INTEGRATION TEST GUIDE) - PHASE 3

Tài liệu này hướng dẫn cách kiểm thử tích hợp (end-to-end) luồng nghiệp vụ của **Phase 3** bao gồm Phân hệ Trọng tài (Referee - Bùi Huy) và Phân hệ Khán giả (Spectator - Thu Mây) trên nhánh `dev-GiaHuy`.

---

## 🛠️ Chuẩn bị môi trường & Dữ liệu mẫu

### 1. Cập nhật Database cấu trúc mới
Nhánh `dev-GiaHuy` đã tích hợp bảng `RaceInspections` và cột `reward_points`. Chạy script setup database để đảm bảo cấu trúc mới nhất:
```bash
cd source-code/backend
# Kích hoạt môi trường ảo nếu có
.venv\Scripts\activate
# Chạy script cài đặt DB
python db_setup.py
```

### 2. Tài khoản thử nghiệm mẫu
Đăng ký hoặc sử dụng tài khoản có sẵn trong DB:
*   **Referee (Trọng tài):** 
    *   Username: `referee1` | Password: `password123`
*   **Spectator (Khán giả):** 
    *   Username: `spectator1` | Password: `password123`
*   **Admin (Quản trị viên):** 
    *   Username: `admin` | Password: `password123`

---

## 📋 Các kịch bản thử nghiệm tích hợp (E2E Test Cases)

### Kịch bản 1: Giám sát đường đua trước trận (Race Inspection)
> **Mục tiêu:** Kiểm tra tính năng ghi nhận thông tin thời tiết, mặt sân của Trọng tài trước giờ đấu.

1.  **Đăng nhập** vào hệ thống bằng tài khoản Trọng tài (`referee1`).
2.  Truy cập vào **Referee Panel** trên Dashboard.
3.  **Xác nhận danh sách trận đấu:** Hệ thống chỉ hiển thị danh sách trận đấu được phân công trực tiếp cho trọng tài này (lấy từ API `/races/assigned-to-me`).
4.  Tìm trận đấu đang ở trạng thái `SCHEDULED` (ví dụ: *Race 1*), nhấn nút **"Kiểm tra đường đua"**.
5.  Nhập dữ liệu kiểm tra:
    *   **Thời tiết (Weather):** `Rainy`
    *   **Tình trạng đường chạy (Track Condition):** `Wet`
    *   **Đánh giá sức khỏe ngựa (Horse Health):** `All horses fit`
6.  Nhấn **"Gửi báo cáo kiểm tra"**.
7.  **Kết quả mong đợi:**
    *   Hiển thị thông báo thành công.
    *   Trạng thái đường đua ở dòng trận đấu hiển thị cập nhật tự động sang `Wet` (đồng bộ từ dữ liệu báo cáo kiểm tra).
    *   Trong cơ sở dữ liệu, một bản ghi mới được thêm vào bảng `RaceInspections`.

---

### Kịch bản 2: Khán giả tham gia dự đoán kết quả
> **Mục tiêu:** Kiểm tra luồng chọn trận đấu $\rightarrow$ lọc ngựa động và chặn dự đoán trùng lặp.

1.  **Đăng nhập** bằng tài khoản Khán giả (`spectator1`).
2.  **Kiểm tra Header:** Cạnh tên tài khoản Spectator ở góc trên bên phải hiển thị điểm tích lũy ban đầu (ví dụ: `0 pts`).
3.  Chuyển sang tab **"Dự đoán Trận đua"**.
4.  Tại form **"Tạo dự đoán mới"**:
    *   Dropdown **"Chọn Trận đấu"**: Chọn trận đấu vừa thực hiện kiểm tra ở Kịch bản 1.
    *   Dropdown **"Chọn Ngựa đua"**: Kiểm tra xem danh sách ngựa hiển thị có chính xác là các ngựa tham gia trong trận đấu đã chọn hay không (tự động lọc động).
5.  Chọn 1 ngựa đua, chọn **"Dự đoán thứ hạng về đích"** là `Hạng 1 (Về nhất)` và nhấn **"Gửi dự đoán"**.
6.  **Kết quả mong đợi:**
    *   Hệ thống báo *"Dự đoán thành công!"*.
    *   Bảng lịch sử dự đoán của bạn xuất hiện bản ghi mới với trạng thái `⏳ Chờ kết quả` (PENDING).
7.  **Kiểm tra chặn trùng lặp (Duplicate Check):** 
    *   Tiếp tục dùng form trên chọn lại chính trận đấu đó và chọn một ngựa khác để dự đoán.
    *   Nhấn **"Gửi dự đoán"**.
    *   **Kết quả mong đợi:** Hệ thống phải chặn lại và hiển thị thông báo lỗi: `"You have already made a prediction for this race"` (Khán giả chỉ được đoán 1 con ngựa duy nhất trong 1 trận đấu).

---

### Kịch bản 3: Quy trình nhập kết quả nháp & Xác nhận chính thức
> **Mục tiêu:** Kiểm tra quy trình 2 bước của Trọng tài và tính điểm tự động cho Khán giả.

1.  **Đăng nhập** lại bằng tài khoản Trọng tài (`referee1`).
2.  Tại dòng trận đấu đang thử nghiệm ở Kịch bản 1 & 2, nhấn **"Nhập kết quả"**.
3.  Nhập thứ hạng về đích cho các ngựa tham gia (Đảm bảo con ngựa bạn đã dùng tài khoản khán giả dự đoán ở Kịch bản 2 về **Hạng 1**). Nhấn gửi.
4.  **Kiểm tra Trạng thái 1 (Draft Results):**
    *   Trạng thái của trận đấu chuyển thành **`RESULTS_ENTERED`**.
    *   Đăng nhập tài khoản Khán giả (`spectator1`): Kiểm tra trạng thái dự đoán vẫn là `⏳ Chờ kết quả` (chưa được tính điểm thưởng).
5.  **Đăng nhập** tài khoản Trọng tài (`referee1`), nhấn nút **"Xác nhận kết quả chính thức"** bên cạnh trận đấu đó.
6.  **Kiểm tra Trạng thái 2 (Official Confirmation):**
    *   Trạng thái trận đấu chuyển sang **`COMPLETED`**.
    *   Bảng xếp hạng Rankings của ngựa và nài trong DB được cập nhật lại điểm số.
7.  **Đăng nhập** lại bằng tài khoản Khán giả (`spectator1`):
    *   Trạng thái dự đoán trong bảng Lịch sử chuyển sang màu xanh: **`✅ Đúng`**.
    *   Điểm tích lũy trên thanh Header cập nhật tự động tăng lên **`10 pts`** (cộng 10 điểm thưởng).
    *   Tab **"Lịch & Kết quả"**: Xem phần *Kết quả các trận đã kết thúc*, nhấn vào trận đấu vừa rồi để xem bảng kết quả chi tiết hiển thị đầy đủ thông tin thứ hạng chính thức.
