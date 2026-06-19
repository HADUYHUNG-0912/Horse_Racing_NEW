# 📋 Team Development Checklist - Horse Racing System

Nhánh chính để merge: `dev-GiaHuy`

---

## 👑 Nhóm Trưởng (Team Leader) - Hỗ trợ & Điều phối chung
- [x] Tách file `frontend/app/dashboard/page.js` lớn thành các component nhỏ tại `frontend/app/dashboard/components/` để tránh xung đột Git.
- [x] Hỗ trợ các thành viên cài đặt Database và môi trường chạy local.
- [x] Review code và phê duyệt Pull Request từ các nhánh `feature/*` vào `dev-GiaHuy`.

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
- [ ] **Xác nhận kết quả 2 bước:**
  - [ ] Sửa Backend: Khi nhập kết quả (`POST /results/{race_id}/results`), đổi trạng thái trận đấu thành `RESULTS_ENTERED`.
  - [ ] Viết API mới: `POST /results/{race_id}/results/confirm` để chuyển trạng thái trận đấu thành `COMPLETED` và tính toán lại bảng xếp hạng (`recalculate_rankings`).
  - [ ] Sửa Frontend: Thêm nút "Xác nhận kết quả chính thức" trên UI của Referee.
- [ ] **Giám sát trận đua (Race Inspection):**
  - [ ] Tạo bảng `RaceInspections` trong DB và API `POST /races/{race_id}/inspection` ghi chép tình trạng đường chạy, thời tiết, sức khỏe ngựa.
  - [ ] Xây dựng UI để Referee ghi chép thông tin này trước giờ đua.
- [ ] **Tối ưu danh sách trận đấu:** Viết API `/races/assigned-to-me` lấy danh sách trận đua theo ID của Referee hiện tại để FE hiển thị đúng dữ liệu (không lọc thủ công ở client side).

---

## 🔮 Phân hệ SPECTATOR - Thu Mây
- [ ] **Liên kết Dự đoán với Trận đấu cụ thể:**
  - [ ] Sửa giao diện Form dự đoán: Thêm dropdown chọn Giải đấu và Trận đấu. Danh sách ngựa tự động lọc theo trận đấu đã chọn.
  - [ ] Lưu dự đoán vào bảng `Prediction` kết nối với `User_ID`, `Race_ID`, và `Horse_ID`.
- [ ] **Tự động đối chiếu dự đoán & Điểm thưởng:**
  - [ ] Viết logic Backend tự động so sánh kết quả dự đoán với kết quả thực tế của trận đấu khi trận đấu chuyển sang `COMPLETED`.
  - [ ] Cập nhật trạng thái dự đoán thành `Won` hoặc `Lost`, cộng điểm thưởng (`rewardPoints`) cho tài khoản khán giả khi đoán đúng.
- [ ] **Xem Lịch đấu & Kết quả công khai:**
  - [ ] Thiết kế màn hình xem Lịch thi đấu sắp diễn ra và kết quả các trận đấu đã kết thúc cho Spectator.
  - [ ] Hiển thị điểm thưởng của Spectator lên thanh Header.
