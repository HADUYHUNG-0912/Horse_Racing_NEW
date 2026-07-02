# Báo cáo Đánh giá Chức năng Spectator (Khán giả)

Sau khi rà soát kỹ lưỡng luồng xử lý từ Frontend (`SpectatorPanel.js`) đến Backend (`spectators.py`, `database_models.py`, `auth.py`, `prediction.py`), hệ thống ghi nhận một số thiếu sót, sai sót và điểm bất hợp lý cần khắc phục như sau:

## 1. Lỗi Mismatch Schema ở Frontend (Tab Hồ sơ cá nhân)
**Vị trí:** `source-code/frontend/app/dashboard/components/SpectatorPanel.js` (tại bảng "Lịch sử dự đoán gần đây" trong tab Hồ sơ cá nhân - dòng 746-758).
**Vấn đề:** 
Lập trình viên đã gọi sai tên các thuộc tính của object prediction trả về từ API.
- Frontend đang cố gắng truy cập: `pred.is_correct`, `pred.race?.name`, `pred.horse?.name`, `pred.created_at`, `pred.points_awarded`.
- Backend (schema `PredictionOut`) thực tế trả về: `status` ("PENDING", "Won", "Lost"), `race_name`, `horse_name`, `prediction_date`.
**Hậu quả:** Bảng lịch sử dự đoán trong hồ sơ cá nhân sẽ không hiển thị được dữ liệu hoặc hiển thị sai (trống trơn).
**Đề xuất:** Cập nhật lại mapping trong JSX của bảng này sao cho khớp với bảng ở tab "Dự đoán". Ví dụ: đổi `pred.race?.name` thành `pred.race_name`, đổi logic `is_correct` sang check `pred.status === 'Won'`.

## 2. Lỗi Logic Cấp Phát Điểm Thưởng (Backend)
**Vị trí:** `source-code/backend/app/api/v1/spectators.py` (endpoint `GET /predictions`).
**Vấn đề:** 
Việc kiểm tra kết quả trận đấu, cập nhật trạng thái dự đoán (`Won`/`Lost`) và cộng điểm thưởng (`earnRewardPoints`) đang được thực hiện một cách *thụ động* khi người dùng gọi API `GET /predictions`.
**Hậu quả:** Nếu khán giả dự đoán xong nhưng không bao giờ quay lại màn hình danh sách dự đoán, API `GET` không được gọi, dẫn đến việc họ không bao giờ được cộng điểm thưởng dù dự đoán đúng.
**Đề xuất:** Tách logic đối chiếu kết quả và cộng điểm thưởng ra. Logic này nên được trigger tự động ngay tại thời điểm Admin/Trọng tài nhập kết quả trận đua (endpoint Submit Results), chứ không phải để Spectator tự trigger khi fetch data.

## 3. Bất Đồng Bộ Thời Gian Khóa Dự Đoán (Backend)
**Vị trí:** `source-code/backend/app/api/v1/spectators.py`
**Vấn đề:**
- Khi **Sửa/Xóa** dự đoán (`PUT`, `DELETE`): Hệ thống kiểm tra `time_until_race < timedelta(minutes=15)` và chặn nếu chỉ còn dưới 15 phút.
- Khi **Tạo mới** dự đoán (`POST`): Hệ thống chỉ kiểm tra `datetime.utcnow() > part.race.race_time` (chỉ chặn khi trận đua đã bắt đầu).
**Hậu quả:** Người dùng có thể tạo một dự đoán mới vào phút chót (trước khi đua 1 phút), nhưng ngay sau khi tạo xong thì lại không thể sửa hoặc xóa dự đoán đó.
**Đề xuất:** Áp dụng chung một rule duy nhất cho cả Tạo, Sửa, và Xóa. Ví dụ: Chặn tất cả các hành động này nếu thời gian đến giờ đua còn dưới 15 phút.

## 4. Vấn Đề Hiệu Năng Về Lâu Dài (Pagination)
**Vị trí:** `GET /spectators/predictions`
**Vấn đề:** API đang query và trả về toàn bộ danh sách dự đoán của user từ trước đến nay bằng `.all()`.
**Hậu quả:** Khi hệ thống chạy qua nhiều mùa giải, dữ liệu phình to sẽ làm chậm việc tải trang của Khán giả.
**Đề xuất:** Nên bổ sung logic Pagination (phân trang) hoặc mặc định chỉ trả về các dự đoán của mùa giải hiện tại/gần nhất cho API này.

## 5. Rủi Ro Về Múi Giờ (Timezone)
**Vị trí:** Backend
**Vấn đề:** Các điều kiện so sánh đang dùng `datetime.utcnow()` so với `part.race.race_time`. Điều này đòi hỏi lúc Admin tạo lịch thi đấu, `race_time` cũng phải được lưu ở chuẩn UTC một cách thống nhất trên toàn hệ thống.
**Khuyến cáo:** Cần rà soát lại luồng tạo Race để đảm bảo thời gian gửi từ Frontend (local time) đã được convert đúng sang UTC trước khi lưu vào database, tránh việc khóa dự đoán sai giờ.
