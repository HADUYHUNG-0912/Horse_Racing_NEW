# BÁO CÁO PHÂN TÍCH VÀ PHÁT TRIỂN HỆ THỐNG QUẢN LÝ GIẢI ĐUA NGỰA

Hạng mục: Đánh giá giao diện Spectator (Khán giả) & Kế hoạch hoàn thiện hệ thống MVP


## I. CÁC ĐIỂM CÒN THIẾU CỦA GIAO DIỆN SPECTATOR SO VỚI TÀI LIỆU THIẾT KẾ


Đối chiếu các tài liệu thiết kế hệ thống (Context Diagram, Use Case, Class Diagram, ERD), giao diện dành cho phân hệ Spectator hiện tại mới chỉ đáp ứng khoảng 30% các tính năng cần thiết. Cụ thể các lỗ hổng bao gồm:

1. Sự thiếu hụt dữ liệu liên kết (Data Mapping) trên Giao diện

Trận đua (Race) và Giải đấu (Tournament): Trên giao diện "Tạo dự đoán mới", hệ thống chỉ cho phép chọn Ngựa đua và Hạng dự đoán. Hoàn toàn thiếu đi trường chọn Trận đua (Race) hoặc hiển thị thông tin Giải đấu (Tournament). Khán giả không thể biết con ngựa đó thuộc trận nào, chạy lúc mấy giờ để đưa ra quyết định.

Thông tin lịch sử dự đoán đơn điệu: Bảng "Lịch sử dự đoán của bạn" đang hiển thị các cột: TRẬN ĐUA, NGỰA ĐUA, HẠNG DỰ ĐOÁN, KẾT QUẢ. Tuy nhiên, thực tế trong bảng chưa đổ ra trạng thái động như: Điểm thưởng nhận được sau mỗi trận đoán trúng (rewardPoints từ Class Spectator), hoặc Tỷ lệ/Vị trí dự đoán (predictedPosition từ Class Prediction).

2. Các Use Case cốt lõi của Spectator bị bỏ sót hoàn toàn trên UI

Theo sơ đồ Use Case Diagram và Context Diagram, vai trò Spectator có quyền xem rất nhiều luồng thông tin công khai, nhưng giao diện hiện tại chưa hề có menu hay màn hình cho các tính năng này:

Thiếu màn hình "Xem lịch thi đấu" (View Race Schedule): Khán giả không có nơi để tra cứu lịch trình các trận đua sắp diễn ra.

Thiếu màn hình "Xem kết quả trận đua" (View Race Results): Khán giả chưa thể xem danh sách kết quả các trận đua đã kết thúc (Hạng 1, 2, 3, thời gian hoàn thành cuộc đua).

Thiếu màn hình "Xem thông tin giải đấu" (View Tournament Information): Không có thông tin về cơ cấu giải thưởng, địa điểm tổ chức của giải đấu tổng thể.

3. Sự mâu thuẫn giữa Class Diagram/ERD và Giao diện Dự đoán

Trong Class Diagram và ERD, thực thể Prediction có phương thức placeBet() và thuộc tính predictedHorseId, liên kết trực tiếp giữa Spectator và một Race cụ thể thông qua thực thể Prediction.

Tuy nhiên, giao diện hiện tại thiết kế form theo dạng "chọn một con ngựa và đoán thứ hạng" mà không phân tách rõ ràng theo từng lượt chạy (Race) của giải đấu, dễ dẫn đến lỗi logic dữ liệu khi một con ngựa có thể tham gia nhiều lượt chạy khác nhau trong cả giải đấu.

Thiếu hiển thị Điểm thưởng tích lũy (Reward Points) của Spectator trên thanh Header (giao diện hiện tại chỉ hiển thị tên User 'asd' và Badge 'SPECTATOR').


## II. HƯỚNG PHÁT TRIỂN HỆ THỐNG SƠ KHAI THEO MỨC ĐỘ ƯU TIÊN (MVP)


Để hoàn thiện hệ thống từ bản sơ khai hiện tại lên bản chạy được (MVP) theo đúng tài liệu phạm vi dự án, luồng công việc cần được chia theo 3 mức độ ưu tiên rõ ràng:

1. MỨC ĐỘ ƯU TIÊN CAO (Must-Have - Phải hoàn thành để chạy được luồng)

Đây là các tính năng cốt lõi để tạo nền tảng dữ liệu cho Spectator tiêu thụ:

Hoàn thiện dữ liệu Bảng xếp hạng (Result & Ranking): Đổ dữ liệu từ bảng Ranking và Result trong cơ sở dữ liệu lên Tab "Bảng Xếp Hạng" (hiện đang trống). Hiển thị danh sách xếp hạng Ngựa (Horse Name, Tích lũy điểm) và Jockey (Jockey Name, Điểm tích lũy) sau khi được Admin/Referee xác nhận kết quả.

Ràng buộc logic Form Dự đoán (Prediction Logic): Bổ sung thêm trường Dropdown "Chọn trận đua" (Race) vào Form "Tạo dự đoán mới". Khi chọn Trận đua, Dropdown "Chọn ngựa đua" phải tự động lọc và chỉ hiển thị những con ngựa có trong trận đó. Kết nối nút "Gửi dự đoán" với API để lưu bản ghi vào bảng Prediction với trạng thái mặc định là Pending.

Xây dựng luồng Xem lịch thi đấu (View Schedule): Tạo thêm một Tab hoặc một khu vực hiển thị các trận đua sắp diễn ra (Thời gian, danh sách ngựa tham gia, trạng thái: Sắp diễn ra/Đang đua) để Spectator có thể nắm bắt thông tin và thực hiện dự đoán.

2. MỨC ĐỘ ƯU TIÊN TRUNG BÌNH (Should-Have - Tăng trải nghiệm và đúng nghiệp vụ)

Trang kết quả trận đấu (View Race Results): Xây dựng màn hình hiển thị danh sách các trận đua đã kết thúc. Khi Spectator click vào, hệ thống hiển thị chi tiết kết quả (Hạng 1, Hạng 2, Hạng 3 cùng thời gian về đích completionTime của từng ngựa).

Xử lý hậu kỳ dự đoán (Check Prediction Result): Xây dựng logic Backend tự động đối chiếu: Khi Referee nhập kết quả trận đấu (Result Input) và Admin bấm công bố (Result Publication), hệ thống tự động quét qua bảng Prediction để cập nhật và hiển thị trạng thái này trực tiếp lên bảng "Lịch sử dự đoán của bạn" (Thành Đoán trúng hoặc Đoán sai).

Cập nhật Điểm thưởng (Reward Points): Nếu kết quả dự đoán là "Trúng", kích hoạt hàm earnRewardPoints() trong Class Spectator để cộng điểm vào tài khoản khán giả. Hiển thị tổng số điểm này lên Header cạnh tên user.

3. MỨC ĐỘ ƯU TIÊN THẤP (Nice-to-Have - Tính năng mở rộng, tối ưu hóa)

Tính năng Đóng/Khóa cổng dự đoán tự động: Hệ thống tự động ẩn nút "Gửi dự đoán" hoặc vô hiệu hóa Form khi thời gian hiện tại vượt quá scheduledTime của Trận đua đó để đảm bảo tính minh bạch, tránh gian lận.

Hệ thống đổi thưởng ảo (Redeem Reward Points): Phát triển hàm redeemRewardPoints() theo Class Diagram. Khán giả dùng điểm thưởng tích lũy được từ việc đoán đúng để đổi các phần quà ảo hoặc danh hiệu trên hệ thống.

Bảng xếp hạng Khán giả (Spectator Leaderboard): Bổ sung thêm một cột hoặc một bảng phụ trong Tab Bảng Xếp Hạng để vinh danh những Spectator có số điểm dự đoán cao nhất hệ thống nhằm tăng tính tương tác (Gamification).


## III. BẢNG TỔNG HỢP KẾ HOẠCH TRIỂN KHAI THEO CHỈ TIÊU KỸ THUẬT



### Bảng tổng hợp kế hoạch triển khai


| STT | Tên Tính Năng / Task | Phân Hệ / Module Liên Quan | Mức Độ Ưu Tiên | Mô Tả Kỹ Thuật Dự Kiến |

| --- | --- | --- | --- | --- |

| 1 | Cập nhật Form chọn Trận đua | Spectator & Prediction | CAO | Thêm Dropdown Chọn Trận đua; Filter danh sách ngựa theo raceId. |

| 2 | Đổ dữ liệu Bảng xếp hạng | Result & Ranking | CAO | Viết API lấy dữ liệu từ bảng RANKING, hiển thị lên giao diện UI hiện tại. |

| 3 | Xử lý API Gửi dự đoán | Spectator & Prediction | CAO | Lưu dữ liệu vào bảng PREDICTED, liên kết User_ID, Race_ID, Horse_ID. |

| 4 | Màn hình Lịch thi đấu | Tournament & Race Management | CAO | Hiển thị danh sách các trận đấu dựa trên thực thể RACE và ROUND. |

| 5 | Tự động cập nhật kết quả dự đoán | Result & Ranking | TRUNG BÌNH | Viết trigger/function so sánh predictedPosition với finishPosition trong bảng RESULT. |

| 6 | Hiển thị & cộng điểm thưởng | User Management / Spectator | TRUNG BÌNH | Hiển thị biến rewardPoints lên UI; cộng điểm khi kết quả dự đoán là 'Won'. |

| 7 | Khóa cổng dự đoán tự động | Spectator & Prediction | THẤP | So sánh System.time với scheduledTime của trận đấu để disable form. |

| 8 | Bảng xếp hạng Spectator | Spectator & Prediction | THẤP | Truy vấn Top User có rewardPoints cao nhất và hiển thị lên tab Bảng xếp hạng. |