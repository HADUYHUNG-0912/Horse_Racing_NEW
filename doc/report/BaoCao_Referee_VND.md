# Báo Cáo Cập Nhật & Kiểm Thử Tính Năng Trọng Tài (Referee)

## 1. Mục tiêu
- Cập nhật đơn vị tiền tệ cho tính năng "Báo Cáo Vi Phạm" (Số tiền phạt) của vai trò Trọng tài (Referee) từ **USD ($)** sang **VND (₫)**.
- Điều chỉnh giới hạn kiểm tra tính hợp lệ (validation) cho số tiền phạt để phù hợp với thực tế sử dụng của đơn vị VND.

## 2. Các thay đổi đã thực hiện

### Frontend (`source-code/frontend/app/dashboard/components/RefereePanel.js`)
- Đổi nhãn hiển thị tại form vi phạm từ `Số tiền phạt ($)` thành `Số tiền phạt (VND)`.
- Nâng mức giới hạn tối đa cho số tiền phạt từ `9,999,999` lên `99,999,999` (99 triệu 999 ngàn 999 đồng) để phù hợp với giới hạn `DECIMAL(10,2)` được lưu trong cơ sở dữ liệu.
- Cập nhật logic xử lý trong trường nhập liệu: tự động chặn ở mức `99,999,999` nếu người dùng nhập số lớn hơn.
- Cập nhật thông báo lỗi bằng tiếng Việt tương ứng: `"Số tiền phạt không được vượt quá 99.999.999."`.

### Backend (`source-code/backend/db_setup.py`)
- Thay đổi dữ liệu mẫu (seed data) trong kịch bản khởi tạo database.
- Vi phạm mặc định của ngựa Pegasus đã được điều chỉnh từ `50.00` (50 USD) sang mức phạt hợp lý bằng VND là `1000000.00` (1 triệu VND).
- Chạy lại script `db_setup.py` để làm mới dữ liệu hệ thống.

## 3. Kết quả kiểm thử (Đã xác nhận hoàn chỉnh)

Các chức năng của Trọng tài đã được test toàn luồng và hoạt động ổn định:
1. **Kiểm tra đường đua (Track Inspection):** Trọng tài có thể điền thông tin thời tiết, tình trạng đường chạy, và sức khỏe ngựa trước trận đấu thành công.
2. **Ghi nhận kết quả cuộc đua:** Việc đánh giá thứ hạng (Rank) và nhập điểm số (Points) diễn ra bình thường, hệ thống lưu trữ chính xác.
3. **Báo cáo vi phạm & Validation Số tiền phạt:**
   - **Nhập số âm:** Khi thử nhập mức phạt `< 0`, hệ thống tự động reset về `0` và hiển thị cảnh báo: `"Số tiền phạt không được âm."`.
   - **Nhập số vượt giới hạn:** Khi nhập giá trị `100000000` (100 triệu), input field tự động điều chỉnh về giới hạn tối đa `99999999` và bật cảnh báo: `"Số tiền phạt không được vượt quá 99.999.999."`.
   - **Nhập hợp lệ:** Nhập mức phạt `5000000` (5 triệu VND) -> Gửi báo cáo thành công, dữ liệu được ghi nhận vào database hoàn chỉnh.
4. **Xác nhận kết quả chính thức:** Quá trình chuyển trạng thái trận đấu từ `RESULTS_ENTERED` sang `COMPLETED` thành công, kích hoạt tự động cập nhật bảng xếp hạng Ranking.

## 4. Kết luận
Luồng tính năng của Referee đã hoàn thiện, đáp ứng đúng yêu cầu chuyển đổi tiền tệ sang VND với các mốc giới hạn chính xác, chặt chẽ. Hệ thống không ghi nhận bất kỳ lỗi phát sinh (bug) nào. Yêu cầu đã được đóng.
