# 📢 Thông Báo Cập Nhật: Thêm Trường Số Điện Thoại & Giới Tính

- **Người thực hiện:** Thái Châu 
- **Nhánh Git:** `feature/jockey-fix`
- **Commit:** "them truong sdt va gioi tinh trong profile jockey"
- **Phạm vi:** Hồ sơ cá nhân Jockey

---

## 1. Nội dung thay đổi

Đã bổ sung 2 trường mới vào form **"Hồ sơ cá nhân Jockey"**:

| Trường | Loại input | Bắt buộc | Validate |
|--------|-----------|----------|----------|
| Số điện thoại | Text (tel) | Không | 9–11 chữ số nếu có nhập |
| Giới tính | Dropdown (select) | Không | Nam / Nữ / Khác |

Vị trí hiển thị: nằm giữa **Địa chỉ Email** và **Cân nặng (kg)** trong form hồ sơ.

---

## 2. Các file đã chỉnh sửa

### Frontend
- `source-code/frontend/app/dashboard/components/JockeyPanel.js`
  - Thêm `phone`, `gender` vào state `profile`
  - Cập nhật `loadProfile`, `handleSaveProfile`, payload gửi API
  - Thêm validate số điện thoại
  - Thêm UI 2 field mới

### Backend
- `source-code/backend/app/schemas/auth.py`
  - Thêm `phone`, `gender` vào `JockeyProfileBase` (áp dụng cho cả `JockeyProfileCreate`, `JockeyProfileUpdate`, `JockeyProfileOut`)
- `source-code/backend/app/models/database_models.py`
  - Thêm cột `phone`, `gender` vào model `JockeyProfile`

### Database
- Đã chạy migration thủ công trên bảng `JockeyProfiles`:
```sql
ALTER TABLE JockeyProfiles ADD phone VARCHAR(20) NULL;
ALTER TABLE JockeyProfiles ADD gender VARCHAR(10) NULL;
```

---

## 3. Kết quả kiểm thử

- ✅ Nhập số điện thoại + giới tính → bấm "Lưu thay đổi hồ sơ" → API trả về 200 OK
- ✅ Sau khi F5 (tải lại trang), dữ liệu 2 trường vẫn được giữ nguyên
- ✅ Validate số điện thoại hoạt động đúng (báo lỗi nếu nhập sai định dạng)

---


