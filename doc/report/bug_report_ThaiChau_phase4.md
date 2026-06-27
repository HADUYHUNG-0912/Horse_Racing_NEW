# 🐛 Báo Cáo Lỗi & Khuyến Nghị Sửa Đổi - Phase 4 (Thái Châu - Jockey)

- **Nhánh Git:** `feature/jockey-leaderboard-filter`
- **Người thực hiện:** Thái Châu (tchau0203)
- **Số commit:** 3 (`d6435ad`, `f85ec6a`, `a91186e`)
- **Trạng thái review:** Cần sửa lỗi logic nghiêm trọng (client-side filter sai) + khôi phục 5 regressions
- **Mức độ hoàn thiện tổng thể:** ~65% (cần fix trước khi merge)

---

## A. 🚨 LỖI LOGIC NGHIÊM TRỌNG (BUGS)

### Bug 1: Lọc bảng xếp hạng theo Giải đấu sai cách (Client-side Filter)

- **File:** `source-code/frontend/app/dashboard/components/Leaderboard.js`
- **Vị trí:** Hàm `loadAll` và biến `filteredRankings`

```javascript
// Bạn gọi API lấy bảng xếp hạng chung 1 lần duy nhất:
const [rankData, tourData] = await Promise.all([
  api.get("/results/rankings"),       // ← Chỉ gọi 1 lần, không có tournament_id
  api.get("/tournaments"),
]);

// Sau đó tự lọc ở phía Client (dòng 34):
const filteredRankings = selectedTournament === "all"
  ? rankings
  : rankings.filter(r => String(r.tournament_id) === selectedTournament);
```

**🔍 Phân tích nguyên nhân:**

API `GET /results/rankings` (khi không có param `tournament_id`) trả về dữ liệu từ bảng `Rankings` trong database. Bảng này **chỉ lưu bảng xếp hạng TOÀN CỤC (GLOBAL)** và hoàn toàn **không có cột `tournament_id`**.

Xem code Backend tại `results.py`:
```python
@router.get("/rankings", response_model=List[RankingOut])
def read_rankings(tournament_id: Optional[int] = None, db: Session = Depends(get_db)):
    if tournament_id:
        # Tính toán ĐỘNG theo giải đấu
        ...
    else:
        # Trả về bảng Rankings TOÀN CỤC - không có tournament_id
        rankings = db.query(Ranking).order_by(Ranking.entity_type, Ranking.rank).all()
```

**❌ Hậu quả:** Mảng `rankings` nhận về sẽ không chứa thông tin `tournament_id` nào. Khi người dùng chọn lọc theo bất kỳ Giải đấu nào, điều kiện `r.tournament_id === "5"` sẽ luôn trả về **FALSE** (vì `tournament_id` là undefined). Bảng xếp hạng sẽ trống trơn và hiện chữ "Chưa có dữ liệu".

**✅ Cách khắc phục:**
Khôi phục cơ chế gọi API động từ Backend. Mỗi khi `selectedTournament` thay đổi, phải gọi API:
```javascript
// Gọi API kèm tournament_id để Backend tính động
const url = selectedTournament === "all"
  ? "/results/rankings"
  : `/results/rankings?tournament_id=${selectedTournament}`;
const data = await api.get(url);
```

Cụ thể, thay đổi `Leaderboard.js`:
1. Bỏ biến `filteredRankings` (không lọc client-side)
2. Thêm `useEffect` phụ thuộc vào `selectedTournament` để gọi lại API
3. Resolve bug: không cần filter trên client

---

### Bug 2: Tab "Giải thưởng & Thành tích" của Jockey cũng lọc sai

- **File:** `source-code/frontend/app/dashboard/components/JockeyPanel.js`
- **Vị trí:** Hàm `loadRankings` và phần render tab `jockey-rewards`

```javascript
const myRankings = rankings.filter(r =>
  r.entity_type === "JOCKEY" &&
  r.entity_name === user?.full_name &&
  (selectedTournament === "all" || String(r.tournament_id) === selectedTournament)
);
```

**🔍 Phân tích nguyên nhân:** Tương tự Bug 1, bạn tải bảng xếp hạng qua `api.get("/results/rankings")` rồi thực hiện lọc theo giải đấu ở Client. Do bảng xếp hạng chung không có `tournament_id`, khi chọn lọc theo giải đấu cụ thể, kết quả luôn rỗng.

**✅ Cách khắc phục:**
Để lấy thành tích của Jockey theo từng giải đấu, cần gọi API động kèm `tournament_id`:
```javascript
const url = selectedTournament === "all"
  ? "/results/rankings"
  : `/results/rankings?tournament_id=${selectedTournament}`;
const data = await api.get(url);
const jockeyRankings = data.filter(r => r.entity_type === "JOCKEY" && r.entity_name === user?.full_name);
```

Hoặc sử dụng API giải thưởng `GET /tournaments/{id}/awards` (nếu đã được Gia Huy implement) để hiển thị các giải thưởng thực tế.

---

## B. 🔴 REGRESSION NGHIÊM TRỌNG (Code bị xóa nhầm)

Do nhánh được tách từ phiên bản `dev-GiaHuy` cũ hơn, code của bạn đã vô tình **xóa mất các tính năng của Thuỳ Anh (Owner)** và **xóa validation quan trọng của Team Leader**.

### Regression 1: Mất toàn bộ Backend API của Owner

- **File:** `source-code/backend/app/api/v1/owners.py` (❌ ĐÃ BỊ XÓA)
- **Chi tiết:** Toàn bộ file API Owner (Profile, Upcoming Races, Results) của Thuỳ Anh bị xóa sạch.
- **Ảnh hưởng:**
  - `GET /owners/profile` — không tồn tại
  - `PUT /owners/profile` — không tồn tại
  - `GET /owners/upcoming-races` — không tồn tại
  - `GET /owners/results` — không tồn tại
- **✅ Khắc phục:** Khôi phục lại file `owners.py` từ nhánh `dev-GiaHuy` gốc.

---

### Regression 2: Mất router Owners trong main.py

- **File:** `source-code/backend/app/main.py`
- **Chi tiết:** Dòng `from app.api.v1 import ..., owners` và `app.include_router(owners.router, ...)` bị xóa.
- **✅ Khắc phục:** Khôi phục 2 dòng import và include router.

```python
from app.api.v1 import auth, horses, jockeys, tournaments, races, results, spectators, admin, referees, owners
#                                                                                                        ^^^^^^
app.include_router(owners.router, prefix=f"{settings.API_V1_STR}/owners", tags=["owners"])
```

---

### Regression 3: Mất Owner Schemas trong auth.py

- **File:** `source-code/backend/app/schemas/auth.py`
- **Chi tiết:** Các class `OwnerProfileUpdate`, `OwnerProfileDetailOut`, `OwnerUpcomingRace`, `OwnerResultHistory` bị xóa.
- **✅ Khắc phục:** Khôi phục các class schema này từ nhánh `dev-GiaHuy` gốc.

---

### Regression 4: Mất Validation 1 ngựa-1 jockey trong jockeys.py

- **File:** `source-code/backend/app/api/v1/jockeys.py`
- **Vị trí:** Hàm `invite_jockey()`
- **Chi tiết:** Đoạn code kiểm tra tồn tại Tournament và 2 validation raw SQL bị xóa:
  - Kiểm tra: `"SELECT COUNT(*) FROM JockeyInvitations WHERE horse_id = :horse_id AND tournament_id = :tournament_id AND status = 'PENDING'"` → Ngăn 1 ngựa mời 2 jockey
  - Kiểm tra: `"SELECT COUNT(*) FROM JockeyInvitations WHERE jockey_id = :jockey_id AND tournament_id = :tournament_id AND status = 'PENDING'"` → Ngăn 1 jockey được mời trong 2 cặp
- **✅ Khắc phục:** Khôi phục lại 2 đoạn validation raw SQL + import `text` từ `sqlalchemy` + import `Tournament`.

---

### Regression 5: Mất 3 Tab Owner trong Sidebar

- **File:** `source-code/frontend/app/dashboard/page.js`
- **Chi tiết:** 3 nút tab của Owner bị xóa:
  ```javascript
  // ❌ ĐÃ BỊ XÓA
  <button ...>📅 Lịch thi đấu của Ngựa</button>
  <button ...>🏆 Kết quả thi đấu</button>
  <button ...>👤 Hồ sơ cá nhân</button>
  ```
- **✅ Khắc phục:** Khôi phục lại 3 button tab này trong phần Owner sidebar.

---

## C. ⚠️ CẢNH BÁO KHI MERGE (Conflict Potential)

| File | Nguy cơ | Xử lý |
|------|---------|-------|
| `Leaderboard.js` | Xung đột với code gốc của dev-GiaHuy | Giữ code mới của Thái Châu, fix client-side filter |
| `JockeyPanel.js` | Xung đột với code cũ | Giữ code mới, thêm fix client-side filter cho awards tab |
| `page.js` | **CAO** — thiếu 3 tab Owner | Khôi phục 3 tab bị xóa |
| `jockeys.py` | **CAO** — thiếu validation | Khôi phục validation bị mất |
| `owners.py` | **RẤT CAO** — file bị xóa | Khôi phục toàn bộ file từ dev-GiaHuy |
| `main.py` | Trung bình | Khôi phục import owners |
| `auth.py` | Trung bình | Khôi phục Owner schemas |

---

## D. 👍 ĐIỂM CỘNG & ĐÁNH GIÁ

**Điểm tốt:**
- ✅ Giao diện bộ lọc dạng pill buttons **đẹp hơn** và trực quan hơn dropdown cũ
- ✅ Tab Jockey Awards có thẻ thống kê tổng quan (Tổng điểm, Hạng cao nhất, Số giải) rất chuyên nghiệp
- ✅ Medal emojis (🥇🥈🥉) cho top 3
- ✅ Xử lý lỗi tốt (bọc try-catch, empty state, loading state)
- ✅ Fix bug duplicate `loadData()` + `fetchRankings()` thành 1 hàm

**Cần cải thiện:**
- ❌ **Chưa test tích hợp** với Backend API thực tế trước khi push
- ❌ **Chưa đồng bộ** code với nhánh `dev-GiaHuy` mới nhất (dẫn đến regression)
- ❌ **Chưa kiểm tra response API** (nghĩ rằng rankings có tournament_id)

---

## E. 📋 HƯỚNG DẪN FIX

### Cách 1: Cập nhật branch từ dev-GiaHuy (Khuyên dùng)

```bash
# Bước 1: Chuyển sang nhánh của Thái Châu
git checkout feature/jockey-leaderboard-filter

# Bước 2: Kéo code mới nhất từ dev-GiaHuy
git pull origin dev-GiaHuy

# Bước 3: Git sẽ báo conflict. Giải quyết từng file:
# - page.js: Giữ 3 tab Owner + thêm tab jockey-rewards
# - jockeys.py: Giữ validation SQL + code mới
# - auth.py: Giữ Owner schemas
# - owners.py: Giữ file từ dev-GiaHuy (git checkout --ours owners.py)

# Bước 4: Fix client-side filter trong Leaderboard.js + JockeyPanel.js
# (xem hướng dẫn ở Bug 1 và Bug 2)

# Bước 5: Commit và push
git add .
git commit -m "fix: resolve merge conflicts, fix client-side filtering, restore removed files"
git push origin feature/jockey-leaderboard-filter
```

### Cách 2: Tạo branch mới (Nếu conflict quá phức tạp)

```bash
git checkout dev-GiaHuy
git checkout -b feature/jockey-leaderboard-filter-v2
git cherry-pick d6435ad f85ec6a a91186e
# Giải quyết conflict cho từng commit
# Sau đó fix client-side filter như hướng dẫn
```

---

## 📊 TỔNG KẾT MỨC ĐỘ HOÀN THIỆN

| Hạng mục | % | Ghi chú |
|----------|:-:|---------|
| **Task 1: Leaderboard Filter** | **60%** | UI đẹp, nhưng sai logic filter (client-side thay vì API động) |
| **Task 2: Jockey Awards Tab** | **85%** | UI xuất sắc, cần fix filter theo tournament_id |
| **Không gây regression** | **50%** | 5 regression nặng (xóa code của member khác) |
| **Tổng thể** | **~65%** | Cần fix trước khi merge vào dev-GiaHuy |
