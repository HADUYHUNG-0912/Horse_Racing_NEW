# Quá trình triển khai Backend API (Admin, Referees, Races, Tournaments)

Tài liệu này ghi chú lại quá trình triển khai các tính năng API được yêu cầu cho phần Backend của hệ thống Quản lý Đua Ngựa.

## 1. Khảo sát Hệ thống & Database (Planning)
- **Framework:** Backend đang sử dụng FastAPI (Python), cấu trúc thư mục gồm các thư mục `app/api`, `app/models`, `app/schemas`.
- **Database:** Sử dụng SQL Server với thư viện SQLAlchemy. 
- **Models & Schemas hiện tại:** Hệ thống đã có sẵn các model `User`, `Race`, `Tournament`, `RefereeProfile`,... nhưng bảng `Users` chưa có cờ `is_active` để phục vụ thao tác Khóa/Mở khóa tài khoản.

## 2. Triển khai Task 1: API Quản lý User (Admin)
- **Database Update:** 
  - Đã thêm cột `is_active` (Boolean, default=True) vào model `User` trong file `app/models/database_models.py`.
  - Cập nhật file `database/schema.sql` thêm `is_active BIT DEFAULT 1` vào đoạn tạo bảng `Users`.
- **Schemas Update:** 
  - Trong `app/schemas/auth.py`, cập nhật response `UserOut` để trả về thêm `is_active: bool`.
  - Tạo các schemas mới `UserStatusUpdate` và `UserRoleUpdate` phục vụ dữ liệu payload đầu vào.
- **Routes Update:**
  - Khởi tạo router mới `app/api/v1/admin.py`.
  - Triển khai `GET /admin/users` (trả về danh sách user và gán thêm tên role).
  - Triển khai `PUT /admin/users/{id}/status` (chỉnh sửa `is_active`).
  - Triển khai `PUT /admin/users/{id}/role` (chỉnh sửa `role_id`).
  - Đăng ký (include) router này vào `main.py` với đường dẫn `/api/v1/admin`.

## 3. Triển khai Task 2: API Danh sách Trọng tài
- **Schemas Update:** 
  - Cập nhật `RefereeProfileOut` trong `app/schemas/auth.py` thêm `full_name: Optional[str] = None` để trả ra tên thật của trọng tài lấy từ bảng `Users`.
- **Routes Update:**
  - Khởi tạo router mới `app/api/v1/referees.py`.
  - Triển khai API `GET /referees` để gọi danh sách `RefereeProfile` từ DB, đồng thời duyệt vòng lặp để nối thêm `full_name` từ quan hệ `ref.user.full_name`.
  - Đăng ký router vào `main.py` với đường dẫn `/api/v1/referees`.

## 4. Triển khai Task 3: Conflict Validation (Kiểm tra trùng lịch)
- **Logic:** Quy định khoảng thời gian xung đột (conflict) là ±2 tiếng đồng hồ. Thêm thư viện `datetime.timedelta`.
- **Routes Update (races.py):**
  - Trong `PUT /races/{id}/schedule`:
    - Lấy tất cả thông tin các bên liên quan của trận đấu hiện tại (Horse, Jockey, Referee).
    - Query DB lấy các trận đua (Races) *khác* của từng Ngựa và Nài ngựa tương ứng nằm trong khoảng `new_time - 2 hours` đến `new_time + 2 hours`.
    - Query DB tương tự đối với Trọng tài.
    - Ném lỗi HTTP 400 kèm chi tiết đối tượng nếu phát hiện có sự kiện trùng lặp.
  - Trong `PUT /races/{id}/assign-referee`:
    - Tương tự, nếu trọng tài mới (`referee_id`) đã có lịch đua khác trong cùng khoảng ±2 giờ, API sẽ từ chối gán (ném HTTP 400).

## 5. Triển khai Task 4: Xóa/Cập nhật Giải đấu và Trận đấu
- **Tournaments (tournaments.py):**
  - Bổ sung hàm `PUT /tournaments/{id}` dùng schema `TournamentUpdate` để ghi đè mọi trường thông tin nếu có.
  - Bổ sung hàm `DELETE /tournaments/{id}`. Khi Giải đấu bị xóa, database sẽ áp dụng tự động `ON DELETE CASCADE` được định nghĩa trong SQLAlchemy để xóa sạch các dữ liệu cấp dưới (Rounds, Races, Registrations, RaceParticipants).
- **Races (races.py):**
  - Bổ sung hàm `DELETE /races/{id}` để thao tác xóa thủ công trận đấu độc lập. (Phần `PUT` đã được bao gồm trong Task 3).

## 6. Kiểm tra lại toàn bộ logic
- Server đã có thể start thành công bằng Uvicorn và tất cả các API endpoints mới đã xuất hiện hợp lệ trong Swagger UI (`/docs`).
- Tích hợp thêm các `RoleChecker(["ADMIN"])` vào các API mang tính rủi ro cao để đảm bảo bảo mật.
