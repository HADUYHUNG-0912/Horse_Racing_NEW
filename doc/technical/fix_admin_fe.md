## I. CÁC CÔNG VIỆC FE ĐÃ HOÀN THÀNH (FILE: `AdminPanel.js`)

### 1. Sửa lỗi lệch cột tại bảng "Danh sách Giải đấu hiện tại"
* **Vấn đề:** Cập nhật giao diện bảng để Admin có thể thao tác xóa trực tiếp.
* Thêm nút bấm ` Xóa` (`<button>`) vào dòng dữ liệu và liên kết với sự kiện `onClick={() => deleteTournament(t.id)}`..

### 2. Chặn nhập số âm và ký tự lạ tại các Form nhập liệu số (`type="number"`)
* **Vấn đề:** Thẻ input số mặc định của trình duyệt vẫn cho phép nhấn dấu trừ `-` hoặc ký tự `e` từ bàn phím, dẫn đến việc Admin có thể nhập số âm hoặc khoảng cách trận đua sai thực tế.
* **Giải pháp đã làm:** * Áp dụng thuộc tính `onKeyDown` để chặn triệt để các phím `-` và `e` tại ô nhập Thứ tự vòng đấu (`Sequence`) và Khoảng cách trận đua (`Distance`).
  * Cấu hình lại hàm `onChange` để tự động kiểm tra dữ liệu đầu vào: nếu phát hiện số âm hoặc nhỏ hơn 1 (do sao chép/dán), hệ thống sẽ tự động ép giá trị về mức tối thiểu là `1`.

### 1. Thêm nút "Xóa" và đồng bộ hóa giao diện bảng Giải đấu
* **Nhiệm vụ:** Tích hợp tính năng Xóa giải đấu vào giao diện dựa trên API xóa của Backend.
* **Chi tiết thực hiện:** 
  * Thêm tiêu đề `<th>Thao tác</th>` vào cấu trúc bảng (`<thead>`).
  * Thêm nút bấm ` Xóa` (`<button>`) vào dòng dữ liệu và liên kết với sự kiện `onClick={() => deleteTournament(t.id)}`.
  * Bổ sung đầy đủ thẻ `<td>` hiển thị dữ liệu trạng thái (`t.status`) bị thiếu trước đó. Giúp sửa triệt để lỗi lệch hàng, lệch cột; bảng đã hiển thị chuẩn chỉnh, ngay hàng thẳng lối theo đúng 7 cột.
  
### 4. Khắc phục lỗi lặp mảng lồng nhau (Chặn lỗi Crash/Build)
* **Giải pháp đã làm:** Thay đổi phương thức xử lý mảng từ `.map()` lồng nhau sang `.flatMap()` tại form chọn Vòng đấu của Trận đua. Giúp mảng được làm phẳng cấu trúc, xử lý triệt để lỗi trùng lặp key ẩn và tối ưu hiệu năng render của React.
