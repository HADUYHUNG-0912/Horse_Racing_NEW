# Báo cáo Test Tính Năng – Actor: Horse Owner

---

## 3. Tính năng còn thiếu so với Context Diagram

**1. Xem lịch đấu (Race Schedule)**
- Không có trang/tab hiển thị lịch thi đấu cụ thể trong dashboard.
- Context Diagram yêu cầu hệ thống trả về Race Schedule cho Owner.

**2. Xem Race Results**
- Không có trang xem kết quả riêng cho Owner.
- Owner cần biết ngựa mình đạt hạng mấy sau mỗi giải.

**3. Xem trạng thái đăng kí (Registration Status)**
- Trang đăng kí giải hiển thị danh sách nhưng chưa có chức năng xem tình trạng (duyệt / từ chối).
- Admin cần duyệt Registration; Owner phải nhận được phản hồi.

**4. Thêm / xóa / sửa thông tin ngựa**
- Hiện chỉ có chức năng thêm – chưa có xóa/sửa.
- Thiếu API `PUT /horses/{id}` và `DELETE /horses/{id}`.

**5. Cập nhật profile của Owner**
- Có `GET /auth/me` nhưng không có trang cập nhật profile trên FE.
- Owner cần nhập tên, tuổi, SĐT…

---

## 4. Có nhưng lỗi / chưa đủ bối cảnh

**1. Mời Jockey**
- Dropdown "chọn Jockey" trong FE bị trống – không load được danh sách jockey.
- Cần có jockey đăng kí trong hệ thống mới hiển thị được.

**2. Đăng kí giải**
- Hiển thị giải nhưng cột "cặp đăng kí khả dụng" chỉ hiển thị text: _"cần mời và được jockey đồng ý trước"_.
- Chưa có nút đăng kí thật sự; thiếu kết nối FE → API register.

**3. Quản lí ngựa / Danh sách ngựa**
- Bảng "ngựa đã sở hữu" hiển thị trống sau khi login.
- Có thể do chưa có dữ liệu mẫu hoặc FE chưa fetch đúng API.

**4. Bảng xếp hạng**
- Hiển thị dữ liệu mẫu (Windrunner, Pegasus, Mike Jockey…).
- Đang là seed data, chưa có dữ liệu thật từ giải đấu thật.

**5. Đăng kí tài khoản – Role**
- Khi register qua API phải truyền đúng `role_name` (không phải `role`); chưa rõ ràng trên FE.
- FE `/register` có thể đang truyền sai field role.

---

## 5. Đề xuất cải tiến

### 5.1. Ưu tiên cao

- **Thêm trang Race Schedule** trong dashboard: gọi `GET /api/v1/races/`, hiển thị lịch thi đấu của các giải Owner đã đăng kí.
- **Xem Race Results**: gọi `GET /api/v1/results/rankings` và lọc theo ngựa của Owner.
- **Fix Registration Status**: sau khi đăng kí giải, hiển thị trạng thái `pending / approved / rejected`.
- **Fix dropdown chọn Jockey**: gọi `GET /api/v1/jockeys/` để load danh sách.

### 5.2. Ưu tiên trung bình

- **Thêm chức năng sửa/xóa ngựa**: thêm API `PUT /horses/{id}` và `DELETE /horses/{id}`.
- **Thêm trang Profile của Owner**: để Owner cập nhật thông tin cá nhân.
- **Tạo nút đăng kí thật sự** trên trang đăng kí giải đấu: kết nối `POST /tournaments/{id}/register`.

### 5.3. Ưu tiên thấp (phát triển thêm nếu có thể)

- Thông báo real-time khi Admin duyệt hoặc từ chối đăng kí.
- Lịch sử toàn bộ giải đấu đã tham gia.
- Thống kê số lần đăng kí, tỉ lệ thắng/thua của ngựa.

---

## 6. Đề xuất branch

**`feature/owner-race-schedule`**
- Mục tiêu: Thêm trang xem lịch đấu.
- File/Module: `frontend/app/dashboard/schedule/`

**`feature/owner-race-result`**
- Mục tiêu: Thêm xem kết quả đua.
- File/Module: `frontend/app/dashboard/results/`

**`feature/owner-registration-status`**
- Mục tiêu: Trạng thái đăng kí giải được hiển thị.
- File/Module: `frontend/app/dashboard/` (Đăng ký Giải đấu)

**`fix/owner-jockey-dropdown`**
- Mục tiêu: Fix dropdown Jockey trống.
- File/Module: `frontend/app/dashboard/` (Mời Jockey)

**`feature/owner-horse-edit-delete`**
- Mục tiêu: Thêm sửa/xóa ngựa.
- File/Module: BE: `horses.py`, FE: Quản lý Ngựa

**`feature/owner-profile`**
- Mục tiêu: Cập nhật profile Owner.
- File/Module: `frontend/app/dashboard/profile/`

---

## Nhận xét bổ sung (ngoài Context Diagram)

### 1. Form đăng kí ngựa

**Vấn đề:** Form hiện tại chỉ có 4 trường (Tên, Tuổi, Giống, Giới tính) – khá ít so với yêu cầu thực tế của một hệ thống quản lý ngựa đua chuyên nghiệp.

**Đề xuất bổ sung các trường:**
- Màu lông / đặc điểm nhận dạng
- Cân nặng
- Lịch sử thi đấu
- Tình trạng sức khỏe / chứng nhận y tế
- Hình ảnh ngựa
- Số đăng ký / mã định danh ngựa

---

### 2. Cho phép gửi lời mời trùng lặp (1 ngựa – nhiều giải đấu)

**Đề xuất:**
- Validate: 1 cặp (Jockey, Ngựa, Giải đấu) chỉ được có tối đa 1 lời mời chưa xử lý (`PENDING`).
- Kiểm tra xung đột lịch: 1 ngựa không thể được đăng ký 2 giải đấu có thời gian trùng nhau.

---

### 3. Thiếu nút sửa / xóa trong lời mời Jockey

**Vấn đề:** Trang mời Jockey không có chức năng chỉnh sửa hoặc xóa bản ghi đã tạo.

**Trang Quản lý Ngựa:**
- Bảng danh sách ngựa chỉ hiển thị thông tin, không có nút Sửa/Xóa.
- Cần thêm `PUT /horses/{id}` và `DELETE /horses/{id}` kèm nút hành động trên FE.

**Trang Mời Jockey:**
- Bảng trạng thái lời mời đã gửi không có nút Hủy/Chỉnh sửa.
- Owner cần có thể thu hồi lời mời đang `PENDING` hoặc cập nhật nếu mời sai.

---

### 4. Tuổi ngựa không có validation hợp lệ

**Đề xuất:**
- Giới hạn tuổi hợp lệ: `min = 2`, `max = 10` (cả FE và BE).
- Hiển thị thông báo lỗi rõ ràng nếu nhập ngoài khoảng: _"Tuổi ngựa phải từ 2 đến 10"_.

---

### 5. Trường Giống ngựa không được kiểm tra tính hợp lệ

**Vấn đề:** Trường "Giống ngựa" là ô nhập tự do (free-text), không có danh sách kiểm soát. Người dùng có thể nhập bất kỳ chuỗi nào (ví dụ: `"dd"`, `"abc123"`) mà hệ thống vẫn chấp nhận – dẫn đến dữ liệu không đồng nhất, khó quản lý và tra cứu.

**Đề xuất:**
- Thay bằng dropdown cố định với các giống phổ biến: Thoroughbred, Arabian, Quarter Horse, Appaloosa, Morgan, Standardbred…
- Hoặc dùng **combobox** cho phép nhập tự do nhưng kiểm tra với danh sách chuẩn, hiển thị cảnh báo nếu không khớp: _"Giống ngựa này chưa có trong hệ thống, bạn có muốn thêm mới không?"_