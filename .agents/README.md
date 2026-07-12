# TASK 9 — LOADING, EMPTY, ERROR

## Loading

Hiển thị:

```text
Đang tải danh sách giải thưởng...
```

## Empty

Khi API trả về `[]`, hiển thị chính xác:

```text
Chưa có giải thưởng nào.
```

## Error

- Hiển thị message dễ hiểu
- Không hiện stack trace
- Không làm hỏng toàn bộ OwnerPanel
- Có thể thêm nút thử lại nếu phù hợp

## Cách test

Chạy FE và BE.

Kiểm tra:

1. Loading khi request đang chạy
2. Empty khi API trả `[]`
3. Error khi tắt Backend hoặc API lỗi
4. Tab khác vẫn hoạt động

## Commit đề xuất

```bash
git commit -m "fix(owner): handle owner awards states"
```

---

# TASK 10 — INTEGRATION TEST

## Backend

Kiểm tra:

- OWNER truy cập được
- Role khác bị chặn
- Không lộ award owner khác
- Response đủ field
- Không có award trả `[]`
- Field `NULL` không gây lỗi
- Owner không có profile được xử lý rõ

## Frontend

Kiểm tra:

- Tab Awards xuất hiện
- Click tab gọi API đúng lúc
- Không request lặp
- Loading đúng
- Empty đúng
- Huy chương đúng
- Prize hiển thị rõ
- Không có `undefined`, `null`, `NaN`
- Tab cũ vẫn hoạt động
- Console không có lỗi mới

## Testcase theo plan

Nếu có seed:

```text
Wind Dancer
Spring Derby 2026
```

Thì kiểm tra award hiển thị đúng.

Nếu không có seed, chỉ báo lại.

## Kiểm tra Git

```bash
git status
git diff --stat
git diff
```

Đảm bảo không có file rác:

```text
.env
node_modules
__pycache__
.next
*.pyc
```

## Commit

Chỉ commit nếu Task 10 có sửa lỗi.

Ví dụ:

```bash
git commit -m "fix(owner): fix owner awards integration issues"
```

Nếu chỉ test, không cần commit.

---

# TASK 11 — CHUẨN BỊ PULL REQUEST

## Nhánh

```text
feature/phase5-owner → main
```

## Cần kiểm tra

```bash
git status
git log --oneline main..feature/phase5-owner
git diff --stat main...feature/phase5-owner
```

## Báo cáo

- Danh sách commit
- Danh sách file thay đổi
- Tóm tắt Backend
- Tóm tắt Frontend
- Kết quả test
- Vấn đề còn tồn tại
- PR title
- PR description

## PR title đề xuất

```text
feat(owner): add owner awards tab and API
```

## Không được

- Không push
- Không tạo PR
- Không merge vào `main`

---

# Lệnh bắt đầu

Bây giờ chỉ thực hiện:

```text
TASK 4 — TEST BACKEND API
```

Sau khi xong phải dừng lại.