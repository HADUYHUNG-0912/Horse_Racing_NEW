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


