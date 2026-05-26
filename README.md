
````markdown
# Horse Racing Tournament Management System

## Project Structure

```text
Horse_Racing_NEW/
├── report-latex/     # Báo cáo LaTeX
├── source-code/      # Source code chính
│   ├── frontend/     # Giao diện
│   ├── backend/      # API / xử lý nghiệp vụ
│   └── database/     # ERD, SQL, dữ liệu mẫu
└── README.md
````

## Branches

| Branch                            | Mục đích                             |
| --------------------------------- | ------------------------------------ |
| `main`                            | Bản final để nộp/demo                |
| `dev`                             | Nhánh tổng hợp chung                 |
| `feature/auth-user`               | Đăng nhập, đăng ký, phân quyền       |
| `feature/horse-jockey`            | Quản lý ngựa, jockey, lời mời jockey |
| `feature/tournament-registration` | Tạo giải đấu, race, đăng ký ngựa     |
| `feature/scheduling-referee`      | Lập lịch race, phân công referee     |
| `feature/result-ranking`          | Nhập kết quả, cập nhật ranking       |
| `feature/spectator-view`          | Khán giả xem lịch, kết quả, ranking  |
| `feature/database`                | Database schema, ERD, SQL script     |

## Git Rules

* Không push trực tiếp lên `main`.
* Mỗi người làm trên branch được phân công.
* Trước khi code: `git pull origin dev`.
* Làm xong thì push branch của mình.
* Tạo Pull Request từ `feature/*` vào `dev`.
* Leader review xong mới merge.
* Khi `dev` ổn định mới merge vào `main`.
* Mỗi buổi trước khi làm hãy git pull origin dev 

## Commit Message

Viết rõ nội dung đã làm.

Ví dụ:

```bash
git commit -m "Add login API"
git commit -m "Create horse management page"
git commit -m "Update database schema"
```

```

