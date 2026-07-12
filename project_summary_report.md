# 📊 BÁO CÁO TỔNG HỢP DỰ ÁN (GIT & JIRA SUMMARY REPORT)

> Báo cáo hợp nhất số liệu từ lịch sử Git Commits và bảng quản trị công việc Jira Cloud của dự án **Hệ thống Quản lý Đua ngựa (Horse Racing)**.  
> Ngày báo cáo: **07/07/2026**

---

## 📈 1. CHỈ SỐ SỨC KHỎE DỰ ÁN (PROJECT HEALTH METRICS)

*   **Thời gian thực hiện:** 26/05/2026 – 07/07/2026 (~42 ngày).
*   **Tổng số Commits (nhánh chính `main`):** `338` commits.
*   **Tổng số thẻ công việc (Jira Tasks):** `94` tasks.
*   **Tỷ lệ hoàn thành công việc:** **100.00%** (Tất cả 94 tasks đã ở trạng thái **Done**).
*   **Tổng lượng thay đổi mã nguồn:** **+300,164** dòng thêm, **-244,473** dòng bớt.

---

## 👥 2. BẢNG ĐỐNG GÓP & SO SÁNH GIỮA GIT VÀ JIRA

Bảng dưới đây ánh xạ trực tiếp tài khoản Git và Jira của từng thành viên để đánh giá toàn diện mức độ đóng góp:

| Thành viên | Tài khoản Git | Tài khoản Jira | Số Commits (`main`) | Tỷ lệ Commit | Số Task Jira | Tỷ lệ Task | Số dòng thay đổi (Git) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Duy Hưng** | Duy Hung <br>*(HADUYHUNG-0912)* | Hung Ha | 97 | 28.70% | 16 | 17.02% | +85,788 / -67,034 |
| **Thùy Anh** | Dinh Thuy Anh | Thuỳ Anh | 58 | 17.16% | 8 | 8.51% | +59,250 / -38,897 |
| **Nguyễn Gia Huy** | maydtt6742-bit | Nguyễn Gia Huy | 44 | 13.02% | 14 | 14.89% | +39,802 / -62,228 |
| **Bùi Huy** | huyblq0064-N3 | buiquanghuy3582006 | 41 | 12.13% | 8 | 8.51% | +30,816 / -18,537 |
| **Thái Châu** | tchau0203 | Thái Châu | 39 | 11.54% | 8 | 8.51% | +36,862 / -24,167 |
| **Đoàn Thị Thu Mây**| PhoDafan | Đoàn Thị Thu Mây | 38 | 11.24% | 10 | 10.64% | +5,675 / -1,798 |
| **Minh Huệ** | hueltm2275 | lemyhue1803 | 21 | 6.21% | 10 | 10.64% | +12,171 / -31,812 |
| *Chung/Chưa gán* | — | Unassigned | — | — | 20 | 21.28% | — |
| **TỔNG CỘNG** | | | **338** | **100%** | **94** | **100%** | **+300,164 / -244,473** |

---

## 📅 3. ĐƯỜNG CONG TIẾN ĐỘ DỰ ÁN (MILESTONES & TIMELINE)

1.  **Giai đoạn Khởi động & Nghiên cứu (26/05 - 15/06):**
    *   Tần suất hoạt động thấp, tập trung nghiên cứu yêu cầu nghiệp vụ hệ thống đua ngựa và xây dựng cấu trúc sơ bộ.
2.  **Giai đoạn Phát triển phân hệ chính (16/06 - 30/06):**
    *   Phát triển API và các giao diện Dashboard cơ bản cho Admin, Owner, Jockey, Referee, Spectator.
3.  **Giai đoạn Nước rút & UAT Nghiệm thu (01/07 - 05/07):**
    *   Đạt đỉnh điểm năng suất với **187 commits** chỉ trong 5 ngày (chiếm 55% tổng số commit toàn dự án). Tất cả các lỗi logic kiểm tra trùng lịch (±2 giờ), logic tự động xếp làn và trao giải đã được tối ưu hoàn tất.
4.  **Giai đoạn Hoàn thiện báo cáo & Đóng dự án (06/07 - 07/07):**
    *   Toàn bộ 94 task trên Jira đã được chuyển sang trạng thái **Done**, báo cáo LaTeX nghiệm thu đã được tổng hợp xong và hệ thống sẵn sàng hoạt động ở môi trường local.

---

## 🎯 4. ĐÁNH GIÁ CHUNG VỀ SỰ HIỆP TÁC (TEAMWORK INSIGHTS)

*   **Sự phân chia đồng đều:** Ngoại trừ Trưởng nhóm (Duy Hưng) đóng vai trò điều phối tích hợp mã nguồn chính có số lượng commit và task vượt trội, lượng commits của 6 thành viên còn lại dao động ổn định trong khoảng **17.16% – 6.21%** và lượng tasks Jira trong khoảng **14.89% - 8.51%**. Điều này thể hiện khối lượng công việc được phân bổ hợp lý, không có hiện tượng "quá tải cục bộ" ở bất kỳ thành viên nào.
*   **Mức độ Code Churn lành mạnh:** Lượng dòng code thêm mới và sửa đổi ở mức cao cho thấy đội ngũ đã tiến hành refactor, tối ưu hóa các module liên tục để đảm bảo chất lượng hệ thống trước khi nghiệm thu bàn giao.
