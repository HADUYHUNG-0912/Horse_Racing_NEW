# 🏇 CHECKLIST TÍNH NĂNG HỆ THỐNG QUẢN LÝ ĐUA NGỰA

> Phân tích dựa trên toàn bộ source code backend (FastAPI) + frontend (Next.js)  
> Cập nhật: 07/07/2026

---

## 🔐 XÁC THỰC & TÀI KHOẢN (Auth)

| Tính năng | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| Đăng nhập (username + password) | ✅ Hoàn thành | JWT Bearer Token, kiểm tra `is_active` |
| Đăng ký tài khoản | ✅ Hoàn thành | Tạo cả User + Profile theo role tương ứng |
| Lấy thông tin user hiện tại (`GET /me`) | ✅ Hoàn thành | Kèm profile theo từng role |
| Phân quyền theo Role (RBAC) | ✅ Hoàn thành | 5 role: ADMIN, OWNER, JOCKEY, REFEREE, SPECTATOR |
| Khóa / mở khóa tài khoản | ✅ Hoàn thành | Admin thực hiện qua `PUT /admin/users/{id}/status` |
| Đổi mật khẩu | ✅ Hoàn thành (Phase 5) | Đã có endpoint change-password và giao diện đổi mật khẩu |
| Quên mật khẩu / reset password | ❌ Chưa có | Không có flow reset qua email |
| Xác thực email (email verification) | ❌ Chưa có | Không có bước verify email sau đăng ký |

---

## 👑 ROLE: ADMIN

### 📊 Tổng quan hệ thống
| Tính năng | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| Xem thống kê tổng quan (users, tournaments, races, horses) | ✅ Hoàn thành | `GET /admin/stats` |
| Phân bộ user theo role | ✅ Hoàn thành | Biểu đồ users_by_role |
| Phân bộ giải đấu theo status | ✅ Hoàn thành | tournaments_by_status |
| Top 5 jockeys theo điểm | ✅ Hoàn thành | |
| Top 5 horses theo điểm | ✅ Hoàn thành | |
| Thống kê dự đoán + tỷ lệ chính xác toàn hệ thống | ✅ Hoàn thành | |
| Thống kê số giải thưởng đã trao | ✅ Hoàn thành | |

### 👥 Quản lý Người dùng
| Tính năng | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| Xem danh sách người dùng (pagination, search, filter) | ✅ Hoàn thành | Tìm kiếm theo username/email/full_name, lọc theo role, trạng thái |
| Khóa / mở khóa tài khoản user | ✅ Hoàn thành | `PUT /admin/users/{id}/status` |
| Đổi role user | ✅ Hoàn thành | `PUT /admin/users/{id}/role` |
| Xóa tài khoản user | ❌ Chưa có | Không có endpoint `DELETE /admin/users/{id}` |
| Xem chi tiết từng user | ✅ Hoàn thành (Phase 5) | API GET /admin/users/{id} kèm profile chi tiết và giao diện xem chi tiết |

### 🏆 Quản lý Giải đấu (Tournament)
| Tính năng | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| Xem danh sách giải đấu (search, filter, pagination) | ✅ Hoàn thành | |
| Tạo giải đấu mới | ✅ Hoàn thành | Validation: end_date >= start_date |
| Chỉnh sửa thông tin giải đấu | ✅ Hoàn thành | |
| Xóa giải đấu | ✅ Hoàn thành | |
| Chuyển trạng thái giải đấu (UPCOMING→ACTIVE→COMPLETED/CANCELLED) | ✅ Hoàn thành | Có validation state machine |
| Tạo vòng đấu (Round) trong giải | ✅ Hoàn thành | |
| Tự động trao giải khi Tournament COMPLETED | ✅ Hoàn thành | Logic `_auto_award`, tie-break theo số lần về nhất |

### 📋 Xét duyệt Đăng ký
| Tính năng | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| Xem danh sách đăng ký tham gia giải | ✅ Hoàn thành | Kèm tên ngựa, jockey |
| Duyệt / Từ chối đơn đăng ký | ✅ Hoàn thành | `PUT /tournaments/registrations/{id}` |

### 🏁 Quản lý Trận đua (Race)
| Tính năng | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| Xem danh sách trận đua (filter, search, pagination) | ✅ Hoàn thành | |
| Tạo trận đua trong vòng đấu | ✅ Hoàn thành | Kiểm tra race_time trong khoảng tournament |
| Cập nhật thông tin trận đua | ✅ Hoàn thành | |
| Xóa trận đua | ✅ Hoàn thành | |
| Giao Referee cho trận đua | ✅ Hoàn thành | Kiểm tra xung đột lịch referee (±2 giờ) |
| Thêm ngựa vào trận đua (Race Participant) | ✅ Hoàn thành | Kiểm tra lane đã dùng, xung đột lịch ngựa/jockey |
| Lập lịch / đổi giờ trận đua | ✅ Hoàn thành | Kiểm tra conflict sau khi reschedule |

### 🏅 Quản lý Giải thưởng (Prize & Award)
| Tính năng | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| Tạo giải thưởng cho từng vị trí trong tournament | ✅ Hoàn thành | Không được tạo trùng position |
| Sửa giải thưởng | ✅ Hoàn thành | Không được sửa nếu đã trao |
| Xóa giải thưởng | ✅ Hoàn thành | Không được xóa nếu đã trao |
| Xem danh sách giải thưởng kèm người nhận | ✅ Hoàn thành | |
| Xem Awards (giải đã trao) | ✅ Hoàn thành | Kèm tên ngựa, jockey, điểm |

---

## 🐎 ROLE: HORSE OWNER

| Tính năng | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| Đăng ký ngựa mới | ✅ Hoàn thành | Validation: tuổi 2-10 năm, giống ngựa |
| Xem danh sách ngựa của mình | ✅ Hoàn thành | |
| Chỉnh sửa thông tin ngựa | ✅ Hoàn thành | |
| Xóa ngựa | ✅ Hoàn thành | |
| Mời Jockey (gửi lời mời) | ✅ Hoàn thành | Kiểm tra trùng mời (1 ngựa/1 jockey per tournament) |
| Xem trạng thái lời mời đã gửi | ✅ Hoàn thành | Hiển thị PENDING/ACCEPTED/REJECTED |
| Đăng ký tham gia giải đấu | ✅ Hoàn thành | Chỉ đăng ký với Jockey đã ACCEPTED lời mời |
| Xem danh sách giải đấu đã đăng ký + trạng thái duyệt | ✅ Hoàn thành | |
| Xem lịch thi đấu sắp tới của ngựa | ✅ Hoàn thành | `GET /owners/upcoming-races` |
| Xem kết quả thi đấu của ngựa | ✅ Hoàn thành | Kèm vi phạm nếu có |
| Xem & chỉnh sửa hồ sơ cá nhân | ✅ Hoàn thành | Đồng bộ bảng Users + HorseOwnerProfiles |
| Chọn tên jockey trong dropdown mời (hiển thị đúng tên) | ✅ Hoàn thành | **Vừa fix** - eager load user relationship |
| Xem giải thưởng nhận được | ✅ Hoàn thành (Phase 5) | Đã có tab Cúp & Giải thưởng của Owner |
| Rút đơn đăng ký giải đấu | ❌ Chưa có | Không có chức năng hủy registration |

---

## 🏇 ROLE: JOCKEY

| Tính năng | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| Xem lời mời được gửi đến | ✅ Hoàn thành | |
| Chấp nhận / Từ chối lời mời | ✅ Hoàn thành | `PUT /jockeys/invitations/{id}` |
| Xem lịch trình thi đấu | ✅ Hoàn thành | Xem các race được tham gia |
| Xem & chỉnh sửa hồ sơ cá nhân | ✅ Hoàn thành | Đồng bộ bảng Users + JockeyProfiles |
| Xem bảng xếp hạng (lọc theo tournament) | ✅ Hoàn thành | Filter theo tournament cụ thể hoặc tổng |
| Xem giải thưởng đạt được | ✅ Hoàn thành | Tab Giải thưởng trong JockeyPanel |
| Xem kết quả từng trận đua đã thi | ✅ Hoàn thành (Phase 5) | Đã có modal xem kết quả chi tiết kèm vi phạm |
| Thống kê cá nhân (tỷ lệ thắng, điểm tích lũy) | ❌ Chưa có | Không có endpoint thống kê riêng cho jockey |

---

## 🏁 ROLE: REFEREE (Trọng tài)

| Tính năng | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| Xem danh sách trận đua được phân công | ✅ Hoàn thành | `GET /races/assigned-to-me` |
| Ghi nhận kết quả trận đua (rank, points) | ✅ Hoàn thành | Cho từng participant |
| Xác nhận kết quả chính thức | ✅ Hoàn thành | Chuyển race status → COMPLETED, cập nhật rankings |
| Ghi nhận vi phạm (violation) | ✅ Hoàn thành | Kèm description, penalty, fine_amount |
| Kiểm tra trước đua (Race Inspection) | ✅ Hoàn thành | Ghi nhận thời tiết, tình trạng đường đua, sức khỏe ngựa |
| Xem hồ sơ cá nhân | ✅ Hoàn thành (Phase 5) | Đã có tab Hồ sơ cá nhân của Referee |
| Xem lịch sử trận đã chấm | ❌ Chưa có | Chỉ xem trận đang phân công, không có lịch sử |

---

## 👀 ROLE: SPECTATOR (Khán giả)

| Tính năng | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| Dự đoán kết quả trận đua | ✅ Hoàn thành | Chỉ dự đoán trước 15 phút, 1 dự đoán/race |
| Sửa dự đoán | ✅ Hoàn thành | Chỉ khi PENDING + còn > 15 phút |
| Xóa dự đoán | ✅ Hoàn thành | Chỉ khi PENDING + còn > 15 phút |
| Xem lịch trận đua & kết quả | ✅ Hoàn thành | Mở rộng xem kết quả từng race |
| Nhận điểm thưởng khi dự đoán đúng | ✅ Hoàn thành | +10 điểm mỗi lần đúng, tự động khi race COMPLETED |
| Xem bảng xếp hạng khán giả (leaderboard) | ✅ Hoàn thành | Xếp theo reward_points, có tỷ lệ chính xác |
| Xem & chỉnh sửa hồ sơ cá nhân | ✅ Hoàn thành | Kèm stats: rank, tổng dự đoán, accuracy |
| Lọc dự đoán theo giải đấu | ✅ Hoàn thành | |
| Xem giải đấu đang diễn ra | ✅ Hoàn thành | Trong tab Lịch & Kết quả |
| Xem thông tin chi tiết jockey/ngựa | ❌ Chưa có | Không có trang detail của jockey hay ngựa |
| Xem thống kê dự đoán theo từng giải | ❌ Chưa có | |

---

## 🌐 TÍNH NĂNG CHUNG / CÔNG KHAI

| Tính năng | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| Bảng xếp hạng công khai (Leaderboard) | ✅ Hoàn thành | Component Leaderboard riêng |
| Xem giải thưởng công khai (PrizesPanel) | ✅ Hoàn thành | Xem prize + award của các tournament |
| Xem danh sách trận đua | ✅ Hoàn thành | Công khai, không cần đăng nhập |
| Xem bảng xếp hạng ngựa/jockey | ✅ Hoàn thành | Lọc theo tournament |
| Xem giải đấu (danh sách, filter theo status) | ✅ Hoàn thành | |

---

## 🗄️ DATABASE & HẠ TẦNG

| Tính năng | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| SQL Server (MSSQL) | ✅ Hoàn thành | Kết nối qua pyodbc + SQLAlchemy |
| Chuẩn hóa múi giờ Việt Nam | ✅ Hoàn thành | `timezone_utils.py` |
| Phân trang API (pagination) | ✅ Hoàn thành | Hầu hết endpoint có page + limit |
| Tìm kiếm & lọc API | ✅ Hoàn thành | Search, filter theo status, role |
| CORS | ✅ Hoàn thành | Cho phép tất cả origin (dev mode) |
| Xử lý xung đột lịch | ✅ Hoàn thành | Referee, Ngựa, Jockey (±2 giờ) |
| Bảng ranking tự tính toán lại | ✅ Hoàn thành | Sau mỗi race COMPLETED |
| Tự động trao giải (auto-award) | ✅ Hoàn thành | Khi Tournament → COMPLETED |
| Upload ảnh / file | ❌ Chưa có | Avatar chỉ là URL string, không có file upload |
| Gửi email thông báo | ❌ Chưa có | Không có email service |
| Logging / Audit trail | ❌ Chưa có | Không có log hành động người dùng |
| Rate limiting | ❌ Chưa có | Không có giới hạn request |
| Refresh token | ❌ Chưa có | JWT không có refresh, chỉ có access token |

---

## 📱 FRONTEND / UI

| Tính năng | Trạng thái | Ghi chú |
|-----------|:----------:|---------|
| Dashboard theo từng role | ✅ Hoàn thành | 5 panel riêng biệt |
| Glassmorphism UI | ✅ Hoàn thành | Class `glass` + dark mode |
| Thông báo inline (success/error banner) | ✅ Hoàn thành | Auto-hide sau 4 giây |
| Responsive design | ⚠️ Một phần | Dùng CSS layout cơ bản, không có breakpoint mobile |
| Trang chủ giới thiệu (Landing page) | ✅ Hoàn thành | `app/page.js` |
| Trang đăng nhập | ✅ Hoàn thành | |
| Trang đăng ký | ✅ Hoàn thành | |
| Loading state khi fetch data | ✅ Hoàn thành | |
| Xác nhận trước khi xóa (confirm dialog) | ✅ Hoàn thành | Dùng `window.confirm()` |
| Dark mode hoàn toàn | ✅ Hoàn thành | Theme tối xuyên suốt |
| Notification / Toast | ⚠️ Cơ bản | Banner đơn giản, chưa có toast library |
| Real-time update (WebSocket) | ❌ Chưa có | Không có live update, phải reload thủ công |
| Tìm kiếm / filter trên UI | ⚠️ Một phần | Admin có search user, chưa đầy đủ ở các panel khác |

---

## 📊 TỔNG KẾT

| | Số lượng |
|--|--|
| ✅ **Đã hoàn thành** | ~65 tính năng |
| ⚠️ **Hoàn thành một phần** | ~4 tính năng |
| ❌ **Chưa thực hiện** | ~18 tính năng |

### ⚠️ Những điểm cần chú ý / ưu tiên làm thêm:
1. **Đổi mật khẩu** – tính năng cơ bản nhưng chưa có
2. **Xóa tài khoản user** – Admin chưa có quyền xóa
3. **Mobile responsive** – UI chưa tối ưu trên điện thoại
4. **Hồ sơ Referee** – Referee chưa có tab hồ sơ
5. **Real-time update** – Cần reload thủ công sau mỗi hành động
6. **Upload avatar thực** – Hiện chỉ nhập URL, chưa upload file
