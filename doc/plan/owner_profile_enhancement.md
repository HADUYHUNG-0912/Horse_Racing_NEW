# Đề xuất bổ sung tính năng: Hồ sơ cá nhân Horse Owner

## Bối cảnh
Trang "Hồ sơ cá nhân" hiện tại (`OwnerPanel.js`) đã hiển thị và cho phép chỉnh sửa các trường:
- Họ tên
- Số điện thoại
- Công ty / Tên đội
- Avatar (URL)

Tuy nhiên, sau khi kiểm thử thực tế, phát hiện một số thiếu sót cần bổ sung để hồ sơ Owner đầy đủ và chuyên nghiệp hơn, phục vụ tốt hơn cho việc quản lý và xác minh danh tính chủ sở hữu ngựa đua.

## Vấn đề phát hiện

### 1. Thiếu trường chỉnh sửa Email
- Email đang chỉ hiển thị ở phần "Thông tin hiện tại" (read-only), không có ô nhập ở form "Chỉnh sửa thông tin".
- Owner không thể tự cập nhật email nếu cần đổi (ví dụ đổi email liên hệ).

### 2. Thiếu các trường thông tin cá nhân quan trọng
Hồ sơ hiện tại còn sơ sài so với một hệ thống quản lý chủ sở hữu ngựa đua chuyên nghiệp, cần bổ sung:
- **Tuổi** (Age)
- **Kinh nghiệm** (Experience – số năm hoạt động trong lĩnh vực đua ngựa)
- **Nghề nghiệp / Lĩnh vực công việc** (Occupation)
- **Địa chỉ liên hệ** (Address) – phục vụ gửi thư mời, giấy tờ chính thức
- **Quốc tịch** (Nationality) – cần thiết cho các giải đua có yếu tố quốc tế
- **Ngày tham gia hệ thống** (Joined Date) – tự động lấy từ ngày tạo tài khoản, hiển thị dạng "Thành viên từ..."
- **Website / Mạng xã hội** (Social Link) – phục vụ quảng bá thương hiệu nếu là chuồng ngựa/đội đua chuyên nghiệp
- **Mô tả ngắn về bản thân/đội** (Bio) – giới thiệu chuồng ngựa, thành tích nổi bật

## Yêu cầu kỹ thuật

### Backend
- Kiểm tra/bổ sung các trường `email`, `age`, `experience_years`, `occupation`, `address`, `nationality`, `joined_date`, `social_link`, `bio` trong model `OwnerProfile` (hoặc bảng tương ứng trong `database_models.py`).
- Trường `joined_date` tự động lấy giá trị từ thời điểm tạo tài khoản (`created_at`), không cho phép Owner chỉnh sửa.
- Cập nhật API `GET /auth/me` để trả về đầy đủ các trường trên.
- Cập nhật API `PUT /owners/profile` (hoặc endpoint update profile tương ứng) để cho phép chỉnh sửa các trường mới (trừ `joined_date`), bao gồm cả email.
- Validate:
  - Email đúng định dạng, không trùng với tài khoản khác.
  - Tuổi: số nguyên dương hợp lý (ví dụ 18–100).
  - Kinh nghiệm: số nguyên không âm.
  - Website / Social Link: đúng định dạng URL (nếu có nhập).
  - Quốc tịch: dạng text, có thể giới hạn bằng dropdown danh sách quốc gia phổ biến.
  - Bio: giới hạn độ dài tối đa (ví dụ 300 ký tự) để tránh nhập quá dài.

### Frontend (`OwnerPanel.js`)
- Thêm ô nhập **Email** vào form "Chỉnh sửa thông tin".
- Thêm các ô nhập mới: **Tuổi**, **Kinh nghiệm (năm)**, **Nghề nghiệp**, **Địa chỉ liên hệ**, **Quốc tịch**, **Website / Mạng xã hội**, **Mô tả ngắn (Bio)**.
- Hiển thị **Ngày tham gia hệ thống** ở dạng read-only (không cho chỉnh sửa), ví dụ: "Thành viên từ 09/06/2026".
- Cập nhật phần "Thông tin hiện tại" bên phải để hiển thị đầy đủ các trường mới sau khi lưu.
- Validate phía client trước khi gửi API (định dạng email, định dạng URL cho Social Link, giới hạn ký tự cho Bio, số hợp lệ cho Tuổi/Kinh nghiệm).

## Phạm vi ảnh hưởng
- File Frontend: `source-code/frontend/app/dashboard/components/OwnerPanel.js`
- File Backend: `source-code/backend/app/api/v1/auth.py` (hoặc file owner profile liên quan), `source-code/backend/app/schemas/auth.py`, `source-code/backend/app/models/database_models.py`

## Ghi chú
Đây là đề xuất mở rộng ngoài phạm vi 4 task ban đầu được phân công (KAN-65 đến KAN-68), phát sinh trong quá trình kiểm thử thực tế giao diện Hồ sơ cá nhân.