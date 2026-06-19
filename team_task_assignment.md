# 📋 BẢNG PHÂN CÔNG NHIỆM VỤ DỰ ÁN (TASK ASSIGNMENT MATRIX)

## 👑 1. Nhóm Trưởng (Bạn) — Điều phối & Hỗ trợ Hệ thống
> **Nhiệm vụ:** Đảm bảo luồng tích hợp không bị gián đoạn, hỗ trợ kỹ thuật chung và review code.

*   **[x] Task 1 (Cấu trúc lại thư mục UI):** Chủ động hỗ trợ nhóm tách file `frontend/app/dashboard/page.js` lớn thành các component con riêng biệt (ví dụ: thư mục `frontend/app/dashboard/components/`). Việc này giúp **Huệ, Thuỳ Anh, Thái Châu, Bùi Huy, Thu Mây** có thể code các tab giao diện của mình độc lập mà không bị xung đột Git.
*   **[x] Task 2 (Quản trị Git & Code Review):** Nhận PR (Pull Request) từ các nhánh tính năng của mọi người, kiểm tra lỗi và merge vào nhánh `dev-GiaHuy`.
*   **[x] Task 3 (Hỗ trợ Database & Config):** Giải quyết các lỗi kết nối SQL Server Express hoặc SQLAlchemy khi các thành viên cài đặt môi trường.

---

## 🛠️ 2. Phân hệ ADMIN — Huệ & Gia Huy
> **Mục tiêu:** Khắc phục lỗi crash giao diện và xây dựng API/UI cốt lõi để quản lý hệ thống.

### 👩‍💻 Huệ (Frontend & UI Admin)
*   **[x] Task 1 (🔴 Khẩn cấp):** Sửa lỗi React Hooks vi phạm quy tắc (gọi `useState`/`useEffect` trong vòng lặp `.map()`) tại tab Xét duyệt Đăng ký và Lập lịch Trận đua.
*   **[x] Task 2:** Tạo tab mới "Quản lý Người dùng" hiển thị danh sách người dùng, tích hợp nút khóa/mở khóa tài khoản.
*   **[x] Task 3:** Sửa giao diện phân công Trọng tài (Referee): Thay vì hiển thị danh sách trọng tài hardcode cũ, hãy kết nối và lấy dữ liệu động từ API do **Gia Huy** viết.

### 👨‍💻 Gia Huy (Backend & API Admin)
*   **[x] Task 1:** Viết các API quản lý người dùng: `GET /admin/users` (lấy danh sách user), `PUT /admin/users/{id}/status` (khóa/mở khóa tài khoản), `PUT /admin/users/{id}/role` (đổi role).
*   **[x] Task 2:** Viết API `GET /referees` thực tế lấy từ cơ sở dữ liệu để phục vụ Frontend.
*   **[x] Task 3:** Viết logic kiểm tra trùng lịch (Conflict Validation) tại API `PUT /races/{id}/schedule` (tránh trùng lịch thi đấu của ngựa/nài) và `PUT /races/{id}/assign-referee` (tránh trùng lịch trọng tài).
*   **[x] Task 4:** Viết API cập nhật/xóa Giải đấu và Trận đấu (`PUT /tournaments/{id}`, `DELETE /tournaments/{id}`).

---

## 🐎 3. Phân hệ HORSE OWNER — Thuỳ Anh
> **Mục tiêu:** Kích hoạt luồng gửi lời mời cho Jockey và đăng ký tham gia giải đấu.

*   **[x] Task 1 (Fix dropdown Jockey):** Sửa lỗi danh sách chọn Jockey bị trống ở FE. Kết nối dropdown này với API `GET /api/v1/jockeys/` và hiển thị tên thật của Jockey (full_name + kinh nghiệm năm). _(Merged 19/06/2026)_
*   **[x] Task 2 (Đăng ký giải đấu thực tế):** Tạo nút "Đăng ký" thật trên giao diện đăng ký giải đấu. Tích hợp kết nối FE gửi dữ liệu lên API `POST /tournaments/{id}/register` (chỉ khi Jockey đã ACCEPTED lời mời). _(Có sẵn trong OwnerPanel, Merged 19/06/2026)_
*   **[x] Task 3 (Xem trạng thái Đăng ký):** Tạo tab "Giải đấu đã đăng ký" hiển thị danh sách các giải đã đăng ký kèm cột trạng thái động (`⏳ Chờ duyệt` / `✓ Đã chấp nhận` / `✗ Bị từ chối`) lấy từ API `/tournaments/{id}/registrations`. _(Merged 19/06/2026)_
*   **[x] Task 4 (Sửa/Xóa ngựa):** Thêm nút Sửa/Xóa ngựa trên UI Quản lý Ngựa và kết nối với các API `PUT /horses/{id}`, `DELETE /horses/{id}` ở Backend. Thêm kiểm tra hợp lệ tuổi ngựa (2 đến 10 tuổi) cả FE lẫn BE. _(Merged 19/06/2026)_

---

## 🏇 4. Phân hệ JOCKEY — Thái Châu
> **Mục tiêu:** Tiếp nhận và xử lý phản hồi đối với các lời mời thi đấu từ Chủ ngựa.

*   **[x] Task 1 (Nút Chấp nhận / Từ chối):** Bổ sung nút **Từ chối (Reject)** và **Chấp nhận (Accept)** trên giao diện Hộp thư/Lời mời để Jockey thực hiện quyền của mình. _(Merged 19/06/2026)_
*   **[x] Task 2 (Sửa lỗi cột Thao tác):** Tách biệt cột hiển thị Trạng thái (badge màu) và cột Thao tác (chứa các nút, chỉ hiển thị khi PENDING). _(Merged 19/06/2026)_
*   **[x] Task 3 (Thông tin ngựa được phân công):** Sửa bảng Lịch trình đua để hiển thị tên ngựa (`horse_name`) mà Jockey được phân công cưỡi, lấy từ dữ liệu participants của API `/races`. _(Merged 19/06/2026)_
*   **[x] Task 4 (Hồ sơ cá nhân):** Xây dựng tab + API `GET/PUT /jockeys/profile` để Jockey cập nhật cân nặng, kinh nghiệm, email lưu xuống Database thật (không dùng localStorage, tránh lỗi Hydration Mismatch). _(Merged 19/06/2026)_

---

## 🏁 5. Phân hệ RACE REFEREE — Bùi Huy
> **Mục tiêu:** Xây dựng quy trình giám sát đường đua và xác nhận kết quả công bằng.

*   **Task 1 (Quy trình xác nhận kết quả 2 bước):** 
    *   *Sửa Backend:* Thay đổi API `POST /results/{race_id}/results` để khi Referee nhập kết quả, trạng thái trận đấu chuyển thành `RESULTS_ENTERED` (chưa công bố công khai).
    *   *Viết API mới:* `POST /results/{race_id}/results/confirm` để xác nhận kết quả chính thức $\rightarrow$ chuyển trạng thái trận đấu thành `COMPLETED` và tính toán lại bảng xếp hạng (`recalculate_rankings`).
    *   *Sửa Frontend:* Thêm nút "Xác nhận kết quả chính thức" trên UI của Referee.
*   **Task 2 (Giám sát trận đua - Race Inspection):** 
    *   Tạo bảng `RaceInspections` trong database và viết API `POST /races/{race_id}/inspection` để lưu thông tin kiểm tra đường đua (thời tiết, đường chạy, sức khỏe ngựa).
    *   Xây dựng màn hình UI cho phép Referee nhập các ghi chú kiểm tra này trước khi trận đua bắt đầu.
*   **Task 3 (Tối ưu danh sách trận đấu được phân công):** Viết API chuyên biệt `/races/assigned-to-me` lấy danh sách trận đua theo ID của Referee hiện tại để FE hiển thị đúng dữ liệu (không lọc thủ công ở client side).

---

## 🔮 6. Phân hệ SPECTATOR — Thu Mây
> **Mục tiêu:** Thiết lập form dự đoán thông minh theo trận đấu và hiển thị thông tin công khai.

*   **Task 1 (Sửa logic Form Dự đoán):** 
    *   Sửa giao diện "Tạo dự đoán mới": Phải cho chọn **Trận đấu (Race)** cụ thể trước $\rightarrow$ sau đó dropdown "Chọn Ngựa đua" tự động lọc chỉ hiển thị các ngựa tham gia trong trận đấu đó.
    *   Kết nối nút gửi với API để lưu bản ghi vào bảng `Prediction` với các trường kết nối: `User_ID`, `Race_ID`, `Horse_ID`, `PredictedPosition`.
*   **Task 2 (Kiểm tra kết quả dự đoán & Điểm thưởng):** 
    *   Viết logic Backend chạy tự động khi một trận đấu chuyển sang `COMPLETED`: Đối chiếu bảng `Prediction` với kết quả thực tế trong bảng `Result`. 
    *   Nếu đúng, cập nhật trạng thái dự đoán thành `Won` và gọi hàm `earnRewardPoints()` cộng điểm cho tài khoản khán giả.
*   **Task 3 (Xem thông tin công khai & Header):** 
    *   Xây dựng màn hình xem Lịch thi đấu sắp diễn ra và kết quả các trận đấu đã kết thúc cho Spectator tra cứu.
    *   Hiển thị Điểm thưởng tích lũy (`rewardPoints`) lên thanh Header cạnh tên tài khoản Spectator.

---

# 📅 Kế hoạch triển khai mẫu đề xuất (Timeline)

*   **Ngày 1-2 (Phase 1 — ✅ Hoàn thành 16/06/2026):** **Huệ & Gia Huy** ưu tiên sửa lỗi crash React Hooks của Admin và cung cấp API User/Referee. **Team Leader** hỗ trợ cấu trúc lại các component.
*   **Ngày 3-4 (Phase 2 — ✅ Hoàn thành 19/06/2026):** **Thuỳ Anh** sửa dropdown mời Jockey, đăng ký giải đấu, xem trạng thái, CRUD ngựa. **Thái Châu** viết nút đồng ý/từ chối lời mời, hiển thị tên ngựa, xây dựng hồ sơ cá nhân. **Team Leader** review, fix lỗi thiếu (`api.delete`, backend PUT/DELETE `/horses`) và giải quyết conflict merge.
*   **Ngày 5-6 (Phase 3 — ⏳ Đang tiến hành):** **Bùi Huy** làm giao diện/API xác nhận kết quả của Referee. **Thu Mây** xây dựng màn hình xem lịch đấu công khai và form dự đoán.
*   **Ngày 7 (Phase 4 — Kiểm thử tích hợp):** Cả nhóm cùng chạy thử nghiệm liên hoàn toàn bộ luồng: *Admin tạo giải $\rightarrow$ Owner mời Jockey $\rightarrow$ Jockey đồng ý $\rightarrow$ Owner đăng ký giải $\rightarrow$ Admin duyệt & xếp lịch $\rightarrow$ Referee nhập kết quả $\rightarrow$ Khán giả xem điểm dự đoán*.
