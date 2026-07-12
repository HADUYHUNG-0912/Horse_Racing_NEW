# TASK 6 — THÊM TAB AWARDS

## File

```text
source-code/frontend/app/dashboard/components/OwnerPanel.js
```

## Yêu cầu

Thêm tab:

```text
🏆 Cúp & Giải thưởng
```

## Phạm vi

- Thêm tab
- Cho phép chọn tab
- Hiển thị nội dung tạm
- Chưa gọi API
- Chưa render dữ liệu award

Nội dung tạm có thể là:

```text
Đang phát triển nội dung giải thưởng.
```

## Cách test

Chỉ cần chạy Frontend:

```bash
cd source-code/frontend
npm run dev
```

Kiểm tra:

- Tab xuất hiện
- Chuyển tab được
- Active state đúng
- Tab cũ không bị lỗi
- Console không có lỗi mới

## Commit đề xuất

```bash
git commit -m "feat(owner): add owner awards tab"
```

---

# TASK 7 — FETCH AWARDS API

## Yêu cầu

Khi chọn tab Awards:

1. Gọi API Awards.
2. Gắn token đúng cách.
3. Thêm state:
   - `awards`
   - `loading`
   - `error`
4. Không gọi request lặp.
5. Không gọi API khi chưa mở tab, trừ khi code hiện tại tải trước dữ liệu.
6. Xử lý response rỗng.
7. Xử lý lỗi `401`, `403`, `404`, lỗi mạng.

## Phạm vi

- Chỉ fetch dữ liệu
- Có thể tạm render số lượng hoặc JSON
- Chưa cần UI card/bảng hoàn chỉnh

## Cách test

Chạy cả Backend và Frontend.

Mở DevTools → Network.

Khi click tab Awards, kiểm tra:

- Có request GET đúng URL
- Có token
- Request không lặp vô hạn
- Response nhận đúng dữ liệu

## Commit đề xuất

```bash
git commit -m "feat(owner): fetch owner awards"
```

---

# TASK 8 — HIỂN THỊ 
Một góp ý nhỏ cho Task 8

Hiện prize_value đang là:

5000000.00

Ở Task 8 mình sẽ yêu cầu Agent hiển thị đẹp hơn, ví dụ:

💰 5.000.000 VNĐ

hoặc

💰 5.000.000 ₫

và thay JSON bằng các card giải thưởng có:

🥇 Hạng 1
🐎 Tên ngựa
👤 Nài ngựa
🏆 Tên giải
💰 Giá trị giải
📝 Ghi chú

để đúng với kế hoạch Phase 5 và giao diện hiện tại

## Dữ liệu cần hiển thị

- `tournament_name`
- `horse_name`
- `jockey_name`
- `rank`
- `title`
- `prize_value`
- `notes`

## Yêu cầu UI

- Dùng card hoặc bảng phù hợp với OwnerPanel hiện tại.
- Hạng 1:

```text
🥇 Hạng 1
```

- Hạng 2:

```text
🥈 Hạng 2
```

- Hạng 3:

```text
🥉 Hạng 3
```

- Hạng khác:

```text
Hạng {rank}
```

## Prize value

Có thể format bằng:

```javascript
Number(prizeValue).toLocaleString("vi-VN")
```

Chỉ thêm `VNĐ` hoặc `₫` nếu dữ liệu xác nhận là tiền Việt Nam.

## Dữ liệu thiếu

- `jockey_name` → `Chưa có thông tin`
- `notes` → `Không có ghi chú`
- `prize_value` → `Chưa cập nhật`

Không được hiển thị:

```text
undefined
null
NaN
```

## Cách test

Chạy cả FE và BE.

Kiểm tra:

- Đủ 7 trường
- Huy chương đúng
- Prize hiển thị rõ
- Không lỗi Console
- Không sai style hiện tại

## Commit đề xuất

```bash
git commit -m "feat(owner): display owner awards"
```

---

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