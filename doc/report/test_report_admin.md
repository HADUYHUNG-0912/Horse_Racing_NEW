# Báo Cáo Kiểm Thử Tích Hợp: Giải Đua & Tự Động Trao Giải

Dưới đây là tổng hợp kết quả kiểm thử (testing) cho các luồng nghiệp vụ mà bạn đã yêu cầu, cùng với các vấn đề/bug tiềm ẩn được phát hiện trong mã nguồn backend cần được khắc phục.

## 1. Khởi tạo Giải đấu & Cơ cấu giải thưởng
**Các bước đã thực hiện test API:**
- [x] Đăng nhập tài khoản `admin` thành công và lấy được JWT Token.
- [x] Gửi request tạo giải đấu `Giải Đua Siêu Cúp Phase 4` với thời gian và địa điểm hợp lệ.
- [x] Tạo thành công cơ cấu giải thưởng cho giải đấu (Hạng 1: Cúp Vàng, Hạng 2: Cúp Bạc).
- [x] Chuyển đổi trạng thái giải đấu từ `UPCOMING` sang `ACTIVE`.

**Kết quả:**
- **Thành công (PASS).** Tất cả các API (`POST /tournaments/`, `POST /tournaments/{id}/prizes`, `PUT /tournaments/{id}/status`) đều trả về mã `20X` hợp lệ. Dữ liệu được ghi nhận chính xác vào cơ sở dữ liệu.

---

## 2. Dynamic Leaderboard (Bảng Xếp Hạng Động)
**Các bước đã thực hiện test API:**
- [x] Lấy ID của giải đấu đang có dữ liệu thực tế (VD: `Spring Derby 2026`).
- [x] Gọi API `/api/v1/results/rankings?tournament_id={id}` để kiểm tra.

**Kết quả:**
- **Thành công (PASS).** Dữ liệu được lọc động chính xác theo giải đấu. Trả về đúng danh sách ngựa và jockey dựa trên tổng điểm đạt được (Ví dụ: `Windrunner` 10 điểm, `Pegasus` 6 điểm). Không còn tình trạng mảng trống (lỗi cũ đã được fix).

---

## 3. Kết thúc giải đấu & Tự động trao giải
**Các bước đã thực hiện test API:**
- [x] Gọi API chuyển trạng thái của giải đấu đang có kết quả sang `COMPLETED`.
- [x] Gọi API `/api/v1/tournaments/{id}/awards` để lấy danh sách giải thưởng đã trao.

**Kết quả:**
- **Thành công (PASS).** Hệ thống tự động gọi hàm `_auto_award`. Cơ sở dữ liệu ghi nhận `Windrunner` và `Mike Jockey` (10 điểm) nhận **Cúp Vàng/Giải Nhất**, `Pegasus` và `Sarah Jockey` (6 điểm) nhận **Cúp Bạc/Giải Nhì**. Dữ liệu map khớp hoàn toàn.

---

> [!WARNING]
> ## 🐛 Các Bug và Vấn Đề Tiềm Ẩn Cần Sửa
> Qua quá trình phân tích mã nguồn (`tournaments.py` và `results.py`) và kiểm thử, tôi phát hiện một số bug logic cần khắc phục để hệ thống chặt chẽ hơn:

### Bug 1: Không có cơ chế Tie-break (Hòa điểm)
- **Vấn đề:** Trong hàm `_auto_award` (`tournaments.py`) và truy vấn Leaderboard (`results.py`), hệ thống xếp hạng chỉ dùng `ORDER BY total_points DESC`. Nếu 2 con ngựa có cùng điểm số, SQL sẽ trả về thứ tự ngẫu nhiên.
- **Hệ quả:** Ngựa A và Ngựa B cùng được 10 điểm, nhưng hệ thống có thể trao Cúp Vàng cho ngựa B và Cúp Bạc cho ngựa A một cách ngẫu nhiên.
- **Cách fix:** Cần bổ sung thêm tiêu chí phụ trong `ORDER BY`, ví dụ như tổng số lần về nhất, thời gian hoàn thành cuộc đua trung bình thấp nhất, hoặc `ORDER BY total_points DESC, reg.id ASC` để kết quả luôn nhất quán.

### Bug 2: Xung đột ID (Collision) trong API Rankings
- **Vấn đề:** Trong `app/api/v1/results.py`, danh sách Leaderboard trả về `id` giả cho Jockey bằng cách lấy `id = idx + 1000`. 
- **Hệ quả:** Nếu một giải đấu có quy mô lớn với hơn 1000 ngựa tham gia, `id` của Horse và Jockey sẽ bị trùng lặp, có thể gây lỗi render `key` ở frontend (React/Vue).
- **Cách fix:** Nên sử dụng kiểu chuỗi ghép cho ID ảo, ví dụ: `id=f"horse_{horse_id}"` và `id=f"jockey_{jockey_id}"` thay vì dùng số nguyên cộng dồn.

### Bug 3: Trao giải ngẫu nhiên khi giải đấu bị Hủy / Không có cuộc đua
- **Vấn đề:** Hàm `_auto_award` có logic fallback: Nếu không có kết quả đua nào (`if not rows`), hệ thống tự động lấy toàn bộ các đăng ký ở trạng thái `APPROVED`, gán cho chúng `0` điểm, rồi tiến hành trao giải từ trên xuống.
- **Hệ quả:** Nếu một giải đấu bị đổi sang `COMPLETED` nhưng thực tế chưa diễn ra cuộc đua nào (hoặc bị lỗi chưa nhập kết quả), hệ thống vẫn tự động phát Cúp Vàng, Cúp Bạc cho những con ngựa đăng ký đầu tiên.
- **Cách fix:** Sửa logic fallback. Nếu `total_points` cao nhất là `0` hoặc không có dữ liệu Results, hệ thống nên ném ra lỗi (HTTP 400) yêu cầu phải có kết quả đua mới được chuyển sang `COMPLETED`, hoặc không phát thưởng.
