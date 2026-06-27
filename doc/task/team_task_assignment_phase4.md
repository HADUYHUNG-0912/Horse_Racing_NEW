# 📋 Kế hoạch Phân công Nhiệm vụ Triển khai Phase 4 (UAT & Hoàn thiện)

Dựa trên kế hoạch chi tiết Phase 4 và tài liệu **[Thông tin nhánh.docx](file:///e:/CNPM/Project/Horse_Racing_NEW/Thông%20tin%20nhánh.docx)**, dưới đây là bảng phân chia công việc, quy hoạch nhánh Git cụ thể cho từng thành viên trong nhóm 7 người để hoàn thành toàn bộ các chức năng còn thiếu.

---

## 1. BẢNG PHÂN CHIA NHÁNH & NHIỆM VỤ CHI TIẾT

| Thành viên | Vai trò | Nhánh Git đề xuất | Nội dung công việc chi tiết |
|---|---|---|---|
| **Duy Hưng** | **Team Leader** | — | - Hỗ trợ kỹ thuật, điều phối chung.<br>- Giải quyết conflict khi merge PRs.<br>- Thực hiện chạy UAT kiểm thử toàn bộ luồng. |
| **Gia Huy** | **Backend Admin** | `feature/be-admin-phase4-prizes` | - Viết API CRUD Prize (`GET`, `POST`, `PUT`, `DELETE` tại `/tournaments/{id}/prizes`).<br>- Viết API chuyển trạng thái Tournament (`PUT /tournaments/{id}/status`).<br>- Xây dựng logic tự động trao giải (`Awards`) khi Tournament đổi sang `COMPLETED`.<br>- Bổ sung params phân trang/tìm kiếm cho các API danh sách Admin.<br>- Viết API thống kê `/admin/stats` và `/spectators/leaderboard`. |
| **Huệ** | **Frontend Admin** | `feature/fe-admin-phase4-ui` | - Thêm tab "Cấu hình Giải thưởng" để nhập giải thưởng cho Tournament.<br>- Thêm nút thay đổi trạng thái giải đấu trong tab "Quản lý Giải đấu".<br>- Tạo tab "Tổng quan" vẽ biểu đồ Analytics và thống kê lấy từ API stats.<br>- Thêm thanh tìm kiếm và phân trang ở danh sách User. |
| **Thuỳ Anh** | **Horse Owner** | `feature/owner-profile-and-races` | - Viết API `GET/PUT /owners/profile` và UI form cập nhật thông tin Owner.<br>- Thêm tab "Lịch thi đấu của Ngựa" lọc các trận sắp diễn ra của ngựa mình.<br>- Thêm tab "Kết quả thi đấu" hiển thị lịch sử xếp hạng/vi phạm của ngựa mình. |
| **Thái Châu** | **Jockey** | `feature/jockey-leaderboard-filter` | - Phối hợp với Thu Mây tích hợp dropdown chọn giải đấu trên trang xếp hạng chung.<br>- Thêm tab xem giải thưởng đã đạt được trong tab Hồ sơ cá nhân của Jockey. |
| **Bùi Huy** | **Referee** | `feature/referee-detail-participants` | - Sửa giao diện RefereePanel: Khi click vào trận đấu, hiển thị bảng danh sách đầy đủ (Làn chạy, Tên ngựa, Tên Jockey, Trạng thái) thay vì chỉ hiển thị số lượng. |
| **Thu Mây** | **Spectator** | `feature/spectator-lock-and-leaderboard` | - Backend API check `datetime.utcnow() > race.race_time` khi gửi dự đoán.<br>- Frontend disable form dự đoán khi quá giờ của trận đấu.<br>- Tạo dropdown lọc Bảng xếp hạng Ngựa & Jockey theo từng giải đấu.<br>- Thêm tab "Khán giả xuất sắc" hiển thị Top 10 Spectator có điểm cao nhất. |

---

## 2. QUY TRÌNH PHỐI HỢP & MERGE CODE TRÊN GIT

Để tránh xung đột code (conflict) trên các file giao diện dùng chung lớn như `AdminPanel.js`, `OwnerPanel.js`, và `Leaderboard.js`, nhóm cần tuân thủ nghiêm ngặt quy trình sau:

### Bước 1: Đồng bộ mã nguồn mới nhất từ dev-GiaHuy
Trước khi viết code, mỗi thành viên phải update local repository:
```bash
git checkout dev-GiaHuy
git pull origin dev-GiaHuy
git checkout -b [ten-nhanh-de-xuat]
```

### Bước 2: Tạo Pull Request (PR) độc lập
- Sau khi code xong và test chạy thử nội bộ không lỗi, push nhánh lên github và tạo PR hướng về nhánh đích `dev-GiaHuy`.
- **Nghiêm cấm** push trực tiếp code lên nhánh `dev-GiaHuy`.

### Bước 3: Team Leader phê duyệt và giải quyết conflict
- Duy Hưng (TL) kiểm tra mã nguồn, đối chiếu nếu hai thành viên cùng sửa đổi một file (ví dụ: Huệ và Gia Huy cùng tác động lên admin).
- Nếu có conflict, Duy Hưng sẽ đứng ra chủ trì giải quyết cùng với các thành viên trước khi tiến hành merge vào `dev-GiaHuy`.

---

## 3. LỘ TRÌNH THỰC HIỆN TRONG 2 NGÀY (PHASE 4)

### Ngày 1: Hoàn thiện Backend APIs & Khung UI
- **Gia Huy / Thuỳ Anh / Thu Mây:** Hoàn thành xong các API Backend mới (CRUD Prize, Tournament Status, Spectator Lock API, Owner Profile API) và push trước để Frontend có API kết nối.
- **Huệ / Bùi Huy / Thái Châu:** Dựng sẵn giao diện UI trống (form nhập prize, bảng chi tiết nài ngựa, tab profile owner).

### Ngày 2: Ghép nối API, Test Tích hợp & Chạy thử UAT
- Các thành viên frontend tiến hành kết nối API với backend.
- Merge toàn bộ các nhánh vào `dev-GiaHuy`.
- **Duy Hưng (TL)** chạy file `db_setup.py` để làm sạch cơ sở dữ liệu và bắt đầu quy trình chạy thử UAT liên hoàn:
  1. *Admin* tạo giải đấu $\rightarrow$ Cấu hình giải thưởng $\rightarrow$ Chuyển trạng thái sang `ACTIVE`.
  2. *Chủ ngựa* cập nhật profile $\rightarrow$ Mời Jockey $\rightarrow$ Đăng ký giải đấu.
  3. *Jockey* đồng ý $\rightarrow$ *Admin* duyệt đăng ký $\rightarrow$ Lập lịch trận đua và xếp làn.
  4. *Referee* xem danh sách nài ngựa chi tiết $\rightarrow$ Ghi nhận vi phạm $\rightarrow$ Nhập kết quả $\rightarrow$ Xác nhận kết quả.
  5. *Spectator* kiểm tra cổng dự đoán (đảm bảo cổng đã đóng sau khi trận đấu hoàn thành) $\rightarrow$ Xem điểm tích lũy và bảng xếp hạng khán giả xuất sắc.
  6. *Admin* kiểm tra kết quả giải đấu đã chuyển sang `COMPLETED`, xem danh sách giải thưởng được trao tự động khớp với thứ hạng.
