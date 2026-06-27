# 🐛 Báo Cáo Lỗi & Khuyến Nghị Sửa Đổi - Phase 4 (Thuỳ Anh - Horse Owner)

*   **Nhánh Git:** `feature/owner-profile-and-races`
*   **Người thực hiện:** Thuỳ Anh
*   **Trạng thái review:** Đã sửa lỗi và gộp (Merged & Fixed)
*   **Mức độ hoàn thiện tổng thể:** 100% (Đã tích hợp)

---

## 🚨 CÁC LỖI ĐÃ SỬA (BUGS FIXED)

### 1. Lỗi lệch múi giờ khi lọc lịch thi đấu sắp diễn ra (Timezone Offset Bug)
*   **File:** [owners.py](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/backend/app/api/v1/owners.py)
*   **Chi tiết lỗi:**
    *   Sử dụng giờ hiện tại ở dạng UTC (`datetime.utcnow()`) so sánh với thời gian trận đấu được lưu naive local Việt Nam (UTC+7) làm lịch thi đấu bị lệch 7 tiếng.
*   **Trạng thái khắc phục:**
    *   ✅ Đã sửa đổi sử dụng hàm `get_vietnam_now_naive()` từ `app.core.timezone_utils` để đồng nhất múi giờ.

---

## ⚠️ ĐỀ PHÒNG XUNG ĐỘT TÍCH HỢP (INTEGRATION CONFLICT WARNING)

### 1. Phụ thuộc vào các trường Database mới
*   Trong API cập nhật profile (`owners.py`), gọi tới các cột `phone_number` và `avatar` trong bảng `Users`.
*   *Lưu ý:* Cần đảm bảo các cột này được giữ lại sau khi merge các nhánh khác. (Đã gộp và bảo toàn thành công).

---

## 👍 ĐIỂM CỘNG & ĐÁNH GIÁ CHUNG
*   Các chức năng phụ trợ như thêm ràng buộc (chỉ cho phép mời 1 jockey cho 1 ngựa và ngược lại trong cùng 1 giải đấu) được triển khai rất tốt bằng SQL.
*   Giao diện form Profile có cơ chế fallback avatar tốt và bố cục rõ ràng.
*   Mã nguồn sạch, có tổ chức schema Pydantic đầy đủ và đăng ký router chính xác trong `main.py`.
