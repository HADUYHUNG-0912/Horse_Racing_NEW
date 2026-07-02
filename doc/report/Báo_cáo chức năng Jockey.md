# BÁO CÁO ĐÁNH GIÁ UI/UX VÀ TIẾN ĐỘ MODULE JOCKEY

## 1. Mục đích tài liệu
Tài liệu này đánh giá mức độ hoàn thiện của giao diện người dùng (UI) dành cho phân hệ Jockey dựa trên các yêu cầu đã được thống nhất trong tài liệu Phạm vi MVP và sơ đồ Context Diagram. Báo cáo sẽ chỉ ra các tính năng đã đạt yêu cầu, các tính năng còn thiếu, và đề xuất hướng xử lý về mặt logic hệ thống để phục vụ cho các giai đoạn phát triển tiếp theo.

## 2. Các tính năng đã đáp ứng yêu cầu MVP
Dựa trên phiên bản giao diện hiện tại, phân hệ Jockey đã hoàn thành việc hiển thị một số luồng nghiệp vụ cơ bản:
* **Xác thực và Điều hướng cơ bản:** Giao diện đã có Sidebar điều hướng rõ ràng, Header hiển thị tên và vai trò người dùng hiện tại (Mike Jockey - JOCKEY), kèm chức năng Đăng xuất. Hệ thống đáp ứng tốt yêu cầu phân quyền cơ bản.
* **Quản lý hộp thư và lời mời:** Giao diện đã cung cấp màn hình theo dõi danh sách lời mời từ Chủ ngựa (Horse Owner), hiển thị đầy đủ thông tin về Giải đấu, Ngựa đua và thông điệp gửi kèm.
* **Theo dõi lịch trình:** Jockey có thể xem lịch các cuộc đua đã đăng ký với các thông số quan trọng như Thời gian, Khoảng cách, Điều kiện đường chạy và Trạng thái trận đua (SCHEDULED/COMPLETED).
* **Xem bảng xếp hạng:** Hệ thống đã phân tách rõ ràng Bảng xếp hạng Ngựa đua và Bảng xếp hạng Jockey theo điểm tích lũy, đáp ứng đúng yêu cầu cập nhật ranking.

## 3. Các tính năng còn thiếu hoặc sai lệch so với phân tích
Đối chiếu với Context Diagram và danh sách chức năng MVP, giao diện hiện tại đang gặp phải các thiếu sót sau:
* **Thiếu chức năng từ chối lời mời:** Tài liệu MVP quy định Jockey "có thể nhận hoặc từ chối lời mời". Hiện tại, màn hình Hộp thư chưa có nút thao tác để Jockey thực hiện quyền từ chối này đối với các lời mời đang ở trạng thái chờ.
* **Cột thao tác hiển thị sai ngữ cảnh:** Tại màn hình Lời mời, cột "Thao tác" đang hiển thị badge "ACCEPTED" thay vì các nút hành động thực tế. Trạng thái "Đã chấp nhận" nên được chuyển sang một cột "Trạng thái" riêng biệt.
* **Thiếu thông tin phân công ở lịch đua:** Lịch trình đua hiện tại đang thiếu dữ liệu về đối tượng trung tâm. Cụ thể, Jockey cần biết chính xác mình được phân công điều khiển Ngựa nào trong từng trận đấu cụ thể để chuẩn bị chiến thuật.
* **Chưa có chức năng quản lý Hồ sơ (Profile):** Giao diện thiếu khu vực để Jockey cập nhật thông tin cá nhân (Cân nặng, Kinh nghiệm, Liên hệ), một luồng dữ liệu bắt buộc đã được định nghĩa trong sơ đồ hệ thống.
* **Thiếu bộ lọc giải đấu:** Tính năng Bảng xếp hạng hiện tại chưa cho phép người dùng chọn xem kết quả theo từng Giải đấu cụ thể.

## 4. Đề xuất kiến trúc dữ liệu và xử lý Logic (Next Steps)
Để đảm bảo hệ thống vận hành mượt mà khi tích hợp Backend và Database, cần lưu ý các vấn đề kỹ thuật sau:
* **Chuẩn hóa cấu trúc Database (ERD):** Mối quan hệ giữa thực thể Jockey, Horse và Race là mối quan hệ M-N. Cần thiết kế một bảng trung gian (ví dụ: `Race_Assignment`) để lưu trữ chính xác bộ khóa ngoại và trạng thái tham gia của Jockey cho từng cuộc đua cụ thể.
* **Tối ưu hóa UI/UX:**
    * Bổ sung cơ chế Phân trang (Pagination) cho các bảng dữ liệu Lịch trình và Hộp thư.
    * Sử dụng màu sắc (Color Coding) trực quan hơn cho các trạng thái: Xanh lá (Đã chấp nhận/Hoàn thành), Vàng (Đang chờ/Sắp diễn ra), Đỏ (Đã từ chối).
    * Các thông tin như "Ngựa #4" hoặc "Giải đấu #1" nên được thiết kế dưới dạng liên kết (Hyperlink) để mở ra trang thông số chi tiết.

---

## 5. Bảng tổng hợp mức độ ưu tiên xử lý
Dưới đây là bảng xếp hạng thứ tự ưu tiên cho toàn bộ các hạng mục công việc bên trên để đội ngũ phát triển có thể phân bổ nguồn lực hợp lý:

| Hạng mục cần xử lý | Phân loại | Mức độ ưu tiên | Trạng thái / Hướng giải quyết |
| :--- | :---: | :---: | :--- |
| **Thiếu chức năng từ chối lời mời** | UI & Logic | 🔴 **Cao** | Blocker luồng chính. Cần bổ sung nút thao tác ngay lập tức. |
| **Cột thao tác sai ngữ cảnh** | UI/UX | 🔴 **Cao** | Dễ gây nhầm lẫn. Cần tách riêng cột Trạng thái và cột Thao tác. |
| **Thiếu thông tin phân công ở lịch đua** | Data & UI | 🔴 **Cao** | Bắt buộc bổ sung thông tin "Ngựa đua" được phân công vào bảng lịch trình. |
| **Chuẩn hóa Database (Quan hệ M-N)** | Backend | 🔴 **Cao** | Cần xử lý bảng trung gian `Race_Assignment` để chuẩn bị cho việc ghép API. |
| **Chưa có chức năng quản lý Hồ sơ** | Tính năng | 🟡 **Trung bình** | Luồng bắt buộc trong MVP, cần lên thiết kế giao diện bổ sung. |
| **Bổ sung Phân trang (Pagination)** | UI/UX | 🟡 **Trung bình** | Cần thiết để đảm bảo hiệu suất tải trang cho Hộp thư và Lịch trình. |
| **Hiển thị trạng thái trực quan (Màu sắc)** | UI/UX | 🟡 **Trung bình** | Cải thiện trải nghiệm người dùng, giúp dễ dàng nhận biết trạng thái. |
| **Liên kết dữ liệu (Hyperlink)** | UI/UX | 🟡 **Trung bình** | Giúp điều hướng nhanh đến trang chi tiết Ngựa/Giải đấu. |
| **Thiếu bộ lọc Bảng xếp hạng** | Tính năng | 🟢 **Thấp** | Chưa cấp bách, có thể bổ sung sau khi các luồng chính đã hoạt động ổn định. |