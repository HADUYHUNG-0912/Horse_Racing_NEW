# 🌳 KẾ HOẠCH PHÂN CHIA NHÁNH GIT (GIT BRANCHING STRATEGY)

Tài liệu này đề xuất chi tiết cách phân chia nhánh Git cho từng thành viên theo từng **Feature/Task nhỏ** (tránh gộp role lớn) kết hợp với **Timeline 7 ngày** của dự án. 

---

## 📌 1. Nguyên Tắc Cơ Bản
1. **Nhánh gốc & Nhánh đích:** Tất cả các nhánh tính năng đều được tách từ `dev-GiaHuy` và sẽ được Merge Request (PR) quay trở lại `dev-GiaHuy`.
2. **Quy tắc đặt tên nhánh:**
   - **Giao diện (Frontend):** `feature/fe-[tên-tính-năng]`
   - **Xử lý dữ liệu (Backend):** `feature/be-[tên-tính-năng]`
   - **Tích hợp cả hai (Fullstack):** `feature/[tên-tính-năng]`
   - **Sửa lỗi gấp:** `hotfix/[tên-lỗi]` hoặc `bugfix/[tên-lỗi]`
3. **Cách phân chia tệp tin (Zero-Conflict):** Mỗi nhánh chỉ tập trung sửa đổi các tệp cụ thể để đảm bảo Git có thể tự động tích hợp 100% không bị conflict.

---

## 📅 2. Chi Tiết Các Nhánh Theo Từng Giai Đoạn (Phases)

### 🚀 Phase 1: Ngày 1 - Ngày 2 (Khởi động & Trục Admin UI/API)
*Trọng tâm: Sửa lỗi giao diện Admin của Huệ và hoàn thiện APIs nền tảng của Gia Huy.*

| Lập trình viên | Tên Nhánh Đề Xuất | File Ảnh Hưởng Chính | Nội dung chính |
| :--- | :--- | :--- | :--- |
| **Huệ** | `feature/fe-admin-hooks-fix` | `frontend/app/dashboard/components/AdminPanel.js` | Sửa lỗi Hooks React (`useState`/`useEffect` trong `.map()`) ở tab Xét duyệt & Lập lịch. |
| **Huệ** | `feature/fe-admin-user-management` | `frontend/app/dashboard/components/AdminPanel.js` | Thiết kế giao diện Tab Quản lý Người dùng, thêm nút Khóa/Mở tài khoản. |
| **Gia Huy** | `feature/be-admin-users-api` | `backend/app/api/v1/auth.py` | Viết APIs: `GET /admin/users`, `PUT /admin/users/{id}/status`, `PUT /admin/users/{id}/role`. |
| **Gia Huy** | `feature/be-referee-list-api` | `backend/app/api/v1/jockeys.py` (hoặc auth/users) | Viết API `GET /referees` lấy danh sách trọng tài thực tế từ DB. |
| **Huệ** | `feature/fe-admin-referee-dropdown` | `frontend/app/dashboard/components/AdminPanel.js` | Thay đổi tab Lập lịch Trận đua để gọi danh sách Trọng tài động từ API `GET /referees`. |

---

### 🐎 Phase 2: Ngày 3 - Ngày 4 (Luồng Đăng ký & Tương tác Owner - Jockey)
*Trọng tâm: Hoàn thiện quy trình đăng ký giải đấu của Chủ Ngựa và tiếp nhận lời mời của Nài Ngựa.*

| Lập trình viên | Tên Nhánh Đề Xuất | File Ảnh Hưởng Chính | Nội dung chính |
| :--- | :--- | :--- | :--- |
| **Thuỳ Anh** | `feature/fe-owner-jockey-dropdown` | `frontend/app/dashboard/components/OwnerPanel.js` | Sửa dropdown Jockey kết nối API `GET /api/v1/jockeys/` động. |
| **Thuỳ Anh** | `feature/fe-owner-tournament-register` | `frontend/app/dashboard/components/OwnerPanel.js` | Thiết kế nút Đăng ký, kết nối API `POST /tournaments/{id}/register`. |
| **Thuỳ Anh** | `feature/fe-owner-registration-status` | `frontend/app/dashboard/components/OwnerPanel.js` | Tạo bảng hiển thị trạng thái duyệt giải đấu (`APPROVED`/`PENDING`/`REJECTED`). |
| **Thuỳ Anh** | `feature/fe-owner-horse-crud` | `frontend/app/dashboard/components/OwnerPanel.js` | Thêm nút Sửa/Xóa ngựa (API `PUT/DELETE`), tích hợp kiểm tra tuổi ngựa (2-10). |
| **Thái Châu** | `feature/fe-jockey-invitations` | `frontend/app/dashboard/components/JockeyPanel.js` | Thêm nút Chấp nhận/Từ chối lời mời. Tách riêng cột Trạng thái và Thao tác. |
| **Thái Châu** | `feature/fe-jockey-race-schedule` | `frontend/app/dashboard/components/JockeyPanel.js` | Cập nhật bảng lịch trình hiển thị rõ tên con ngựa được phân công cưỡi. |
| **Thái Châu** | `feature/jockey-profile-update` | `frontend/app/dashboard/components/JockeyPanel.js`<br>`backend/app/api/v1/jockeys.py` | Xây dựng màn hình UI và API cập nhật thông tin cá nhân của Jockey (Cân nặng, kinh nghiệm...). |
| **Gia Huy** | `feature/be-admin-schedule-validation` | `backend/app/api/v1/races.py`<br>`backend/app/api/v1/tournaments.py` | Viết logic check trùng lịch ngựa/nài/trọng tài khi lập lịch và API Sửa/Xóa giải đấu. |

---

### 🏁 Phase 3: Ngày 5 - Ngày 6 (Phần mềm Giám sát Referee & Khán giả Spectator)
*Trọng tâm: Xác nhận kết quả 2 bước của Trọng tài và Form dự đoán, lịch đấu của Khán giả.*

| Lập trình viên | Tên Nhánh Đề Xuất | File Ảnh Hưởng Chính | Nội dung chính |
| :--- | :--- | :--- | :--- |
| **Bùi Huy** | `feature/referee-two-step-results` | `backend/app/api/v1/results.py`<br>`frontend/app/dashboard/components/RefereePanel.js` | 1. Sửa `POST /results` -> trạng thái `RESULTS_ENTERED`. <br>2. Viết API `/confirm` chuyển thành `COMPLETED` & tính bảng xếp hạng.<br>3. Thêm nút Xác nhận kết quả chính thức ở FE. |
| **Bùi Huy** | `feature/referee-race-inspection` | `backend/app/models/database_models.py`<br>`backend/app/api/v1/races.py`<br>`frontend/app/dashboard/components/RefereePanel.js` | 1. Tạo bảng `RaceInspections`. <br>2. Viết API `POST /races/{id}/inspection`. <br>3. UI nhập ghi chú tình trạng đường chạy, thời tiết, sức khỏe ngựa. |
| **Bùi Huy** | `feature/referee-assigned-races` | `backend/app/api/v1/races.py`<br>`frontend/app/dashboard/components/RefereePanel.js` | Viết API `/races/assigned-to-me` động và hiển thị ở FE thay vì lọc client. |
| **Thu Mây** | `feature/spectator-prediction-flow` | `frontend/app/dashboard/components/SpectatorPanel.js` | Sửa Form dự đoán: Dropdown chọn Trận đấu trước -> lọc danh sách Ngựa -> Lưu vào DB `Prediction`. |
| **Thu Mây** | `feature/be-spectator-rewards-engine` | `backend/app/api/v1/spectators.py`<br>`backend/app/api/v1/results.py` | Khi trận đấu hoàn thành, tự đối chiếu `Prediction` với `Result`, cập nhật trạng thái dự đoán và cộng điểm thưởng. |
| **Thu Mây** | `feature/fe-spectator-schedules-header` | `frontend/app/dashboard/components/SpectatorPanel.js`<br>`frontend/app/dashboard/page.js` (hoặc header component) | Xem lịch đấu/kết quả công khai và hiển thị điểm thưởng Spectator ở Header. |

---

### 🧪 Phase 4: Ngày 7 (Kiểm thử liên thông - Integration Testing & UAT)
*Trọng tâm: Gộp tất cả code sạch vào `dev-GiaHuy`, thực hiện chạy luồng nghiệp vụ khép kín.*
- **TL (Bạn):** Hướng dẫn cả nhóm pull `dev-GiaHuy` mới nhất về máy cá nhân.
- Chạy kịch bản UAT:
  1. *Admin (Huệ/Gia Huy)* tạo giải đấu & mời trọng tài.
  2. *Chủ ngựa (Thuỳ Anh)* mời Jockey & Đăng ký ngựa.
  3. *Jockey (Thái Châu)* đồng ý lời mời.
  4. *Admin* xếp lịch trận đấu.
  5. *Trọng tài (Bùi Huy)* nhập & xác nhận kết quả.
  6. *Khán giả (Thu Mây)* dự đoán và nhận điểm thưởng.
- **Nhánh phát sinh (nếu có lỗi):** `bugfix/fix-[tên-lỗi]`
