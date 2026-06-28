# 📋 Project & Team Development Checklist - Horse Racing System

Tài liệu này tổng hợp toàn bộ Checklist triển khai dự án (cấp độ hệ thống) và Checklist phát triển chi tiết theo phân hệ thành viên nhóm qua các Phase.

Nhánh chính để merge: `dev-GiaHuy`

---

## 🏛️ PHẦN 1: CHECKLIST TRIỂN KHAI TỔNG THỂ (DỰ ÁN)

### 1. Database & Setup
- [x] Thiết lập Database Schema trên SQL Server Express (`schema.sql`)
- [x] Cấu hình kết nối SQLAlchemy tới SQL Server (`master` & `HorseRacing`)
- [x] Tạo script Python tự động khởi tạo cơ sở dữ liệu và nạp dữ liệu mẫu (`db_setup.py`)
- [x] Đồng bộ các bảng trong database và seeding dữ liệu kiểm thử hoàn tất

### 2. Backend (FastAPI - Clean Architecture)
- [x] Thiết lập môi trường ảo Python và cài đặt các dependencies (`requirements.txt`)
- [x] Xây dựng cấu hình lõi (`config.py`), database engine (`database.py`) và bảo mật mã hóa (`security.py`)
- [x] Thiết kế SQLAlchemy models đại diện các thực thể quan hệ (`database_models.py`)
- [x] Tạo Pydantic schemas để validate đầu vào đầu ra dữ liệu API (`schemas/`)
- [x] Phát triển đầy đủ các API Endpoints (`api/v1/`):
  - [x] Đăng ký, Đăng nhập & Xác thực phân quyền người dùng (`auth.py`)
  - [x] Quản lý Hồ sơ Chủ ngựa & Nài ngựa (`horses.py`, `jockeys.py`)
  - [x] Quản lý Giải đấu & Xét duyệt Đăng ký (`tournaments.py`)
  - [x] Lập lịch trận đua, Phân công Trọng tài & Xếp làn (`races.py`)
  - [x] Nhập kết quả, Phạt vi phạm & Xếp hạng (`results.py`)
  - [x] Dự đoán của Khán giả (`spectators.py`)

### 3. Frontend (React.js - Next.js)
- [x] Khởi tạo dự án Next.js App Router trong thư mục `source-code/frontend`
- [x] Cấu hình hệ thống màu sắc Glassmorphism Dark-Mode trong `globals.css`
- [x] Xây dựng bộ API Client dùng chung (`api.js`)
- [x] Hoàn thiện các trang giao diện (UI Pages):
  - [x] Trang chủ hiển thị thông tin giải đấu và bảng xếp hạng thời gian thực (`page.js`)
  - [x] Giao diện Đăng nhập (`login/page.js`)
  - [x] Giao diện Đăng ký phân vai trò động (`register/page.js`)
  - [x] Giao diện Dashboard tích hợp đa vai trò Admin, Owner, Jockey, Referee, Spectator (`dashboard/page.js`)

---

## 👥 PHẦN 2: TIẾN ĐỘ CHI TIẾT THEO PHÂN HỆ VÀ THÀNH VIÊN NHÓM

### 👑 Nhóm Trưởng (Team Leader - Duy Hưng) - Hỗ trợ & Điều phối
- [x] Tách file `frontend/app/dashboard/page.js` thành các component nhỏ tại `frontend/app/dashboard/components/` để tránh xung đột Git.
- [x] Hỗ trợ cấu hình Database và chạy local cho tất cả thành viên.
- [x] Review, duyệt gộp Pull Request từ các nhánh `feature/*` vào `dev-GiaHuy`.
- [x] **Fix Bug Step 9 & 10 (21/06/2026):**
  - Đổi kiểu dữ liệu `String`/`Text` sang `Unicode`/`UnicodeText` để lưu tiếng Việt không bị lỗi hiển thị dấu `?`.
  - Step 9 (Jockey): Populate `horse_name`, `jockey_name`, `owner_name`, `tournament_name` tại backend và hiển thị đúng tên thật ở `JockeyPanel.js`.
  - Step 10 (Owner): Hiển thị tên thật ngựa/jockey và badge trạng thái ở `OwnerPanel.js`.
  - Thêm `formatDate`/`formatDateTime` helper hiển thị ngày giờ trực quan `dd/mm/yyyy HH:MM`.
  - Cập nhật `test_guide_phase1_2.md` bổ sung bước 8.5 (phân công làn đua).

---

### 🛠️ Phân hệ ADMIN - Huệ & Gia Huy

#### 👩‍💻 Huệ (Frontend - UI Admin) - *Đã tích hợp*
- [x] Sửa lỗi React Hooks vi phạm quy tắc trong vòng lặp `.map()` tại tab Xét duyệt Đăng ký và Lập lịch Trận đua.
- [x] Thiết kế tab UI "Quản lý Người dùng", nút Khóa/Mở khóa tài khoản thành viên.
- [x] Chuyển đổi dropdown chọn Trọng tài sang gọi danh sách động từ API `GET /referees`.
- [x] **Tab Cấu hình Giải thưởng:** UI nhập giải thưởng và liên kết với PrizesPanel của Gia Huy.
- [x] **Nút đổi trạng thái Giải đấu:** Tích hợp nút thay đổi trạng thái giải đấu trong tab Quản lý.
- [x] **Tab Analytics:** Tích hợp tab "Tổng quan hệ thống" hiển thị các thông số thống kê động từ API `/admin/stats`.
- [ ] **Tìm kiếm & Phân trang:** Bổ sung thanh tìm kiếm và phân trang ở danh sách User.

#### 👨‍💻 Gia Huy (Backend - API Admin) - *Đã tích hợp*
- [x] Viết API `GET /admin/users` lấy danh sách người dùng phân trang/tìm kiếm.
- [x] Viết API `PUT /admin/users/{id}/status` khóa/mở khóa tài khoản.
- [x] Viết API `PUT /admin/users/{id}/role` đổi quyền người dùng.
- [x] Viết API `GET /referees` lấy danh sách trọng tài thực tế từ DB.
- [x] Logic kiểm tra trùng lịch Trọng tài/Ngựa/Jockey trong vòng ±2 tiếng.
- [x] Viết API CRUD giải thưởng: `GET`, `POST`, `PUT`, `DELETE` tại `/tournaments/{id}/prizes`.
- [x] Viết API thay đổi trạng thái giải đấu: `PUT /tournaments/{id}/status`.
- [x] Logic tự động trao giải (`Awards`) dựa trên tổng điểm xếp hạng khi giải đấu đổi sang `COMPLETED`.
- [x] API thống kê hệ thống: `/admin/stats` và `/spectators/leaderboard`.

---

### 🐎 Phân hệ HORSE OWNER - Thuỳ Anh - *Đã tích hợp*
- [x] **Dropdown mời Jockey:** Gọi API `GET /jockeys/` để lấy danh sách nài ngựa thực tế, hiển thị tên thật.
- [x] **Đăng ký giải đấu:** Form gửi đăng ký lên `POST /tournaments/{id}/register` (chỉ khi Jockey chấp nhận lời mời).
- [x] **Trạng thái Đăng ký:** Tab "Giải đấu đã đăng ký" hiển thị trạng thái duyệt từ `/tournaments/{id}/registrations`.
- [x] **Quản lý ngựa (CRUD):** Thêm chức năng Sửa/Xóa ngựa (gọi API `PUT /horses/{id}` và `DELETE /horses/{id}`). Validate tuổi ngựa từ 2-10 tuổi ở cả BE và FE.
- [x] **Hồ sơ cá nhân:** API & UI form cập nhật hồ sơ cá nhân của Chủ ngựa (`GET/PUT /owners/profile`).
- [x] **Lịch thi đấu của Ngựa:** Tab hiển thị các trận sắp thi đấu của ngựa mình (so sánh múi giờ Việt Nam).
- [x] **Lịch sử thi đấu:** Tab hiển thị lịch sử xếp hạng và các vi phạm/phạt của ngựa mình.

---

### 🏇 Phân hệ JOCKEY - Thái Châu - *Đã tích hợp*
- [x] **Phản hồi lời mời:** Bổ sung nút Từ chối (Reject) bên cạnh Chấp nhận (Accept), gọi API `PUT /jockeys/invitations/{id}`.
- [x] **Giao diện Lời mời:** Tách riêng cột Trạng thái (badge) và Thao tác (chỉ hiện khi PENDING).
- [x] **Lịch đua:** Hiển thị tên ngựa đua (`horse_name`) thực tế thay vì ID.
- [x] **Quản lý Hồ sơ:** Tab Hồ sơ cá nhân + API `GET/PUT /jockeys/profile` lưu cân nặng, kinh nghiệm, email vào DB.
- [x] **Bộ lọc Leaderboard:** Tích hợp bộ nút lọc giải đấu ở bảng xếp hạng chung gọi API động `/results/rankings?tournament_id={id}`.
- [x] **Giải thưởng Jockey:** Tab xem danh sách giải thưởng và thành tích của Jockey theo từng giải đấu.

---

### 🏁 Phân hệ RACE REFEREE - Bùi Huy - *Đã tích hợp*
- [x] **Xác nhận kết quả 2 bước:**
  - Nhập kết quả (`POST /results/{race_id}/results`) chuyển trận sang trạng thái `RESULTS_ENTERED`.
  - Xác nhận kết quả chính thức (`POST /results/{race_id}/results/confirm`) chuyển trận sang `COMPLETED` và tính điểm xếp hạng.
- [x] **Giám sát trận đua (Race Inspection):** Tạo bảng `RaceInspections`, API và UI cho Referee báo cáo thời tiết, đường đua, sức khỏe ngựa.
- [x] **Tối ưu danh sách trận đấu:** API `/races/assigned-to-me` giúp hiển thị đúng danh sách trận được phân công.
- [x] **Chi tiết trận đấu:** Khi click vào trận đấu, hiển thị bảng danh sách đầy đủ (Làn số, Tên ngựa, Tên Jockey, Trạng thái) thay vì chỉ hiển thị số lượng.
- [x] **Ràng buộc tiền phạt:** Tiền phạt không được âm và giới hạn tối đa là 9.999.999 VNĐ.

---

### 🔮 Phân hệ SPECTATOR - Thu Mây - *Đã tích hợp*
- [x] **Khóa dự đoán khi quá giờ:** Backend và Frontend tự động khóa/chặn form dự đoán nếu trận đấu đã bắt đầu (theo giờ Việt Nam naive).
- [x] **Bảng xếp hạng Khán giả xuất sắc:** Thêm tab hiển thị Top 10 Spectator có điểm cao nhất kèm chi tiết tỷ lệ đoán trúng.
- [x] **Dropdown lọc bảng xếp hạng:** Lọc bảng xếp hạng Ngựa & Jockey và bảng xếp hạng Khán giả động theo giải đấu.
- [x] **Điểm thưởng & Đối chiếu:** Tự động đối chiếu kết quả dự đoán và cộng điểm thưởng (`rewardPoints`) lên Header khi trận đấu chuyển sang `COMPLETED`.

---

### 🐛 Bug Fix Log (Tích hợp Phase 4 - 28/06/2026)
- [x] **Trùng lịch trong add_participant:** Khôi phục kiểm tra trùng lịch ngựa/jockey trong vòng 2 tiếng khi Admin xếp làn trong `races.py`.
- [x] **Khóa API /horses:** Cho phép Admin và các tài khoản khác gọi API `GET /horses/` để hiển thị đúng số lượng ngựa ở trang chủ, chỉ lọc riêng theo chủ nếu role là `OWNER`.
- [x] **Lỗi biên dịch Admin Panel:** Thêm import `PrizesPanel` bị thiếu trong `AdminPanel.js`.
- [x] **Sửa lỗi lọc giải đấu Leaderboard & Jockey:** Cập nhật để gọi API động tới backend `/results/rankings?tournament_id={id}` thay vì lọc client-side trên dữ liệu global không có ID giải đấu.
- [x] **Sửa lỗi màn hình trắng tab giải thưởng:** Thêm prop `activeTab` khi render `PrizesPanel` trong `page.js` và `AdminPanel.js`.
