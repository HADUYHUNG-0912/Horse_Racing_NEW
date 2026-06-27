# 🐛 Báo Cáo Lỗi & Khuyến Nghị Sửa Đổi - Phase 4 (Huệ - Frontend Admin)

*   **Nhánh Git:** `feature/fe-admin-phase4-ui`
*   **Người thực hiện:** Huệ
*   **Trạng thái review:** Cần sửa lỗi nhỏ để gộp nhánh

---

## 🚨 CÁC LỖI CẦN SỬA (BUGS)

### 1. Gọi sai đường dẫn API cập nhật trạng thái Giải đấu (Lỗi 404)
*   **File:** [AdminPanel.js](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/frontend/app/dashboard/components/AdminPanel.js)
*   **Vị trí lỗi:** Hàm `handleUpdateTournamentStatus` (khoảng dòng 140):
    ```javascript
    const handleUpdateTournamentStatus = async (id, status) => {
      try {      
        await api.put(`/tournaments/status/${id}`, { new_status: status });            
        showMsg(`Chuyển trạng thái giải đấu sang "${status}" thành công!`);
        loadData(); 
      } catch (err) {
        showMsg(err.message, "error");
      }
    };
    ```
*   **Chi tiết:** Bạn đang gọi trực tiếp tới `/tournaments/status/${id}`. Tuy nhiên, Backend thiết lập route là `PUT /tournaments/{id}/status`.
*   **Hậu quả:** Khi Admin nhấn vào nút `▶️ Mở giải` hoặc `🏁 Kết thúc & Trao thưởng`, hệ thống sẽ trả về lỗi **404 Not Found** và không thể đổi trạng thái giải đấu.
*   **Cách khắc phục:**
    Sửa lại URL gọi API thành `/tournaments/${id}/status`.
    Hoặc tốt nhất, hãy sử dụng hàm helper `updateTournamentStatus(id, status)` đã được bạn định nghĩa sẵn trong file [api.js](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/frontend/app/api.js) (dòng 110) nhưng chưa được gọi ở đây.

### 2. Thiếu chức năng xóa Giải thưởng trên UI
*   **File:** [AdminPanel.js](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/frontend/app/dashboard/components/AdminPanel.js)
*   **Chi tiết:** Trong bảng danh sách giải thưởng của giải đấu đã cấu hình, bạn mới chỉ vẽ các cột hiển thị thông tin (`Thứ hạng`, `Tên giải`, `Tiền thưởng`, `Trực quan người nhận`), thiếu cột hành động để Admin **Xóa giải thưởng** (gọi API DELETE).
*   **Cách khắc phục:** Bổ sung nút xóa gọi tới API `DELETE /tournaments/{id}/prizes/{prize_id}` để khớp hoàn toàn với đặc tả CRUD Giải thưởng.

---

## 🤝 CHỒNG LẤN GIAO DIỆN (DUPLICATE UI)
*   Bạn đã tự viết giao diện cấu hình giải thưởng trực tiếp trong `AdminPanel.js` (tab `prizes`). Trong khi đó, Gia Huy (Backend) cũng viết một component riêng tên là `PrizesPanel.js` và đưa vào `page.js`.
*   **Giải pháp xử lý:** Do component `PrizesPanel.js` của Gia Huy có giao diện hoàn chỉnh hơn và hỗ trợ sẵn nút Xóa (Delete) giải thưởng kết nối với API, nhóm trưởng đề xuất thống nhất sử dụng component `PrizesPanel.js` của Gia Huy.
*   Bạn sẽ phối hợp để chuyển giao/gộp giao diện của mình nếu cần thiết, tránh dư thừa mã nguồn.
