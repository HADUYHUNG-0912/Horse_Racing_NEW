# 📋 Team Development Checklist - Horse Racing System

Nhánh chính để merge: `dev-GiaHuy`

---

## 👑 Nhóm Trưởng (Team Leader) - Hỗ trợ & Điều phối chung
- [x] Tách file `frontend/app/dashboard/page.js` lớn thành các component nhỏ tại `frontend/app/dashboard/components/` để tránh xung đột Git.
- [x] Hỗ trợ các thành viên cài đặt Database và môi trường chạy local.
- [x] Review code và phê duyệt Pull Request từ các nhánh `feature/*` vào `dev-GiaHuy`.
- [x] **Fix Bug Step 9 & 10 (21/06/2026):** Điều tra và sửa 2 lỗi được báo cáo sau khi test Phase 1+2:
  - **Encoding tiếng Việt:** Đổi các cột `String`→`Unicode`, `Text`→`UnicodeText` trong `database_models.py` để tên tiếng Việt không bị lưu thành `?`.
  - **Step 9 (Jockey - Lịch trình Đua):** Sửa `jockeys.py` (backend populate `horse_name`, `jockey_name`, `owner_name`, `tournament_name`) + `JockeyPanel.js` (hiển thị tên thật thay vì ID).
  - **Step 10 (Owner - Giải đấu đã đăng ký):** Sửa `OwnerPanel.js` hiển thị `horse_name`/`jockey_name` thật và badge trạng thái `✓ Đã chấp nhận` / `⏳ Chờ duyệt` / `✗ Bị từ chối`.
  - **Date format:** Thêm `formatDate`/`formatDateTime` helper vào `JockeyPanel.js`, `OwnerPanel.js`, `RefereePanel.js`, `AdminPanel.js`.
  - Cập nhật `test_guide_phase1_2.md` bổ sung bước 8.5 (phân công làn đua).
  - Commit & push lên `dev-GiaHuy` (commit `2fae573`).

---

## 🛠️ Phân hệ ADMIN - Huệ & Gia Huy

### 👩‍💻 Huệ (Frontend - UI Admin)
- [x] **Sửa lỗi React Hooks vi phạm** (lỗi gọi hooks trong vòng lặp `.map()`) tại tab Xét duyệt Đăng ký và Lập lịch Trận đua.
- [x] Thiết kế tab UI "Quản lý Người dùng" (User Management). Tích hợp nút khóa/mở khóa tài khoản.
- [x] Thay đổi tab Lập lịch Trận đua để gọi danh sách Trọng tài động từ API `GET /referees` thay vì hardcode.

### 👨‍💻 Gia Huy (Backend - API Admin)
- [x] Viết API `GET /admin/users` để lấy danh sách người dùng.
- [x] Viết API `PUT /admin/users/{id}/status` để khóa/mở khóa tài khoản.
- [x] Viết API `PUT /admin/users/{id}/role` để thay đổi vai trò (role) của user.
- [x] Viết API `GET /referees` để lấy danh sách trọng tài thực tế từ cơ sở dữ liệu.
- [x] Bổ sung logic kiểm tra trùng lịch (Conflict check) ở backend cho `PUT /races/{id}/schedule` và `PUT /races/{id}/assign-referee`.
- [x] Bổ sung các API sửa/xóa Giải đấu và Trận đấu (`PUT /tournaments/{id}`, `DELETE /tournaments/{id}`).

---

## 🐎 Phân hệ HORSE OWNER - Thuỳ Anh
- [x] **Sửa dropdown mời Jockey:** Kết nối gọi API `GET /api/v1/jockeys/` để load danh sách nài ngựa thực tế, hiển thị tên thật thay vì user_id.
- [x] **Hoàn thiện đăng ký giải đấu:** Thiết kế nút "Đăng ký" và kết nối FE gửi dữ liệu lên API `POST /tournaments/{id}/register`. Chỉ cho phép đăng ký khi Jockey đã ACCEPTED.
- [x] **Xem trạng thái Đăng ký:** Tạo tab "Giải đấu đã đăng ký" hiển thị trạng thái duyệt (`✓ Đã chấp nhận` / `⏳ Chờ duyệt` / `✗ Bị từ chối`) lấy từ API `/tournaments/{id}/registrations`.
- [x] **Quản lý ngựa (CRUD):** Thêm chức năng Sửa/Xóa ngựa (gọi API `PUT /horses/{id}` và `DELETE /horses/{id}`). Bổ sung validation tuổi ngựa (từ 2 đến 10) cả ở frontend và backend. _(Merged 19/06/2026)_

---

## 🏇 Phân hệ JOCKEY - Thái Châu
- [x] **Từ chối lời mời:** Bổ sung nút "Từ chối" (Reject) bên cạnh nút "Chấp nhận" (Accept) trên màn hình Lời mời. Kết nối API `PUT /jockeys/invitations/{id}` cập nhật trạng thái sang `REJECTED` / `ACCEPTED`.
- [x] **Sửa cột Thao tác:** Tách riêng cột Trạng thái (badge màu) và cột Thao tác (chứa nút bấm, chỉ hiển thị khi PENDING).
- [x] **Thông tin ngựa ở lịch đua:** Cập nhật bảng Lịch trình đua để hiển thị tên ngựa (`horse_name`) được phân công từ dữ liệu API participants.
- [x] **Quản lý Hồ sơ (Profile):** Xây dựng tab Hồ sơ cá nhân + API `GET/PUT /jockeys/profile` lưu thông tin (cân nặng, kinh nghiệm, email) xuống Database thật (không dùng localStorage). _(Merged 19/06/2026)_

---

## 🏁 Phân hệ RACE REFEREE - Bùi Huy
- [x] **Xác nhận kết quả 2 bước:**
  - [x] Sửa Backend: Khi nhập kết quả (`POST /results/{race_id}/results`), đổi trạng thái trận đấu thành `RESULTS_ENTERED`.
  - [x] Viết API mới: `POST /results/{race_id}/results/confirm` để chuyển trạng thái trận đấu thành `COMPLETED` và tính toán lại bảng xếp hạng (`recalculate_rankings`).
  - [x] Sửa Frontend: Thêm nút "Xác nhận kết quả chính thức" trên UI của Referee.
- [x] **Giám sát trận đua (Race Inspection):**
  - [x] Tạo bảng `RaceInspections` trong DB và API `POST /races/{race_id}/inspection` ghi chép tình trạng đường chạy, thời tiết, sức khỏe ngựa.
  - [x] Xây dựng UI để Referee ghi chép thông tin này trước giờ đua.
- [x] **Tối ưu danh sách trận đấu:** Viết API `/races/assigned-to-me` lấy danh sách trận đua theo ID của Referee hiện tại để FE hiển thị đúng dữ liệu (không lọc thủ công ở client side).

> ✅ **Toàn bộ tasks Phase 3 - Bùi Huy: Đã hoàn thành & merged vào `dev-GiaHuy`** _(21/06/2026)_

---

## 🔮 Phân hệ SPECTATOR - Thu Mây
- [x] **Liên kết Dự đoán với Trận đấu cụ thể:**
  - [x] Sửa giao diện Form dự đoán: Thêm dropdown chọn Giải đấu và Trận đấu. Danh sách ngựa tự động lọc theo trận đấu đã chọn.
  - [x] Lưu dự đoán vào bảng `Prediction` kết nối với `User_ID`, `Race_ID`, và `Horse_ID`.
- [x] **Tự động đối chiếu dự đoán & Điểm thưởng:**
  - [x] Viết logic Backend tự động so sánh kết quả dự đoán với kết quả thực tế của trận đấu khi trận đấu chuyển sang `COMPLETED`.
  - [x] Cập nhật trạng thái dự đoán thành `Won` hoặc `Lost`, cộng điểm thưởng (`rewardPoints`) cho tài khoản khán giả khi đoán đúng.
- [x] **Xem Lịch đấu & Kết quả công khai:**
  - [x] Thiết kế màn hình xem Lịch thi đấu sắp diễn ra và kết quả các trận đấu đã kết thúc cho Spectator.
  - [x] Hiển thị điểm thưởng của Spectator lên thanh Header.

> ✅ **Toàn bộ tasks Phase 3 - Thu Mây: Đã hoàn thành & merged vào `dev-GiaHuy`** _(21/06/2026)_

---

## 🐛 Bug Fix Log (Sau kiểm thử)

### 21/06/2026 — Team Leader fix lỗi báo cáo sau test Phase 1+2

| Lỗi | File sửa | Mô tả |
|-----|----------|-------|
| Encoding tiếng Việt (?) | `database_models.py` | String→Unicode, Text→UnicodeText |
| Step 9: Jockey thấy ID ngựa thay vì tên | `jockeys.py` + `JockeyPanel.js` | Populate `horse_name` từ backend |
| Step 10: Owner thấy ID thay vì tên + badge sai | `horse.py` + `OwnerPanel.js` | Schema + UI hiển thị tên và badge |
| Ngày giờ hiển thị dạng ISO raw | `*Panel.js` (4 file) | Thêm `formatDate`/`formatDateTime` |
| Test guide thiếu bước lane assignment | `test_guide_phase1_2.md` | Thêm bước 8.5 |

---

## 🚀 Phase 4 - UAT & Hoàn thiện (27/06/2026)

### 🏁 Phân hệ RACE REFEREE - Bùi Huy (Đã tích hợp)
- [x] **Hiển thị chi tiết trận đấu:** Khi click vào một trận đấu, hiển thị bảng danh sách đầy đủ (Làn số, Tên ngựa, Tên Jockey, Trạng thái) thay vì chỉ hiển thị số lượng.
- [x] **Ràng buộc số tiền phạt:** Tiền phạt không được âm và giới hạn tối đa là 9.999.999.

### 🔮 Phân hệ SPECTATOR - Thu Mây (Đã tích hợp)
- [x] **Khóa dự đoán khi quá giờ:** Backend API và Frontend lock/disable form khi quá giờ của trận đấu (theo giờ Việt Nam naive).
- [x] **Dropdown lọc bảng xếp hạng:** Lọc bảng xếp hạng Ngựa & Jockey và bảng xếp hạng Khán giả động từ API theo từng giải đấu.
- [x] **Khán giả xuất sắc:** Thêm tab "Khán giả xuất sắc" hiển thị Top 10 Spectator có điểm cao nhất kèm chi tiết tỷ lệ đoán trúng.

### 🐎 Phân hệ HORSE OWNER - Thuỳ Anh (Đã tích hợp)
- [x] **Cập nhật Hồ sơ Chủ ngựa:** API và giao diện UI form cập nhật thông tin cá nhân Chủ ngựa (`GET/PUT /owners/profile`).
- [x] **Lịch thi đấu của Ngựa:** Tab hiển thị các trận sắp diễn ra của ngựa mình (đã sửa lệch múi giờ so sánh sang naive Vietnam time).
- [x] **Lịch sử thi đấu:** Tab hiển thị kết quả xếp hạng và lịch sử vi phạm/phạt của ngựa mình.

### 👨‍💻 Phân hệ ADMIN (Backend) - Gia Huy (Đã tích hợp)
- [x] **API CRUD Prize:** Quản lý giải thưởng giải đấu tại `/tournaments/{id}/prizes`.
- [x] **API Tournament Status:** Chuyển trạng thái Tournament (`PUT /tournaments/{id}/status`).
- [x] **API Tự động trao giải:** Xây dựng logic tự động trao giải (`Awards`) khi Tournament đổi sang `COMPLETED`.
- [x] **API Analytics & Stats:** API thống kê `/admin/stats` và `/spectators/leaderboard`.

### 👩‍💻 Phân hệ ADMIN (Frontend) - Huệ (Đã tích hợp)
- [x] **Giao diện Cấu hình Giải thưởng:** UI nhập giải thưởng cho Tournament (sử dụng PrizesPanel của Gia Huy).
- [x] **Giao diện Trạng thái Giải đấu:** Nút thay đổi trạng thái giải đấu trong tab Quản lý.
- [x] **Giao diện Analytics:** Tab Tổng quan hệ thống hiển thị thống kê từ API `/admin/stats`.
- [ ] **Tìm kiếm & Phân trang:** Bổ sung thanh tìm kiếm và phân trang ở danh sách User.

### 🏇 Phân hệ JOCKEY - Thái Châu (Chưa tích hợp)
- [ ] **Bộ lọc Leaderboard:** Tích hợp bộ lọc giải đấu ở bảng xếp hạng chung.
- [ ] **Giải thưởng Jockey:** Bổ sung tab xem giải thưởng đã đạt được trong tab Hồ sơ cá nhân.

