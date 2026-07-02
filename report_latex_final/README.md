# Horse Racing Tournament Management System — Báo cáo (LaTeX)

Báo cáo Capstone Project được viết bằng LaTeX, chia theo 4 chương, mỗi chương được tách nhỏ thành nhiều file để cả nhóm làm việc song song mà không bị conflict Git

## 1. Cấu trúc thư mục

Horse_Racing_Report/
│
├── main.tex                                        # File gốc, chỉ include 4 chương
│
├── documents/                                      # "Vỏ chương" — mỗi file ~20-30 dòng
│   ├── project_introduction.tex
│   ├── project_management_plan.tex
│   ├── software_requirement_specification.tex
│   └── software_design_description.tex
│
├── sections/                                      # Nội dung thật, chia theo chương
│   │
│   ├── project_introduction/                      <- PHAN 1 (Truong nhom / ca nhom)
│   │   ├── overview.tex
│   │   ├── background.tex
│   │   ├── market_analysis.tex
│   │   ├── opportunities.tex
│   │   ├── vision.tex
│   │   └── scope.tex
│   │
│   ├── project_management/                        <- PHAN 2 (Duy Hung)
│   │   ├── overview.tex
│   │   ├── scope_estimation.tex
│   │   ├── objectives.tex
│   │   ├── risks.tex
│   │   ├── management_approach.tex
│   │   ├── deliverables_schedule.tex
│   │   ├── rasi_table.tex
│   │   ├── communication.tex
│   │   └── configuration/
│   │       ├── document_management.tex
│   │       ├── source_code_management.tex
│   │       └── tools_infrastructure.tex
│   │
│   ├── srs/                                        <- PHAN 3
│   │   │
│   │   ├── context/
│   │   │   ├── context_diagram.tex                 (Truong nhom - chot scope MVP)
│   │   │   └── checklist_review.tex                (Truong nhom - kiem tra toan bo so do)
│   │   │
│   │   ├── product_overview.tex                    (Duy Hung)
│   │   ├── actors.tex                              (Gia Huy)
│   │   ├── usecase_diagram_overview.tex            (Gia Huy - Use Case Diagram tong cho MVP)
│   │   ├── usecase_description.tex                 (Gia Huy)
│   │   │
│   │   ├── flows/                                  <- moi flow = 1 nguoi
│   │   │   ├── horse_owner_registration/           <- Thuy Anh
│   │   │   │   ├── screen_flow.tex
│   │   │   │
│   │   │   │
│   │   │   ├── jockey_invitation/                  <- Ho Nguyen Thai Chau
│   │   │   │   ├── screen_flow.tex
│   │   │   │
│   │   │   ├── race_scheduling/                    <- My Hue
│   │   │   │   ├── screen_flow.tex
│   │   │   │
│   │   │   │
│   │   │   └── race_result_ranking/                <- Bui Huy
│   │   │       ├── screen_flow.tex
│   │   │
│   │   │
│   │   ├── screen_authorization.tex                (Duy Hung)
│   │   ├── non_functional.tex                      (Thuy Anh)
│   │   │
│   │   ├── web_application/                        <- PHAN 3.2
│   │   │   ├── admin.tex                           <- My Hue, Gia Huy
│   │   │   │   ├── Login
│   │   │   │   ├── Manage Users
│   │   │   │   ├── Manage Tournaments
│   │   │   │   └── Approve Registrations
│   │   │   │
│   │   │   ├── horse_owner.tex                     <- Thuy Anh
│   │   │   │   ├── Login
│   │   │   │   ├── Manage Horses
│   │   │   │   ├── Invite Jockey
│   │   │   │   ├── Register Tournament
│   │   │   │   ├── Registered Tournaments
│   │   │   │   ├── Horse Schedule
│   │   │   │   ├── Race Results
│   │   │   │   ├── Owner Profile
│   │   │   │   └── Ranking
│   │   │   │
│   │   │   ├── jockey.tex                          <- Ho Nguyen Thai Chau
│   │   │   │   ├── Login
│   │   │   │   ├── View Invitations
│   │   │   │   ├── Accept Invitations
│   │   │   │   ├── Assigned Horses
│   │   │   │   └── Tournament Participation
│   │   │   │
│   │   │   ├── spectator.tex                       <- Thu May
│   │   │   │   ├── View Tournaments
│   │   │   │   ├── View Schedules
│   │   │   │   ├── View Rankings
│   │   │   │   └── View Race Results
│   │   │   │
│   │   │   ├── race_referee.tex                    <- Bui Huy
│   │   │   │   ├── Login
│   │   │   │   ├── View Assigned Races
│   │   │   │   ├── Record Results
│   │   │   │   └── Confirm Rankings
│   │   │   │
│   │   │   └── web_app_roles.tex                   <- Duy Hung
│   │   │       (Role x Functionality matrix)
│   │   │
│   │   └── appendix/
│   │       ├── business_rules.tex                  (Gia Huy, My Hue)
│   │       ├── common_requirements.tex             (Bui Huy)
│   │       └── application_messages.tex            (Thai Chau)
│   │
│   └── design/                                     <- PHAN 4
│       ├── architecture.tex                        (so do Frontend/Backend/3rd-party/DB)
│       ├── package_diagram.tex                     (3 tang: Controller/Service/Repository)
│       ├── class_diagram_overall.tex               <- THU MAY
│       └── erd.tex                                 <- THU MAY
│       └── detailed_design/
├── horse_owner_registration/
│   ├── activity_diagram.tex
│   └── sequence_diagram.tex
├── jockey_invitation/
│   ├── activity_diagram.tex
│   └── sequence_diagram.tex
├── race_scheduling/
│   ├── activity_diagram.tex
│   └── sequence_diagram.tex
└── race_result_ranking/
├── activity_diagram.tex
└── sequence_diagram.tex
├── figures/                                        # Hình ảnh, sơ đồ (.png/.jpg/.pdf)
├── tables/                                         # Bảng LaTeX dài/dùng chung nhiều nơi
└── appendix/                                       # Phụ lục chung (nếu có)

**Nguyên tắc 3 tầng:**
`main.tex` gọi `documents/` → `documents/` gọi `sections/` → `sections/` chứa nội dung thật.
Không ai viết nội dung trực tiếp vào `main.tex` hay các file trong `documents/`.

## 2. Chi tiết từng chương và người phụ trách

### Chương 1 — Project Introduction (Thùy Anh)
`sections/project_introduction/`: overview, background, market_analysis, opportunities, vision, scope

### Chương 2 — Project Management Plan (Duy Hưng)
`sections/project_management/`: overview, scope_estimation, objectives, risks, management_approach, deliverables_schedule, rasi_table, communication, và `configuration/` (document_management, source_code_management, tools_infrastructure)

### Chương 3 — Software Requirement Specification
`sections/srs/`:
| File / Folder | Người phụ trách |
|---|---|
| `context/context_diagram.tex`, `context/checklist_review.tex` | Trưởng nhóm |
| `product_overview.tex` | Duy Hưng |
| `actors.tex`, `usecase_diagram_overview.tex`, `usecase_description.tex` | Gia Huy |
| `flows/horse_owner_registration/` (screen_flow, activity_diagram, sequence_diagram) | Thùy Anh |
| `flows/jockey_invitation/` | Hồ Nguyễn Thái Châu |
| `flows/race_scheduling/` | Mỹ Huệ |
| `flows/race_result_ranking/` | Bùi Huy |
| `screen_authorization.tex`, `web_app_roles.tex` | Duy Hưng |
| `non_functional.tex` | Thùy Anh |
| `appendix/business_rules.tex` | Gia Huy, Mỹ Huệ |
| `appendix/common_requirements.tex` | Bùi Huy |
| `appendix/application_messages.tex` | Thái Châu |

### Chương 4 — Software Design Description (Thu Mây)
`sections/design/`: architecture, package_diagram, class_diagram_overall, erd

## 3. Yêu cầu cài đặt

- **MiKTeX** (Windows) hoặc TeX Live — trình biên dịch LaTeX
- **VS Code** + extension **LaTeX Workshop**
- **Git** (Git for Windows, có sẵn Git Bash)

## 4. Cách tạo cấu trúc thư mục lần đầu

Chạy 1 trong 2 script sau tại thư mục gốc project:

```powershell
# PowerShell
.\setup_structure.ps1
```

```bash
# Git Bash
bash setup_structure.sh
```

Script sẽ tự tạo toàn bộ thư mục và file `.tex` rỗng theo đúng cấu trúc ở trên.

## 5. Cách biên dịch (compile)

Trong VS Code, mở `main.tex`, nhấn **Build LaTeX project** (LaTeX Workshop), hoặc dùng lệnh:

```bash
latexmk -pdf main.tex
```

File PDF kết quả sẽ nằm cùng thư mục với `main.tex`.

## 6. Quy tắc làm việc nhóm với Git

- **Chỉ sửa file thuộc phần mình phụ trách** (xem bảng phân công ở mục 2) để tránh conflict.
- **Commit ngay sau khi hoàn thành 1 task**, trước khi chuyển sang task khác hoặc đổi branch — tránh gộp nhiều thay đổi không liên quan vào 1 commit.
- Đặt tên commit rõ ràng, ví dụ:
  ```
  git add sections/srs/flows/horse_owner_registration/
  git commit -m "SRS: hoàn thành screen flow + sequence diagram cho Horse Owner registration"
  git push
  ```
- Trước khi bắt đầu làm việc, luôn `git pull` để lấy thay đổi mới nhất từ nhóm.
- Không sửa `main.tex` hoặc file trong `documents/` trừ khi thật sự cần thêm/bớt một mục lớn — nếu cần, báo trước cho cả nhóm.

## 7. Quy ước đặt tên file hình ảnh (`figures/`)

Đặt tên theo dạng `<chương>_<nội_dung>.png`, ví dụ:

```
figures/srs_erd.png
figures/srs_usecase_diagram.png
figures/design_architecture.png
figures/horse_owner_registration_sequence.png
```

Tránh đặt tên chung chung như `image1.png`, `diagram.png`.

## 8. Checklist trước khi nộp

- [ ] Tất cả `\input` trong `documents/` đã trỏ đúng file, không còn file rỗng
- [ ] Toàn bộ hình trong `figures/` được chèn đúng vị trí, có caption
- [ ] Số lượng function trong Chương 3 (SRS) khớp với Chương 4 (Design)
- [ ] Business Rules được điền đầy đủ (không còn để trống chờ)
- [ ] Biên dịch `main.tex` không lỗi, không còn cảnh báo thiếu `\include`/`\input`
- [ ] Trưởng nhóm review toàn bộ trước khi nộp