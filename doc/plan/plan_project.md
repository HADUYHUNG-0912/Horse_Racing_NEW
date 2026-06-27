# Plan project "Horse Racing Tournament Management System"

## Source code 

- BE:
  - Kiến trúc: clean architecture
  - Ngôn ngữ : python3
  - Framework : fastapi
  - Database: SQL server (Local: `localhost\SQLEXPRESS`, DB: `HorseRacing`)
  - Triển khai business logic model ref `ERD.md` và ref `source-code/backend`
- FE : 
  - Kiến trúc: components rõ ràng, component có thể tái sử dụng
  - Ngôn ngữ : React js / Next.js
  - Triển khai UI 

## ERD
- implements file `ERD.md`

## Kế hoạch triển khai & Checklist
- Checklist triển khai tổng thể ban đầu: `check-list.md`
- Checklist chi tiết cho đội ngũ 7 thành viên hiện tại: [team-checklist.md](file:///e:/CNPM/Project/Horse_Racing_NEW/team-checklist.md)

## Quản lý repo git & Phân nhánh
- Nhánh làm việc chung hiện tại: `dev-GiaHuy` (Tất cả PR từ các nhánh feature sẽ được merge vào đây).
- Chi tiết phân chia nhánh và timeline cho từng thành viên: Xem tại [git_branching_plan.md](file:///e:/CNPM/Project/Horse_Racing_NEW/git_branching_plan.md) (đã cập nhật ngày 15/06/2026).
- Quy trình làm việc và đẩy code:
  - Tách nhánh tính năng nhỏ (`feature/fe-...` hoặc `feature/be-...`) từ `dev-GiaHuy`.
  - Hoàn thành mỗi Phase, thực hiện merge các nhánh của Phase đó vào `dev-GiaHuy`.
  - Thành viên ở Phase tiếp theo thực hiện `git pull origin dev-GiaHuy` về nhánh tính năng của mình để lấy các cập nhật (API, UI) mới nhất.
  - Không push trực tiếp lên `dev-GiaHuy`. Mọi thay đổi phải thông qua Pull Request và được Team Leader phê duyệt sau khi kiểm tra build lỗi.

## Phân công vai trò trong Đội ngũ (7 Thành viên)

- **Trưởng nhóm (Team Leader - Duy Hưng):** Hỗ trợ kỹ thuật, cấu trúc thư mục UI và review/phê duyệt Pull Requests.
- **Phân hệ Admin:** Huệ (UI Frontend) & Gia Huy (Backend API).
- **Phân hệ Horse Owner:** Thuỳ Anh (UI & API).
- **Phân hệ Jockey:** Thái Châu (UI & API).
- **Phân hệ Race Referee:** Bùi Huy (UI & API).
- **Phân hệ Spectator:** Thu Mây (UI & API).

## Trạng thái chạy ứng dụng hiện tại (13/06/2026)
- **Backend (FastAPI):** Đang khởi chạy ở cổng 8000 ([http://localhost:8000](http://localhost:8000)).
- **Frontend (Next.js):** Đang khởi chạy ở cổng 3000 ([http://localhost:3000](http://localhost:3000)).
- Cả hai phân hệ đang chạy ngầm trên máy trạm của Team Leader.
- **Tiến độ đã hoàn thành (13/06/2026):**
  - Đã tái cấu trúc thành công giao diện Dashboard [page.js](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/frontend/app/dashboard/page.js) từ một file lớn gần 1400 dòng thành các component nhỏ tự quản lý dữ liệu/logic theo vai trò trong thư mục [components/](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/frontend/app/dashboard/components/).
  - Giúp các thành viên (Huệ, Thuỳ Anh, Thái Châu, Bùi Huy, Thu Mây) có thể phát triển độc lập trên các file riêng biệt (`AdminPanel.js`, `OwnerPanel.js`, `JockeyPanel.js`, `RefereePanel.js`, `SpectatorPanel.js`, `Leaderboard.js`) mà không gặp xung đột Git khi merge.
  - Chạy build sản phẩm Next.js biên dịch thành công 100% và đã xác thực tự động hoạt động hoàn hảo trên trình duyệt.
- **Tiến độ đã hoàn thành (16/06/2026 - Kết thúc Phase 1):**
  - Đã merge và tích hợp thành công **PR #4** (Backend API Admin) và **PR #6** (UI Admin/Trọng tài).
  - Khắc phục triệt để lỗi React Hooks vi phạm quy tắc trong tab Đăng ký/Lập lịch của Admin.
  - Sửa lỗi hiển thị cột vai trò người dùng trong tab Quản lý thành viên.
  - Vá lỗi bảo mật quan trọng (xác thực kiểm tra trạng thái hoạt động `is_active` của User khi đăng nhập và gọi API).
  - Tải danh sách Trọng tài động từ API thay vì hardcode.
  - Setup, seeding dữ liệu mẫu vào cơ sở dữ liệu local thành công.
  - Kiểm thử liên hoàn tích hợp (End-to-End) các API và UI của Admin đạt kết quả tốt 100%. Sẵn sàng chuyển giao sang Phase 2.
- **Tiến độ đã hoàn thành (19/06/2026 - Kết thúc Phase 2):**
  - **Thái Châu (Jockey):** Merge thành công nhánh `feature/jockey-profile-update` vào `dev-GiaHuy`.
    - Bổ sung nút Chấp nhận/Từ chối lời mời, kết nối API `PUT /jockeys/invitations/{id}`.
    - Tách cột Trạng thái và cột Thao tác trên bảng lời mời.
    - Hiển thị tên ngựa thật (`horse_name`) được phân công trong bảng lịch đua.
    - Xây dựng tab Hồ sơ cá nhân + API `GET/PUT /jockeys/profile` lưu DB thật (không dùng localStorage).
  - **Thuỳ Anh (Horse Owner):** Merge thành công 3 nhánh `fe-owner-*` vào `dev-GiaHuy`.
    - Sửa dropdown mời Jockey: hiển thị tên thật từ API `GET /jockeys/`.
    - Tab Đăng ký giải đấu: nút Đăng ký thật gọi `POST /tournaments/{id}/register`.
    - Tab mới "Giải đấu đã đăng ký": xem trạng thái PENDING/APPROVED/REJECTED.
    - Thêm nút Sửa/Xóa ngựa (inline edit form) + validation tuổi ngựa 2–10 tuổi.
  - **Team Leader (fix bổ sung):**
    - Thêm method `api.delete()` vào `frontend/app/api.js` (bị thiếu).
    - Thêm route `PUT /horses/{id}` và `DELETE /horses/{id}` vào `backend/api/v1/horses.py` kèm validation tuổi.
    - Giải quyết 2 merge conflict (`OwnerPanel.js`, `horses.py`) khi tích hợp các nhánh.
  - Kiểm thử liên hoàn luồng Owner → Jockey hoạt động chính xác. Sẵn sàng chuyển giao sang Phase 3.
- **Tiến độ đã hoàn thành (21/06/2026 - Kết thúc Phase 3):**
  - **Bùi Huy (Referee):** Merge thành công các nhánh PR #17, #18, #19 vào `dev-GiaHuy`.
    - API xác nhận kết quả 2 bước: `POST /results/{race_id}/results` (→ RESULTS_ENTERED) + `POST /results/{race_id}/results/confirm` (→ COMPLETED + recalculate_rankings).
    - Bảng `RaceInspections` + API `POST /races/{race_id}/inspection` + UI nhập thông tin giám sát đường đua.
    - API `/races/assigned-to-me` để FE chỉ tải đúng các trận đua được phân công.
  - **Thu Mây (Spectator):** Merge thành công PR vào `dev-GiaHuy`.
    - Form dự đoán liên kết với Race cụ thể, dropdown ngựa tự lọc theo trận đua.
    - Logic đối chiếu kết quả dự đoán tự động khi trận đấu → COMPLETED, cộng `rewardPoints`.
    - Màn hình xem lịch thi đấu công khai và kết quả; hiển thị điểm thưởng trên Header.
  - **Team Leader (fix bug sau test Phase 1+2 - commit `2fae573`):**
    - `database_models.py`: đổi `String`→`Unicode`, `Text`→`UnicodeText` trên các cột tiếng Việt (fix hiển thị `?`).
    - `jockeys.py` + `horse.py`: populate `horse_name`, `owner_name`, `jockey_name`, `tournament_name` vào response invitation.
    - `JockeyPanel.js`: fix Step 9 — hiển thị tên ngựa thật trong tab "Lịch trình Đua".
    - `OwnerPanel.js`: fix Step 10 — hiển thị tên ngựa/jockey thật + badge trạng thái `✓/⏳/✗` trong tab "Giải đấu đã đăng ký".
    - `*Panel.js` (4 file): thêm `formatDate`/`formatDateTime` — ngày giờ hiển thị dạng dd/mm/yyyy HH:MM.
    - `test_guide_phase1_2.md`: bổ sung bước 8.5 (phân công làn đua - lane assignment).
  - Kiểm thử API-level xác nhận các fix Step 9 & 10 hoạt động chính xác. Sẵn sàng kiểm thử tích hợp toàn luồng Phase 4.
- **Tiến độ đã hoàn thành (24/06/2026 - Kết thúc Phase 4 & Giải quyết xung đột Admin):**
  - Gộp thành công hai nhánh `feature/be-admin-fix` và `feature/fe-admin-fix` vào nhánh chính `dev-GiaHuy`.
  - Khắc phục các xung đột gộp mã nguồn (merge conflicts) trong `config.py`, `db_setup.py` và `AdminPanel.js`.
  - Loại bỏ định nghĩa trùng lặp hàm `deleteTournament` trong `AdminPanel.js` giải quyết dứt điểm lỗi webpack lúc biên dịch dự án Next.js.
  - Tích hợp múi giờ Việt Nam (`Asia/Ho_Chi_Minh`) cho toàn bộ thời gian ghi nhận đăng ký, mời nài ngựa, vi phạm, dự đoán và bảng xếp hạng.
  - Bổ sung validate ngày bắt đầu/kết thúc giải đấu (`end_date >= start_date`) và kiểm tra trùng lịch trọng tài trong vòng ±2 tiếng khi xếp lịch đua.
  - Nâng cấp giao diện quản lý Admin: Định dạng ngày tháng trực quan tiếng Việt, cải tiến UI nút xóa giải đấu nổi bật bằng phong cách Red Secondary, và hỗ trợ quay lại trạng thái đăng ký PENDING từ APPROVED/REJECTED để Admin dễ dàng sửa đổi quyết định.
  - **Khắc phục triệt để lỗi cơ sở dữ liệu:** Sửa đổi [schema.sql](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/database/schema.sql) để bổ sung các cột còn thiếu trong DB (`phone_number`, `avatar` trong bảng `Users` và `favorite_jockey` trong bảng `SpectatorProfiles`), giúp API xác thực hoạt động ổn định 100% không còn bị lỗi 500.
  - **Nâng cấp bảo mật biểu mẫu (Form Input Constraints):** Bổ sung thuộc tính `onKeyDown` và `onChange` chặn các ký tự lạ (`e`, `-`, `.`) và tự động chuẩn hóa dữ liệu số (Sequence, Distance, Lane Number) về tối thiểu `1` (và tối đa `8` cho làn) tại [AdminPanel.js](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/frontend/app/dashboard/components/AdminPanel.js).
  - **Tối ưu hóa kết nối cục bộ (Fix Fail to Fetch):** Điều chỉnh đường dẫn API Client trong [api.js](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/frontend/app/api.js) trỏ trực tiếp về IP `127.0.0.1:8000` thay vì sử dụng hostname `localhost`, giải quyết dứt điểm lỗi kết nối ngắt quãng trên hệ điều hành Windows.
  - Chạy kiểm thử Next.js build biên dịch thành công 100%, re-seed database và chạy thử nghiệm thực tế hoạt động hoàn hảo trên trình duyệt.
  - Đồng bộ và đẩy toàn bộ mã nguồn sạch lên nhánh remote `origin/dev-GiaHuy`.
- **Tiến độ đã hoàn thành (27/06/2026 - Tích hợp & Đóng gói Phase 4):**
  - **Admin (Gia Huy & Huệ):** Merge thành công 2 nhánh Admin FE và BE. Hoàn thiện tính năng Cấu hình giải thưởng, Tự động trao thưởng khi Tournament đổi sang `COMPLETED`, giao diện biểu đồ Analytics, Tổng quan và tìm kiếm phân trang User.
  - **Horse Owner (Thuỳ Anh):** Merge thành công nhánh Owner. Bổ sung tính năng cập nhật Profile Chủ ngựa, xem lịch đua sắp tới (đã sửa lỗi lệch múi giờ so sánh sang naive Vietnam time) và lịch sử kết quả/vi phạm của ngựa.
  - **Referee (Bùi Huy):** Merge thành công nhánh Referee. Cải tiến giao diện click mở rộng danh sách chi tiết làn chạy, nài ngựa, ngựa và trạng thái thi đấu; kiểm soát giới hạn tiền phạt trên FE tối đa 9.999.999đ. Khôi phục file `Leaderboard.js` bị ghi đè nhầm để bảo toàn code chung.
  - **Spectator (Thu Mây):** Merge thành công nhánh Spectator. Hoàn thiện API và UI khóa dự đoán khi trận đấu đã bắt đầu (theo giờ Việt Nam naive), bộ lọc bảng xếp hạng động theo giải đấu, tab Khán giả xuất sắc (Top 10 Spectators) kèm thống kê số lần đoán trúng/tổng đoán. Việt hóa lại thông báo lỗi và cảnh báo lock để đồng bộ UI.
  - **Trạng thái gộp code:** Đã gộp và đẩy thành công 5/6 nhánh lên nhánh remote chính `origin/dev-GiaHuy`. Nhánh Jockey của Thái Châu đang chờ sửa lỗi bộ lọc giải đấu phía client trước khi merge.

