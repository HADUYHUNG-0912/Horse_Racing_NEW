# -*- coding: utf-8 -*-
"""
==============================================================
Test Script: Kiem tra cac loi trong PR #44 (feature/jockey-fix2)
Dua tren: jockey_fix2_review_report.md
==============================================================
"""
import ast
import io
import re
import sys
import os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BACKEND_DIR = os.path.join(os.path.dirname(__file__), "source-code", "backend", "app")
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "source-code", "frontend", "app")

MODEL_FILE    = os.path.join(BACKEND_DIR, "models", "database_models.py")
AUTH_SCHEMA   = os.path.join(BACKEND_DIR, "schemas", "auth.py")
RESULT_SCHEMA = os.path.join(BACKEND_DIR, "schemas", "result.py")
JOCKEY_PANEL  = os.path.join(FRONTEND_DIR, "dashboard", "components", "JockeyPanel.js")

PASS = "[PASS]"
FAIL = "[FAIL]"

results = []

def check(name, condition, detail=""):
    status = PASS if condition else FAIL
    results.append((status, name, detail))
    print(f"  {status}  {name}")
    if detail and not condition:
        print(f"         -> {detail}")


# ==============================================================
# BUG 1a: HorseOwnerProfile & User.created_at (database_models.py)
# ==============================================================
print("\n" + "="*60)
print("BUG 1a — HorseOwnerProfile & User.created_at (database_models.py)")
print("="*60)

with open(MODEL_FILE, encoding="utf-8") as f:
    model_src = f.read()

tree = ast.parse(model_src)

# Lay noi dung class HorseOwnerProfile
owner_class_src = ""
for node in ast.walk(tree):
    if isinstance(node, ast.ClassDef) and node.name == "HorseOwnerProfile":
        lines = model_src.splitlines()
        owner_class_src = "\n".join(lines[node.lineno - 1: node.end_lineno])
        break

# Cac cot can co trong HorseOwnerProfile
owner_required_columns = [
    "age", "experience_years", "occupation",
    "address", "nationality", "social_link", "bio"
]
for col in owner_required_columns:
    found = bool(re.search(rf'\b{col}\s*=\s*Column\(', owner_class_src))
    check(
        f"HorseOwnerProfile.{col} ton tai trong database_models.py",
        found,
        f"Cot '{col}' bi thieu trong HorseOwnerProfile — da bi xoa nham!"
    )

# Cac property API can co
owner_properties = ["full_name", "email", "phone_number", "avatar", "joined_date"]
for prop in owner_properties:
    found = bool(re.search(rf'def {prop}\(self\)', owner_class_src))
    check(
        f"HorseOwnerProfile.{prop} property ton tai",
        found,
        f"Property '{prop}' bi thieu trong HorseOwnerProfile!"
    )

# User.created_at
user_class_src = ""
for node in ast.walk(tree):
    if isinstance(node, ast.ClassDef) and node.name == "User":
        lines = model_src.splitlines()
        user_class_src = "\n".join(lines[node.lineno - 1: node.end_lineno])
        break

has_created_at = bool(re.search(r'created_at\s*=\s*Column\(', user_class_src))
check(
    "User.created_at ton tai trong database_models.py",
    has_created_at,
    "Cot 'created_at' bi xoa khoi model User!"
)


# ==============================================================
# BUG 1b: OwnerProfile schemas (auth.py)
# ==============================================================
print("\n" + "="*60)
print("BUG 1b — OwnerProfile schemas (auth.py)")
print("="*60)

with open(AUTH_SCHEMA, encoding="utf-8") as f:
    auth_src = f.read()

owner_schema_fields = [
    "age", "experience_years", "occupation",
    "address", "nationality", "social_link", "bio"
]
for field in owner_schema_fields:
    found = bool(re.search(rf'\b{field}\s*:', auth_src))
    check(
        f"Schema Owner co truong '{field}' trong auth.py",
        found,
        f"Truong '{field}' bi thieu trong auth.py — gay loi validation!"
    )


# ==============================================================
# BUG 2: RankingOut thieu tournament_id
# ==============================================================
print("\n" + "="*60)
print("BUG 2 — Loc giai dau Jockey: RankingOut thieu tournament_id")
print("="*60)

with open(RESULT_SCHEMA, encoding="utf-8") as f:
    result_src = f.read()

has_tournament_id_in_schema = bool(re.search(r'tournament_id\s*:', result_src))
check(
    "RankingOut schema CO truong tournament_id",
    has_tournament_id_in_schema,
    "RankingOut thieu 'tournament_id' -> client-side filter luon tra ve rong!"
)

with open(JOCKEY_PANEL, encoding="utf-8") as f:
    panel_src = f.read()

uses_client_filter = bool(re.search(r'r\.tournament_id', panel_src))
check(
    "JockeyPanel.js dung r.tournament_id de filter (client-side)",
    uses_client_filter,
    "Khong tim thay filter theo r.tournament_id trong JockeyPanel.js"
)

if uses_client_filter and not has_tournament_id_in_schema:
    print("\n  [BUG CONFIRMED] JockeyPanel filter theo r.tournament_id")
    print("       nhung RankingOut schema KHONG co truong nay")
    print("       => Filter luon tra ve [] khi chon bat ky giai dau cu the")


# ==============================================================
# BUG 3: Gioi tinh khong dong bo (male/female vs Nam/Nu)
# ==============================================================
print("\n" + "="*60)
print("BUG 3 — Gioi tinh: JockeyPanel dung 'male'/'female' thay vi 'Nam'/'Nu'")
print("="*60)

uses_english_gender = bool(re.search(r"value=[\"']male[\"']|value=[\"']female[\"']|value=[\"']other[\"']", panel_src))
check(
    "JockeyPanel.js KHONG con dung tieng Anh (male/female/other) — DA dong bo",
    not uses_english_gender,
    "Van con value='male'/'female'/'other' — chua doi sang tieng Viet!"
)

uses_vietnamese_gender = bool(re.search(r'value=["\']Nam["\']|value=["\']N\u1EEF["\']|value=["\']Kh\u00E1c["\']', panel_src))
check(
    "JockeyPanel.js DA dung tieng Viet (Nam/Nu/Khac) — dong bo voi SpectatorPanel",
    uses_vietnamese_gender,
    "Chua cap nhat sang tieng Viet!"
)


# ==============================================================
# TONG KET
# ==============================================================
print("\n" + "="*60)
print("TONG KET")
print("="*60)

passed = sum(1 for r in results if r[0] == PASS)
failed = sum(1 for r in results if r[0] == FAIL)
total  = len(results)

print(f"\n  Tong kiem tra : {total}")
print(f"  {PASS}        : {passed}")
print(f"  {FAIL}        : {failed}")

if failed == 0:
    print("\n[OK] Tat ca kiem tra deu PASS! Code da duoc sua xong, co the merge.")
else:
    print(f"\n[WARNING] Con {failed}/{total} loi can xu ly truoc khi merge!")
    print("\nCac kiem tra FAIL:")
    for status, name, detail in results:
        if status == FAIL:
            print(f"  x {name}")
            if detail:
                print(f"    -> {detail}")

sys.exit(0 if failed == 0 else 1)
