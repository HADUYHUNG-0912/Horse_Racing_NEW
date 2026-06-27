# 🧪 Hướng dẫn Kiểm thử Phase 1 & Phase 2
## Horse Racing Tournament Management System

> **URL:** Frontend `http://localhost:3000` · Backend `http://localhost:8000`
> **Thời gian ước tính:** ~30–45 phút để chạy đầy đủ

---

## 🔑 Tài khoản Test

| Vai trò | Username | Password |
|---------|----------|----------|
| Admin | `admin` | `admin123` |
| Jockey 1 | `jockey1` | `joc123` |
| Jockey 2 | `jockey2` | `joc123` |
| Owner 1 | `owner1` | `own123` |
| Owner 2 | `owner2` | `own123` |
| Referee 1 | `referee1` | `ref123` |
| Referee 2 | `referee2` | `ref123` |
| Spectator | `spectator1` | `spec123` |

---

## ✅ PHASE 1 — Admin Panel (Huệ & Gia Huy)

### 🔐 TEST 1.1: Đăng nhập & Bảo mật

| # | Hành động | Kết quả mong đợi |
|---|-----------|-----------------|
| 1 | Vào `http://localhost:3000` → click **Đăng nhập** | Chuyển đến trang login |
| 2 | Nhập đúng `admin / admin123` | Vào Dashboard Admin thành công |
| 3 | Đăng xuất → thử truy cập `/dashboard` trực tiếp | Bị redirect về trang login |
| 4 | Thử đăng nhập bằng tài khoản sai mật khẩu | Hiện thông báo lỗi |
| 5 | Khóa tài khoản `jockey1` (xem TEST 1.3), sau đó thử đăng nhập lại bằng `jockey1` | Báo lỗi "tài khoản bị khóa" |

---

### 🏆 TEST 1.2: Quản lý Giải đấu & Trận đua (Admin)

**Đăng nhập:** `admin / admin123`

| # | Tab | Hành động | Kết quả mong đợi |
|---|-----|-----------|-----------------|
| 1 | **Quản lý Giải đấu** | Xem danh sách giải đấu | Hiện "Summer Championship 2026", "Spring Derby 2026" |
| 2 | | Tạo giải đấu mới (điền đầy đủ tên, ngày, địa điểm) | Giải đấu mới xuất hiện trong danh sách |
| 3 | | Sửa giải đấu vừa tạo | Thay đổi được lưu |
| 4 | | Xóa giải đấu vừa tạo | Giải đấu biến mất khỏi danh sách |
| 5 | **Lập lịch Trận đua** | Xem danh sách trận đua | Hiện "Heat 1", "Grand Final" |
| 6 | | Phân công Trọng tài cho trận đua | Dropdown trọng tài load từ API (có tên "John Referee", "David Referee") |
| 7 | | Thử phân công cùng Trọng tài vào 2 trận đua trùng giờ (trong vòng 2h) | Hệ thống báo lỗi conflict lịch |

---

### 👥 TEST 1.3: Quản lý Người dùng (Admin)

**Đăng nhập:** `admin / admin123` → Tab **Quản lý Người dùng**

| # | Hành động | Kết quả mong đợi |
|---|-----------|-----------------|
| 1 | Xem danh sách người dùng | Hiện đầy đủ 8 tài khoản với Role đúng |
| 2 | Nhấn **Khóa** tài khoản `jockey1` | Badge chuyển sang "Đã khóa" |
| 3 | Thử đăng nhập bằng `jockey1` ở tab khác | Báo lỗi tài khoản bị khóa |
| 4 | Quay lại Admin → nhấn **Mở khóa** `jockey1` | Badge chuyển lại "Hoạt động" |
| 5 | Đăng nhập lại `jockey1` | Thành công |

---

### 📋 TEST 1.4: Xét duyệt Đăng ký (Admin)

**Đăng nhập:** `admin / admin123` → Tab **Xét duyệt Đăng ký**

| # | Hành động | Kết quả mong đợi |
|---|-----------|-----------------|
| 1 | Xem danh sách đơn đăng ký | Có dữ liệu (Thunderbolt, Silver Bullet, v.v.) |
| 2 | Nhấn **Chấp thuận** một đơn | Trạng thái chuyển sang APPROVED |
| 3 | Nhấn **Từ chối** một đơn | Trạng thái chuyển sang REJECTED |

---

## ✅ PHASE 2 — Horse Owner Panel (Thuỳ Anh)

**Đăng nhập:** `owner1 / own123`

### 🐎 TEST 2.1: Quản lý Ngựa (CRUD)

**Tab: Quản lý Ngựa**

| # | Hành động | Kết quả mong đợi |
|---|-----------|-----------------|
| 1 | Xem danh sách ngựa | Hiện "Thunderbolt" (5 tuổi), "Windrunner" (4 tuổi) |
| 2 | Thêm ngựa mới (tuổi = **1**) | ❌ Lỗi "Tuổi ngựa phải từ 2 đến 10 năm" |
| 3 | Thêm ngựa mới (tuổi = **11**) | ❌ Lỗi "Tuổi ngựa phải từ 2 đến 10 năm" |
| 4 | Thêm ngựa mới (tên: "TestHorse", tuổi: **5**, giống: "Arabian", GT: Mare) | ✅ Ngựa xuất hiện trong danh sách |
| 5 | Nhấn ✏️ **Sửa** ngựa vừa tạo | Form chuyển sang chế độ "Chỉnh sửa Ngựa" |
| 6 | Đổi tên thành "TestHorse Updated" → **Lưu Thay đổi** | Tên đổi trong danh sách |
| 7 | Nhấn **Hủy** khi đang sửa | Form reset về "Đăng Ký Ngựa Mới" |
| 8 | Nhấn 🗑️ **Xóa** ngựa test → Confirm | Ngựa biến mất khỏi danh sách |

---

### ✉️ TEST 2.2: Mời Jockey

**Tab: Mời Jockey**

| # | Hành động | Kết quả mong đợi |
|---|-----------|-----------------|
| 1 | Mở dropdown **Chọn Jockey** | Hiện tên thật: "Mike Jockey - Kinh nghiệm: 8 năm", "Sarah Jockey - Kinh nghiệm: 4 năm" (KHÔNG phải user_id số) |
| 2 | Chọn Jockey, Ngựa, Giải đấu → gửi lời mời | ✅ Thông báo thành công |
| 3 | Xem bảng "Trạng thái lời mời đã gửi" | Lời mời vừa gửi hiện trạng thái PENDING |

---

### 🏆 TEST 2.3: Đăng ký Giải đấu

**Tab: Đăng ký Giải đấu**

| # | Hành động | Kết quả mong đợi |
|---|-----------|-----------------|
| 1 | Xem bảng giải đấu | Cột "Cặp đăng ký khả dụng" hiện ngựa & jockey đã ACCEPTED |
| 2 | Nếu có lời mời ACCEPTED: nhấn **Đăng ký** | ✅ Đăng ký thành công |
| 3 | Nếu chưa có ACCEPTED: cột đó hiện "Cần mời và được Jockey đồng ý trước" | ✅ Thông báo hướng dẫn |

---

### 📋 TEST 2.4: Xem Trạng thái Đăng ký

**Tab: Giải đấu đã đăng ký**

| # | Hành động | Kết quả mong đợi |
|---|-----------|-----------------|
| 1 | Xem danh sách | Hiện tên giải đấu, tên ngựa thật, tên jockey thật, ngày đăng ký |
| 2 | Kiểm tra badge trạng thái | PENDING → ⏳ Chờ duyệt, APPROVED → ✓ Đã chấp nhận, REJECTED → ✗ Bị từ chối |

---

## ✅ PHASE 2 — Jockey Panel (Thái Châu)

**Đăng nhập:** `jockey2 / joc123`

### ✉️ TEST 2.5: Lời mời Nhận được

**Tab: Lời mời Nhận được**

| # | Hành động | Kết quả mong đợi |
|---|-----------|-----------------|
| 1 | Xem bảng lời mời | Có cột **Trạng thái** (badge màu) riêng và cột **Thao tác** riêng |
| 2 | Với lời mời PENDING: cột Thao tác hiện gì? | Hiện 2 nút: **Đồng ý** (xanh) và **Từ chối** (đỏ) |
| 3 | Với lời mời đã ACCEPTED/REJECTED: cột Thao tác? | Trống (không có nút) |
| 4 | Nhấn **Đồng ý** → Confirm | Badge chuyển sang ACCEPTED, nút biến mất |
| 5 | Đổi sang `jockey1`, kiểm tra lời mời PENDING khác | Nhấn **Từ chối** → badge chuyển REJECTED |

---

### 🏁 TEST 2.6: Lịch trình Đua

**Đăng nhập:** `jockey1 / joc123` → Tab: **Lịch trình Đua**

| # | Hành động | Kết quả mong đợi |
|---|-----------|-----------------|
| 1 | Xem bảng lịch đua | Hiện cột **Ngựa đua** với tên ngựa thật (ví dụ: "Thunderbolt", "Windrunner") |
| 2 | Kiểm tra có đúng ngựa được phân công không | Đúng với dữ liệu seed (jockey1 → Thunderbolt + Windrunner) |

---

### 👤 TEST 2.7: Hồ sơ cá nhân Jockey

**Tab: Hồ sơ cá nhân**

| # | Hành động | Kết quả mong đợi |
|---|-----------|-----------------|
| 1 | Mở tab Hồ sơ cá nhân | Form load sẵn dữ liệu từ DB (cân nặng: 54.5, kinh nghiệm: 8, email: jockey1@...) |
| 2 | Thay đổi cân nặng → **Lưu thay đổi** | Thông báo thành công |
| 3 | Reload trang (F5) → mở lại tab Hồ sơ | Dữ liệu MỚI vẫn giữ nguyên (không bị reset về mặc định) |
| 4 | Thử đổi email thành email của jockey2 | ❌ Lỗi "Email đã được sử dụng bởi tài khoản khác" |
| 5 | Đổi email thành email hợp lệ mới | ✅ Cập nhật thành công |

---

## 🔄 TEST TÍCH HỢP TOÀN LUỒNG (End-to-End)

> Chạy test này để kiểm tra Phase 1 + Phase 2 hoạt động liên hoàn

```
1. [Admin]   Tạo giải đấu mới "Test Cup 2026"
2. [Admin]   Tạo Round + Tạo Trận đua trong giải đó
3. [Admin]   Phân công Referee cho trận đua
4. [Owner1]  Thêm ngựa mới "SuperHorse" (4 tuổi)
5. [Owner1]  Gửi lời mời Jockey2 lái "SuperHorse" cho "Test Cup 2026"
6. [Jockey2] Vào tab Lời mời → Chấp nhận lời mời từ Owner1
7. [Owner1]  Tab Đăng ký Giải đấu → Đăng ký cặp SuperHorse + Jockey2 vào Test Cup 2026
8. [Admin]   Tab Xét duyệt → Chấp thuận đơn đăng ký
8.5.[Admin]  Tab Lập lịch Trận đua → Xếp Làn Cho Ngựa Đua ("SuperHorse") vào trận đua của "Test Cup 2026" (ví dụ: Làn số 1)
9. [Jockey2] Tab Lịch trình Đua → Kiểm tra "SuperHorse" xuất hiện
10.[Owner1]  Tab Giải đấu đã đăng ký → Trạng thái hiện APPROVED
```

**✅ Nếu tất cả 10 bước thành công = Phase 1 + 2 hoạt động hoàn hảo!**

---

## ⚠️ Những điều cần lưu ý khi test

- Backend phải đang chạy ở `http://localhost:8000` (kiểm tra terminal)
- Frontend phải đang chạy ở `http://localhost:3000`
- Nếu thấy lỗi **401 Unauthorized** → đăng xuất và đăng nhập lại
- Nếu dropdown trống → kiểm tra backend có đang chạy không
- Nên test trên **Chrome** hoặc **Edge** để tránh lỗi cache
