# Horse Racing Tournament Management System 🏇🏆
Hệ thống Quản lý Giải đua ngựa - Dự án môn Công nghệ Phần mềm (CNPM).

Dự án này là một ứng dụng web hoàn chỉnh phục vụ cho việc tổ chức, giám sát và tham gia các giải đua ngựa. Hệ thống phân quyền cho 5 đối tượng người dùng chính: **Admin** (Quản trị viên), **Referee** (Trọng tài), **Horse Owner** (Chủ ngựa), **Jockey** (Nài ngựa), và **Spectator** (Khán giả dự đoán thưởng).

---

## 📂 Cấu trúc dự án (Project Structure)

Dự án được tổ chức rõ ràng thành các thư mục chính phục vụ cho lập trình, kiểm thử và tài liệu hóa:

```
Horse_Racing_NEW/
│
├── 📁 source-code/          # Mã nguồn ứng dụng
│   ├── 📁 backend/          # FastAPI Web API (Python)
│   │   ├── 📁 app/          # Thư mục ứng dụng chính (models, schemas, api, core...)
│   │   ├── 📄 db_setup.py   # Script khởi tạo cơ sở dữ liệu và seed dữ liệu mẫu
│   │   └── 📄 requirements.txt
│   │
│   ├── 📁 frontend/         # Next.js / React App (JavaScript & Tailwind CSS)
│   │   ├── 📁 app/          # App Router (dashboard, auth, components...)
│   │   └── 📄 package.json
│   │
│   └── 📁 database/         # Script cơ sở dữ liệu
│       └── 📄 schema.sql    # Lược đồ database cho MS SQL Server
│
├── 📁 doc/                  # Tài liệu quản lý và kỹ thuật của đội ngũ phát triển
│   ├── 📁 git/              # Hướng dẫn chiến lược Git branching và quy tắc commit
│   ├── 📁 plan/             # Kế hoạch phát triển dự án và kế hoạch Phase 4
│   ├── 📁 report/           # Báo cáo kết quả review code, đánh giá chức năng từng phân hệ
│   ├── 📁 task/             # Phân công nhiệm vụ chi tiết và checklists phát triển
│   ├── 📁 technical/        # Sơ đồ ERD, luồng xử lý và tài liệu kiến trúc kỹ thuật
│   └── 📁 test/             # Hướng dẫn kịch bản kiểm thử (test cases) các Phase
│
├── 📁 report-latex/         # Thư mục mã nguồn tài liệu báo cáo chính thức (LaTeX)
│   ├── 📁 TeX_files/        # Các chương nội dung (SRS, SDD, Management Plan...)
│   ├── 📁 images/           # Sơ đồ, ảnh thiết kế giao diện
│   └── 📄 main.tex          # File cấu hình biên dịch LaTeX chính
│
├── 📁 report_latex_final/   # Bản xuất bản báo cáo LaTeX đã build hoàn thiện
└── 📄 test_bugs_report.py   # Script kiểm tra tự động chất lượng và tính đúng đắn của mã nguồn
```

---

## 🛠️ Hướng dẫn cài đặt và Khởi chạy (Getting Started)

### 1. Cơ sở dữ liệu (Database Setup)
Dự án sử dụng cơ sở dữ liệu **Microsoft SQL Server**.
1. Cài đặt MS SQL Server (khuyến nghị LocalDB hoặc SQL Server Express).
2. Tạo cơ sở dữ liệu mới tên là `HorseRacing`.
3. Chạy file script [source-code/database/schema.sql](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/database/schema.sql) để tạo cấu trúc bảng.

### 2. Backend API Setup
1. Truy cập thư mục backend:
   ```bash
   cd source-code/backend
   ```
2. Tạo môi trường ảo và cài đặt thư viện:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate   # Trên Windows
   pip install -r requirements.txt
   ```
3. Tạo file cấu hình môi trường `.env` dựa theo file [.env.example](file:///e:/CNPM/Project/Horse_Racing_NEW/source-code/backend/.env.example) và điền cấu hình kết nối SQL Server của máy bạn.
4. Chạy script để tạo bảng tự động và nạp dữ liệu mẫu (Seed data):
   ```bash
   python db_setup.py
   ```
5. Khởi chạy server API (Uvicorn):
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 3. Frontend App Setup
1. Truy cập thư mục frontend:
   ```bash
   cd source-code/frontend
   ```
2. Cài đặt các gói dependency Node.js:
   ```bash
   npm install
   ```
3. Khởi chạy ứng dụng ở môi trường Development:
   ```bash
   npm run dev
   ```
4. Mở trình duyệt và truy cập: `http://localhost:3000`

---

## 🌿 Quy trình Phân nhánh Git (Git Workflow)

*   **`main`**: Nhánh chứa mã nguồn ổn định nhất phục vụ cho đóng gói phát hành.
*   **`dev-GiaHuy`**: Nhánh phát triển chính của đội ngũ. Tất cả các tính năng sau khi được kiểm duyệt thông qua PR sẽ được gộp vào đây.
*   **`feature/<tên_tính_năng>`**: Các nhánh phát triển tính năng riêng của từng thành viên, được chia nhỏ theo vai trò (ví dụ: `feature/jockey-fix2`, `feature/spectator-fix2`...).

*Chi tiết tài liệu hướng dẫn phát triển được lưu trữ đầy đủ tại thư mục [doc/](file:///e:/CNPM/Project/Horse_Racing_NEW/doc).*
