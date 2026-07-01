# 📘 Hướng Dẫn Di Chuyển Mã Nguồn Sang Nhánh Mới Sạch

Tài liệu này hướng dẫn chi tiết cách chuyển các tệp tin đã chỉnh sửa từ một nhánh cũ (bị lệch base, có nguy cơ ghi đè mã nguồn chung) sang một nhánh mới sạch được tạo sẵn từ `dev-GiaHuy` mới nhất.

---

## ❓ Tại sao phải di chuyển nhánh?

Khi bạn tách nhánh tính năng từ một commit quá cũ và thực hiện Pull Request (PR) trực tiếp vào `dev-GiaHuy`, Git sẽ hiểu nhầm các tệp tin cũ trên nhánh của bạn là mã nguồn mới nhất. Khi gộp nhánh (merge), các thay đổi của những người khác đã tích hợp trước đó sẽ **bị xóa bỏ hoặc ghi đè (Regression)**. 

Để bảo vệ mã nguồn chung, Leader sẽ từ chối gộp các nhánh bị lệch base và yêu cầu bạn di chuyển code sang nhánh mới sạch theo hướng dẫn dưới đây.

---

## 🛠️ Quy trình 5 bước dành cho Thành viên

> *Trước khi làm: Hãy hỏi Leader tên chính xác của nhánh mới đã được tạo sẵn cho bạn trên GitHub.*

### **Bước 1: Sao lưu code đã sửa (Backup)**
Tìm các file bạn đã tự chỉnh sửa hoặc thêm mới (ví dụ: `JockeyPanel.js`, `SpectatorPanel.js`, `database_models.py`...) trong thư mục dự án.
*   **Hành động:** Copy các tệp này và lưu tạm vào một thư mục bên ngoài (ví dụ: ngoài màn hình Desktop) làm bản sao lưu.

### **Bước 2: Xóa bỏ thay đổi cũ và cập nhật danh sách nhánh**
Mở Terminal tại thư mục gốc của dự án và chạy các lệnh:
```bash
# 1. Hủy bỏ mọi thay đổi cục bộ chưa commit để làm sạch thư mục
git reset --hard
git clean -fd

# 2. Cập nhật thông tin các nhánh mới từ GitHub về máy
git fetch origin
```

### **Bước 3: Chuyển sang nhánh mới tinh đã được tạo sẵn**
Chuyển từ nhánh cũ sang nhánh mới sạch mà Leader đã tạo sẵn trên GitHub:
```bash
git checkout <tên_nhánh_mới_được_giao>
```
*Ví dụ:* `git checkout feature/jockey-fix-new`

### **Bước 4: Dán lại các file code đã sửa**
*   **Hành động:** Sao chép các tệp tin bạn đã lưu tạm ở **Bước 1** (ngoài Desktop) dán đè ngược lại vào các thư mục tương ứng trong dự án.

> [!IMPORTANT]
> **Lưu ý đặc biệt về cơ sở dữ liệu:**
> Nếu tính năng của bạn có thay đổi cấu trúc DB (ví dụ: thêm cột `phone` hay `gender` vào bảng):
> Mở tệp [source-code/database/schema.sql](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/database/schema.sql) và thêm các trường/cột mới đó vào định nghĩa bảng tương ứng để tránh lỗi crash hệ thống khi cài đặt mới.

### **Bước 5: Commit và đẩy mã nguồn lên GitHub**
```bash
# 1. Thêm tất cả các file đã sửa vào staging area
git add .

# 2. Tạo commit với thông điệp rõ ràng
git commit -m "feat: cap nhat ma nguon sach cho tinh nang profile"

# 3. Đẩy code lên nhánh mới trên GitHub
git push origin <tên_nhánh_mới_được_giao>
```

---

## 💡 Mẹo để không bị lệch base trong tương lai

1.  **Luôn cập nhật trước khi làm việc:** Mỗi khi chuẩn bị code tính năng mới, hãy chuyển về `dev-GiaHuy`, chạy `git pull` để lấy code mới nhất, sau đó mới tạo nhánh mới.
2.  **Xóa nhánh cũ sau khi merge:** Khi PR của bạn đã được Leader duyệt gộp vào `dev-GiaHuy`, hãy xóa nhánh cũ ở cả local và remote để tránh vô tình sử dụng lại nhánh cũ này cho các tính năng tiếp theo.
