# 📋 Kế hoạch Triển khai Phase 5 — Tính năng Bổ sung

> **Ngày lập:** 11/07/2026  
> **Dựa trên:** Implementation Plan (phân bổ chức năng & lộ trình cho từng nhóm)  
> **Nhánh nguồn:** `main` (commit `5efb736`)  
> **Nhánh tích hợp đích:** `dev-GiaHuy`

---

## 🗂️ Tổng quan

Phase 5 bổ sung các tính năng còn thiếu cho 3 nhóm vai trò trong hệ thống Horse Racing Tournament Management System. Mỗi nhóm làm việc trên nhánh riêng, lấy nguồn từ nhánh `main`.

| Nhóm | Thành viên | Nhánh Git | Tính năng |
|------|------------|-----------|-----------|
| 🔐 Admin/Auth | Gia Huy (BE) + Huệ (FE) | `feature/phase5-admin` | Đổi mật khẩu, Xem chi tiết người dùng |
| 🏁 Referee | Bùi Huy (BE+FE) | `feature/phase5-referee` | Tab Hồ sơ cá nhân Trọng tài |
| 🏇 Owner/Jockey | Thuỳ Anh (Owner) + Thái Châu (Jockey) | `feature/phase5-owner` + `feature/phase5-jockey` | Tab Giải thưởng Owner, Kết quả đua Jockey |

---

## 🔐 Nhóm 1: Gia Huy & Huệ (Admin/Auth)

**Nhánh:** `feature/phase5-admin`  
**Lấy từ:** `main`

### Tính năng 1.1 — Đổi mật khẩu (Change Password)

#### ✅ Backend — Gia Huy

| Hạng mục | Chi tiết |
|----------|----------|
| **File** | `source-code/backend/app/api/v1/auth.py` |
| **Schema** | `source-code/backend/app/schemas/auth.py` |
| **API mới** | `PUT /api/v1/auth/change-password` |
| **Phân quyền** | Mọi user đã đăng nhập (`get_current_user`) |

**Các bước cài đặt:**
1. Thêm schema `PasswordChangeIn` vào `app/schemas/auth.py`:
   ```python
   class PasswordChangeIn(BaseModel):
       old_password: str
       new_password: str
   ```
2. Thêm endpoint `PUT /auth/change-password` vào `auth.py`:
   - Lấy `current_user` qua `Depends(get_current_user)`
   - Dùng `bcrypt.checkpw()` xác thực `old_password` với `password_hash`
   - Hash `new_password` bằng `hash_password()`
   - Cập nhật cột `password_hash` của user trong DB
   - Trả về `{"message": "Password changed successfully"}`

#### ✅ Frontend — Huệ

| Hạng mục | Chi tiết |
|----------|----------|
| **File** | `source-code/frontend/app/dashboard/components/AdminPanel.js` |
| **Vị trí UI** | Modal popup khi click tên user trên Header, hoặc phần cài đặt tài khoản |

**Các bước cài đặt:**
1. Thêm modal "Đổi mật khẩu" với 3 trường: Mật khẩu cũ, Mật khẩu mới, Xác nhận mật khẩu mới.
2. Validate client-side: kiểm tra mật khẩu mới == xác nhận trước khi gọi API.
3. Gọi `api.put('/auth/change-password', { old_password, new_password })`.
4. Hiển thị banner ✅ thành công hoặc ❌ thất bại (sai mật khẩu cũ).

---

### Tính năng 1.2 — Xem chi tiết người dùng (View User Details)

#### ✅ Backend — Gia Huy

| Hạng mục | Chi tiết |
|----------|----------|
| **File** | `source-code/backend/app/api/v1/admin.py` (hoặc `users.py`) |
| **API mới** | `GET /api/v1/admin/users/{id}` |
| **Phân quyền** | Chỉ `RoleChecker(["ADMIN"])` |

**Các bước cài đặt:**
1. Query user từ bảng `Users` theo `id`.
2. Dựa vào `role.name`, query thêm bảng profile tương ứng:
   - `JOCKEY` → `JockeyProfiles`
   - `OWNER` → `HorseOwnerProfiles`
   - `REFEREE` → `RefereeProfiles`
   - `SPECTATOR` → `SpectatorProfiles`
3. Trả về object tổng hợp: thông tin tài khoản + chi tiết profile.

#### ✅ Frontend — Huệ

| Hạng mục | Chi tiết |
|----------|----------|
| **File** | `source-code/frontend/app/dashboard/components/AdminPanel.js` |
| **Vị trí UI** | Tab "Quản lý thành viên" → Bảng danh sách tài khoản |

**Các bước cài đặt:**
1. Thêm cột nút **👁 Xem chi tiết** trong bảng danh sách thành viên.
2. Khi click → mở modal hiển thị:
   - Thông tin tài khoản: Tên, Email, Trạng thái, Ngày tham gia, Role
   - Chi tiết profile theo role:
     - Jockey: Chiều cao, Cân nặng, Kinh nghiệm
     - Owner: Tên trang trại
     - Referee: Cấp chứng chỉ
     - Spectator: Jockey yêu thích

---

## 🏁 Nhóm 2: Bùi Huy (Referee)

**Nhánh:** `feature/phase5-referee`  
**Lấy từ:** `main`

### Tính năng 2.1 — Tab Hồ sơ cá nhân Trọng tài (Referee Profile)

#### ✅ Backend — Bùi Huy

| Hạng mục | Chi tiết |
|----------|----------|
| **File** | `source-code/backend/app/api/v1/referees.py` |
| **API mới GET** | `GET /api/v1/referees/profile` |
| **API mới PUT** | `PUT /api/v1/referees/profile` |
| **Phân quyền** | Chỉ `RoleChecker(["REFEREE"])` |

**Các bước cài đặt:**
1. **`GET /referees/profile`:** JOIN bảng `Users` + `RefereeProfiles` theo `current_user.id`, trả về `{email, full_name, certification_level, ...}`.
2. **`PUT /referees/profile`:** Nhận body `{email, full_name, certification_level}`, cập nhật đồng thời bảng `Users` (email, full_name) và `RefereeProfiles` (certification_level).

#### ✅ Frontend — Bùi Huy

| Hạng mục | Chi tiết |
|----------|----------|
| **File** | `source-code/frontend/app/dashboard/components/RefereePanel.js` |
| **Vị trí UI** | Thêm Tab mới **"Hồ sơ cá nhân"** (My Profile) |

**Các bước cài đặt:**
1. Thêm tab "👤 Hồ sơ cá nhân" trong `RefereePanel.js`.
2. Khi tab được mở: gọi `GET /referees/profile`, load dữ liệu vào form.
3. Form gồm: Email, Họ tên, Cấp chứng chỉ (certification_level).
4. Nút **"💾 Lưu hồ sơ"** → gọi `PUT /referees/profile`.
5. Hiển thị toast thông báo lưu thành công/thất bại.

---

## 🏇 Nhóm 3: Thuỳ Anh & Thái Châu (Owner/Jockey)

### Tính năng 3.1 — Tab Giải thưởng của Chủ ngựa (Owner Awards)

**Nhánh:** `feature/phase5-owner`  
**Lấy từ:** `main`

#### ✅ Backend — Thuỳ Anh

| Hạng mục | Chi tiết |
|----------|----------|
| **File** | `source-code/backend/app/api/v1/owners.py` |
| **API mới** | `GET /api/v1/owners/awards` |
| **Phân quyền** | Chỉ `RoleChecker(["OWNER"])` |

**Các bước cài đặt:**
1. Tìm `owner_profile` từ `current_user.id`.
2. JOIN: `Awards → Prizes → Registrations → Horses → HorseOwnerProfiles`.
3. Lọc theo `owner_profile.id`.
4. Trả về danh sách gồm:
   - Tên giải đấu (`tournament_name`)
   - Tên ngựa (`horse_name`)
   - Tên nài ngựa (`jockey_name`)
   - Vị trí đoạt giải (`rank`)
   - Tên giải thưởng (`title`)
   - Giá trị giải thưởng (`prize_value`)
   - Ghi chú (`notes`)

#### ✅ Frontend — Thuỳ Anh

| Hạng mục | Chi tiết |
|----------|----------|
| **File** | `source-code/frontend/app/dashboard/components/OwnerPanel.js` |
| **Vị trí UI** | Thêm Tab **"🏆 Cúp & Giải thưởng"** (Awards) |

**Các bước cài đặt:**
1. Thêm tab "🏆 Cúp & Giải thưởng" trong `OwnerPanel.js`.
2. Gọi `GET /owners/awards` khi tab được chọn.
3. Hiển thị dạng card/bảng:
   - Làm nổi bật huy chương: 🥇 Hạng 1 (Vàng) / 🥈 Hạng 2 (Bạc) / 🥉 Hạng 3 (Đồng).
   - Hiển thị giá trị giải thưởng (prize_value) rõ ràng.
4. Nếu chưa có giải thưởng nào → hiển thị thông báo "Chưa có giải thưởng nào."

---

### Tính năng 3.2 — Kết quả chi tiết trận đua cho Jockey

**Nhánh:** `feature/phase5-jockey`  
**Lấy từ:** `main`

#### ✅ Backend — Thái Châu

| Hạng mục | Chi tiết |
|----------|----------|
| **File** | `source-code/backend/app/api/v1/jockeys.py` |
| **API mới** | `GET /api/v1/jockeys/results` |
| **Phân quyền** | Chỉ `RoleChecker(["JOCKEY"])` |

**Các bước cài đặt:**
1. Tìm `jockey_profile` từ `current_user.id`.
2. JOIN: `Results → RaceParticipants → Registrations → Races → Rounds → Tournaments`.
3. Lọc theo `jockey_id = jockey_profile.id`.
4. LEFT JOIN thêm `Violations` theo `race_participant_id`.
5. Trả về danh sách:
   - Tên trận đua (`race_name`)
   - Tên ngựa đồng hành (`horse_name`)
   - Thứ hạng về đích (`rank`)
   - Điểm tích lũy (`points`)
   - Thời gian hoàn thành (`finish_time`)
   - Danh sách vi phạm (`violations`: loại lỗi, mô tả)

#### ✅ Frontend — Thái Châu

| Hạng mục | Chi tiết |
|----------|----------|
| **File** | `source-code/frontend/app/dashboard/components/JockeyPanel.js` |
| **Vị trí UI** | Tab "Lịch trình Đua" → Nút "📊 Xem kết quả" cho trận COMPLETED |

**Các bước cài đặt:**
1. Trong tab "Lịch trình Đua", với các trận có `status === "COMPLETED"`, thêm nút **"📊 Xem kết quả"**.
2. Click → mở modal hiển thị:
   - Xếp hạng (Rank)
   - Thời gian về đích (Finish Time)
   - Điểm đạt được (Points)
   - 🚨 Khung cảnh báo đỏ nếu có vi phạm (violations)
3. Gọi `GET /jockeys/results` để lấy toàn bộ lịch sử kết quả.

---

## 🌿 Quy trình Git — Tạo nhánh & Đẩy code

### Sơ đồ nhánh

```
main (nguồn gốc)
 ├── feature/phase5-admin   (Gia Huy + Huệ)
 ├── feature/phase5-referee (Bùi Huy)
 ├── feature/phase5-owner   (Thuỳ Anh)
 └── feature/phase5-jockey  (Thái Châu)
```

### Quy trình cho từng thành viên

```bash
# 1. Đảm bảo local đã cập nhật main mới nhất
git checkout main
git pull origin main

# 2. Tạo nhánh tính năng từ main
git checkout -b feature/phase5-<role>
# Ví dụ: git checkout -b feature/phase5-admin

# 3. Phát triển tính năng, commit thường xuyên
git add .
git commit -m "feat(<role>): <mô tả ngắn gọn>"
# Ví dụ: git commit -m "feat(admin): add change-password endpoint"

# 4. Đẩy nhánh lên remote
git push origin feature/phase5-<role>

# 5. Khi hoàn thành → Tạo Pull Request lên dev-GiaHuy
#    PR sẽ được Team Leader (Duy Hưng) review & merge
```

### Quy ước đặt tên commit

| Prefix | Ý nghĩa |
|--------|---------|
| `feat(admin):` | Tính năng mới cho Admin |
| `feat(referee):` | Tính năng mới cho Referee |
| `feat(owner):` | Tính năng mới cho Owner |
| `feat(jockey):` | Tính năng mới cho Jockey |
| `fix(<role>):` | Sửa lỗi |
| `refactor(<role>):` | Tái cấu trúc không thay đổi logic |

---

## 🧪 Kế hoạch Kiểm thử (Verification Plan)

### Kiểm thử tự động

- Chạy script `test_bugs_report.py` để đảm bảo các thay đổi mới không phá vỡ logic cũ.
- Viết thêm test cases API kiểm tra phân quyền đúng role trên các URL mới.

### Kiểm thử thủ công theo tính năng

| # | Tính năng | Bước kiểm thử |
|---|-----------|--------------|
| 1 | Đổi mật khẩu | Đăng nhập bất kỳ tài khoản → Đổi mật khẩu → Đăng xuất → Đăng nhập lại bằng mật khẩu mới ✅ |
| 2 | Xem chi tiết user | Đăng nhập Admin → Tab "Quản lý thành viên" → Click "Xem chi tiết" từng role → Kiểm tra profile hiển thị đúng ✅ |
| 3 | Referee Profile | Đăng nhập Referee → Tab "Hồ sơ cá nhân" → Thay đổi chứng chỉ → Lưu → Reload → Kiểm tra đồng bộ DB ✅ |
| 4 | Owner Awards | Đăng nhập Owner → Tab "Cúp & Giải thưởng" → Kiểm tra ngựa `Wind Dancer` có hiển thị giải thưởng từ `Spring Derby 2026` ✅ |
| 5 | Jockey Results | Đăng nhập `jockey1` → Tab "Lịch trình Đua" → Click "Xem kết quả" trận COMPLETED → Kiểm tra Hạng 1, 10 điểm, ghi chú chặng đua ✅ |

---

## 📅 Timeline Đề xuất

| Ngày | Thứ | Milestone |
|------|-----|-----------|
| **11/07** | Thứ 6 | Tạo nhánh, bắt đầu phát triển BE + FE |
| **12/07** | Thứ 7 | Hoàn thành Backend API + Frontend UI, integration test nội bộ |
| **13/07** | Chủ nhật | Tạo PR, Team Leader review & merge vào `main`, kiểm thử tích hợp toàn hệ thống |

---

> **Lưu ý:** Mọi thay đổi phải thông qua Pull Request và được Team Leader (Duy Hưng) phê duyệt trước khi merge vào `main`. Không push trực tiếp lên `main`
