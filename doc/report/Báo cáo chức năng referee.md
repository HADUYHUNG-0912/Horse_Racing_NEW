# 📊 Phân Tích Chức Năng Race Referee — So Sánh Context Diagram vs. Source Code

## Các Chức Năng Đã Triển Khai trong Source Code

### 1. Backend API (`results.py`, `races.py`)

| Chức năng (Context Diagram) | API Endpoint | File | Trạng thái |
|---|---|---|---|
| Result Input | `POST /results/{race_id}/results` | `results.py` L12–69 | ✅ **Có** |
| Violation Report | `POST /results/{race_id}/violations` | `results.py` L71–108 | ✅ **Có** |
| Assigned Race List | `GET /races/` (filter phía FE) | `races.py` L11–21 | ⚠️ **Có nhưng chưa tối ưu** |
| Race Schedule | `GET /races/` | `races.py` L11–21 | ✅ **Có** |
| Horse & Jockey List | Embedded trong `GET /races/` response | `races.py` L18–20 | ✅ **Có** |
| Result Status | Trả về trong `ResultOut` schema | `results.py` L64–68 | ✅ **Có** |
| **Race Inspection** | ❌ Không có endpoint | — | ❌ **Thiếu** |
| **Result Confirmation** | ❌ Không có endpoint riêng | — | ❌ **Thiếu** |

**Lưu ý về phân quyền:** `record_results()` và `record_violation()` đều kiểm tra `current_user.role.name == "REFEREE"` và so sánh `race.referee_id == ref_profile.id` — tức là đã có basic access control cho Referee.

### 2. Frontend Dashboard (`dashboard/page.js`)

| Chức năng (Context Diagram) | Component/Tab | Dòng code | Trạng thái |
|---|---|---|---|
| Assigned Race List | Tab `assigned-races` | L996–1119 | ✅ **Có** |
| Race Schedule | Cột "Thời gian" trong bảng | L1004–1016 | ✅ **Có** |
| Horse & Jockey List | Cột "Số ngựa tham gia" | L1019 | ⚠️ **Chỉ hiện số lượng, không hiện tên** |
| Result Input | Form "Xếp hạng và Điểm số" | L1044–1085 | ✅ **Có** |
| Violation Report | Form "Báo Cáo Vi Phạm" | L1088–1114 | ✅ **Có** |
| Result Status | Badge `COMPLETED / PENDING` | L1021–1023 | ✅ **Có** |
| **Race Inspection** | ❌ Không có UI | — | ❌ **Thiếu** |
| **Result Confirmation** | ❌ Không có UI xác nhận | — | ❌ **Thiếu** |

---

## 3. Chức Năng Còn Thiếu (Gaps)

### ❌ Gap 1: Race Inspection (Kiểm tra / Giám sát trận đua)

**Mô tả trong diagram:** Referee có thể *kiểm tra* (inspect) trận đua — nghĩa là ghi nhận các quan sát thực địa trước/trong cuộc đua (điều kiện đường đua, trạng thái sức khỏe ngựa, tình trạng jockey, v.v.)

**Hiện trạng:**
- Không có model `RaceInspection` trong database
- Không có API endpoint `POST /races/{race_id}/inspection`
- Không có UI cho phép Referee ghi chép kiểm tra

**Ảnh hưởng:** Referee chỉ có thể nhập kết quả *sau* khi đua xong, không có ghi nhận trong lúc đua.

---

### ❌ Gap 2: Result Confirmation (Xác nhận kết quả chính thức)

**Mô tả trong diagram:** Sau khi nhập kết quả, Referee phải *xác nhận* kết quả là chính thức — tạo ra trạng thái 2 bước (nhập → xác nhận).

**Hiện trạng:**
- `record_results()` nhập kết quả và ngay lập tức đặt `race.status = "COMPLETED"` (L57 trong `results.py`)
- Không có bước xác nhận riêng — kết quả được chấp nhận ngay khi POST
- Không có trạng thái `PENDING_CONFIRMATION` hay `CONFIRMED`

**Ảnh hưởng:** Không có cơ chế review/dispute kết quả trước khi công bố chính thức.

---

### ⚠️ Gap 3: Danh sách Trận đua Phân công — Thiếu API Riêng

**Mô tả trong diagram:** Referee nhận `Assigned Race List` — danh sách các race được assign cho họ.

**Hiện trạng:**
- Backend trả về toàn bộ race (`GET /races/`), Frontend lọc client-side bằng `rc.referee_name === user.full_name` (L1013)
- Lọc bằng `referee_name` (string match) thay vì `referee_id` — dễ sai nếu có trùng tên
- Không có endpoint chuyên biệt `/races/assigned-to-me` cho Referee

---

### ⚠️ Gap 4: Danh sách Ngựa & Jockey — Hiển thị Còn Hạn Chế

**Mô tả trong diagram:** Referee nhận `Horse & Jockey List` đầy đủ cho trận đua được phân công.

**Hiện trạng:**
- Frontend chỉ hiển thị số lượng ngựa tham gia (`rc.participants.length`) (L1019)
- Không có màn hình chi tiết hiển thị danh sách đầy đủ tên ngựa + jockey + số làn cho Referee trước khi bắt đầu ghi kết quả

---

## 4. Bảng Tổng Hợp So Sánh

| Chức năng (Context Diagram) | Backend | Frontend | Kết luận |
|---|:---:|:---:|---|
| Assigned Race List | ⚠️ | ✅ | Có, nhưng filter phía FE chưa chuẩn |
| Race Schedule | ✅ | ✅ | ✅ Đầy đủ |
| Horse & Jockey List | ✅ | ⚠️ | Thiếu màn hình chi tiết |
| Result Status | ✅ | ✅ | ✅ Đầy đủ |
| Race Inspection | ❌ | ❌ | ❌ **Chưa triển khai** |
| Violation Report | ✅ | ✅ | ✅ Đầy đủ |
| Result Input | ✅ | ✅ | ✅ Đầy đủ |
| Result Confirmation | ❌ | ❌ | ❌ **Chưa triển khai** |

**Tỉ lệ triển khai:** `5/8 chức năng hoàn chỉnh` | `2/8 thiếu hoàn toàn` | `1/8 chưa tối ưu`

---

## 5. Đề Xuất Cải Tiến

### 🔧 Ưu tiên Cao

#### 5.1 Thêm Chức Năng Result Confirmation

Bổ sung bước xác nhận 2-phase cho kết quả:

```python
# Backend: results.py — thêm endpoint mới
@router.post("/{race_id}/results/confirm", response_model=dict)
def confirm_results(
    race_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["REFEREE", "ADMIN"]))
):
    """
    Xác nhận kết quả chính thức. Chỉ khi đã confirm thì
    race.status mới chuyển sang COMPLETED và kết quả mới
    được công bố cho khán giả.
    """
    race = db.query(Race).filter(Race.id == race_id).first()
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")
    if race.status != "RESULTS_ENTERED":
        raise HTTPException(status_code=400, detail="No results to confirm")
    race.status = "COMPLETED"
    db.commit()
    recalculate_rankings(db)
    return {"message": "Results confirmed successfully"}
```

Thay đổi `record_results()`: đổi `race.status = "RESULTS_ENTERED"` thay vì `"COMPLETED"` ngay.

#### 5.2 Thêm Race Inspection Model & API

```python
# Trong database_models.py — thêm model mới
class RaceInspection(Base):
    __tablename__ = "RaceInspections"
    id = Column(Integer, primary_key=True, index=True)
    race_id = Column(Integer, ForeignKey("Races.id"), nullable=False)
    referee_id = Column(Integer, ForeignKey("RefereeProfiles.id"), nullable=False)
    track_condition_note = Column(String, nullable=True)
    weather_note = Column(String, nullable=True)
    horse_health_note = Column(String, nullable=True)
    inspection_time = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, ISSUES_FOUND
```

```python
# Trong results.py — thêm endpoint
@router.post("/{race_id}/inspection", status_code=201)
def record_inspection(
    race_id: int,
    inspection_in: InspectionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["REFEREE"]))
):
    """Referee ghi nhận kiểm tra trận đua trước khi bắt đầu."""
    ...
```

---

### 🔧 Ưu tiên Trung bình

#### 5.3 API Lấy Danh sách Race Phân Công Riêng

```python
# Trong races.py — thêm endpoint chuyên biệt
@router.get("/assigned-to-me", response_model=List[RaceOut])
def get_my_assigned_races(
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["REFEREE"]))
):
    """Trả về danh sách race được assign cho Referee đang đăng nhập."""
    ref_profile = current_user.referee_profile
    if not ref_profile:
        raise HTTPException(status_code=400, detail="Referee profile not found")
    races = db.query(Race).filter(Race.referee_id == ref_profile.id).all()
    for race in races:
        race.referee_name = ref_profile.user.full_name
        for p in race.participants:
            p.horse_name = p.registration.horse.name
            p.jockey_name = p.registration.jockey.user.full_name
    return races
```

Đồng thời sửa Frontend: gọi `/races/assigned-to-me` thay vì filter `rc.referee_name === user.full_name`.

#### 5.4 Màn hình Chi tiết Horse & Jockey List cho Referee

Thêm tab hoặc popup trong `assigned-races` để Referee xem đầy đủ danh sách trước khi ghi kết quả:

```jsx
// Trong dashboard/page.js — thêm expandable row
{rc.participants.map(p => (
  <tr key={p.id} style={{ background: "rgba(255,255,255,0.03)" }}>
    <td>Làn {p.lane_number}</td>
    <td>🐎 {p.horse_name}</td>
    <td>🏇 {p.jockey_name}</td>
    <td>{p.status}</td>
  </tr>
))}
```

---

### 🔧 Ưu tiên Thấp (Nice-to-have)

#### 5.5 Notification cho Referee khi được phân công

Khi Admin thực hiện `assign-referee`, hệ thống có thể tạo notification tự động thông báo cho Referee về trận đua mới được giao.

#### 5.6 Lịch sử Vi phạm theo Referee

Thêm tab `Lịch sử Vi phạm đã báo cáo` — để Referee xem lại toàn bộ violation reports đã submit theo thời gian.

#### 5.7 Export kết quả ra PDF

Sau khi confirm kết quả, cho phép Referee export `Result Report` ra PDF — phục vụ mục đích lưu trữ và kiểm tra.

---

## 6. Kết Luận

**Các chức năng quan trọng nhất cần bổ sung:**
1. 🔴 **Result Confirmation** — Cần bước 2 trước khi kết quả chính thức hóa
2. 🔴 **Race Inspection** — Cần model và API để ghi nhận kiểm tra
3. 🟡 **Dedicated Assigned Race API** — Cần endpoint riêng thay vì filter client-side
