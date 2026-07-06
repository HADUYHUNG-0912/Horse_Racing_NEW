import os
import pyodbc
import bcrypt

def load_dotenv():
    for path in [".env", "source-code/backend/.env", "../.env", "../../.env"]:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, val = line.split("=", 1)
                        os.environ[key.strip()] = val.strip().strip("'\"")
            break

load_dotenv()

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def main():
    server = os.getenv("SQL_SERVER_HOST", r"localhost\SQLEXPRESS")
    
    # 1. Connect to master to create the database if not exists
    print("Connecting to SQL Server Master...")
    master_conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE=master;Trusted_Connection=yes;Encrypt=no;"
    
    try:
        conn = pyodbc.connect(master_conn_str, autocommit=True)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT database_id FROM sys.databases WHERE name = 'HorseRacing'")
        row = cursor.fetchone()
        if not row:
            print("Creating database HorseRacing...")
            cursor.execute("CREATE DATABASE HorseRacing")
        else:
            print("Database HorseRacing already exists.")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error connecting to master or creating database: {e}")
        return

    # 2. Connect to HorseRacing to run schema.sql
    print("Connecting to HorseRacing database...")
    db_conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE=HorseRacing;Trusted_Connection=yes;Encrypt=no;"
    
    try:
        conn = pyodbc.connect(db_conn_str, autocommit=True)
        cursor = conn.cursor()
        
        schema_path = os.path.join("..", "database", "schema.sql")
        if not os.path.exists(schema_path):
            schema_path = os.path.join("source-code", "database", "schema.sql")
        
        print(f"Reading schema from {schema_path}...")
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        
        # Split by GO statement (case insensitive, with or without newlines)
        import re
        batches = re.split(r'\bGO\b', schema_sql, flags=re.IGNORECASE)
        
        print(f"Executing {len(batches)} SQL schema batches...")
        for i, batch in enumerate(batches):
            cleaned = batch.strip()
            # Ignore database creation commands if they are inside schema.sql
            if not cleaned or "CREATE DATABASE" in cleaned or "USE HorseRacing" in cleaned:
                continue
            try:
                cursor.execute(cleaned)
            except Exception as ex:
                print(f"Error executing batch {i+1}: {ex}\nBatch content:\n{cleaned[:200]}...")
                raise ex
                
        print("Database schema created successfully.")
        
        # 3. Seed data
        print("Seeding database with Vietnamese data...")
        
        # Roles
        cursor.execute("SELECT COUNT(*) FROM Roles")
        if cursor.fetchone()[0] == 0:
            print("Seeding Roles...")
            roles = [("ADMIN",), ("REFEREE",), ("JOCKEY",), ("OWNER",), ("SPECTATOR",)]
            cursor.executemany("INSERT INTO Roles (name) VALUES (?)", roles)
            
        # Get roles mapping
        cursor.execute("SELECT name, id FROM Roles")
        role_map = {name: r_id for name, r_id in cursor.fetchall()}
        
        # Users (Vietnamese Fullnames, keeping original login credentials for compatibility)
        cursor.execute("SELECT COUNT(*) FROM Users")
        if cursor.fetchone()[0] == 0:
            print("Seeding Users...")
            pw_admin = hash_password("admin123")
            pw_referee = hash_password("ref123")
            pw_jockey = hash_password("joc123")
            pw_owner = hash_password("own123")
            pw_spectator = hash_password("spec123")
            
            users = [
                ("admin", pw_admin, "admin@horseracing.com", "Quản trị viên Hệ thống", role_map["ADMIN"]),
                ("referee1", pw_referee, "referee1@horseracing.com", "Trọng tài Nguyễn Văn Hải", role_map["REFEREE"]),
                ("referee2", pw_referee, "referee2@horseracing.com", "Trọng tài Trần Hoàng Nam", role_map["REFEREE"]),
                ("referee3", pw_referee, "referee3@horseracing.com", "Trọng tài Phạm Minh Đức", role_map["REFEREE"]),
                ("jockey1", pw_jockey, "jockey1@horseracing.com", "Nài ngựa Lê Minh Khoa", role_map["JOCKEY"]),
                ("jockey2", pw_jockey, "jockey2@horseracing.com", "Nài ngựa Phạm Hồng Hải", role_map["JOCKEY"]),
                ("jockey3", pw_jockey, "jockey3@horseracing.com", "Nài ngựa Nguyễn Văn Hùng", role_map["JOCKEY"]),
                ("owner1", pw_owner, "owner1@horseracing.com", "Chủ ngựa Nguyễn Quốc Anh", role_map["OWNER"]),
                ("owner2", pw_owner, "owner2@horseracing.com", "Chủ ngựa Lê Thị Thu Thủy", role_map["OWNER"]),
                ("owner3", pw_owner, "owner3@horseracing.com", "Chủ ngựa Hoàng Gia Bảo", role_map["OWNER"]),
                ("spectator1", pw_spectator, "spectator1@horseracing.com", "Khán giả Trần Thanh Bình", role_map["SPECTATOR"]),
                ("spectator2", pw_spectator, "spectator2@horseracing.com", "Khán giả Nguyễn Bích Phương", role_map["SPECTATOR"])
            ]
            cursor.executemany("INSERT INTO Users (username, password_hash, email, full_name, role_id) VALUES (?, ?, ?, ?, ?)", users)

        # Get Users mapping
        cursor.execute("SELECT username, id FROM Users")
        user_map = {username: u_id for username, u_id in cursor.fetchall()}
        
        # Profiles
        cursor.execute("SELECT COUNT(*) FROM JockeyProfiles")
        if cursor.fetchone()[0] == 0:
            print("Seeding Profiles...")
            # Jockeys
            cursor.execute("INSERT INTO JockeyProfiles (user_id, bio, weight, height, experience_years) VALUES (?, ?, ?, ?, ?)",
                           (user_map["jockey1"], "Nài ngựa dày dạn kinh nghiệm với hơn 50 lần giành chiến thắng giải quốc gia.", 54.50, 1.62, 8))
            cursor.execute("INSERT INTO JockeyProfiles (user_id, bio, weight, height, experience_years) VALUES (?, ?, ?, ?, ?)",
                           (user_map["jockey2"], "Ngôi sao đang lên trong làng đua ngựa chuyên nghiệp với kỹ thuật bứt phá xuất sắc.", 52.00, 1.58, 4))
            cursor.execute("INSERT INTO JockeyProfiles (user_id, bio, weight, height, experience_years) VALUES (?, ?, ?, ?, ?)",
                           (user_map["jockey3"], "Kỹ thuật tốt, có thế mạnh ở các chặng đua ngắn và trung bình đòi hỏi tốc độ cao.", 53.00, 1.60, 6))
            
            # Owners
            cursor.execute("INSERT INTO HorseOwnerProfiles (user_id, company_name) VALUES (?, ?)",
                           (user_map["owner1"], "Trang trại Đua ngựa Apex"))
            cursor.execute("INSERT INTO HorseOwnerProfiles (user_id, company_name) VALUES (?, ?)",
                           (user_map["owner2"], "Trung tâm Nhân giống Blue Ribbon"))
            cursor.execute("INSERT INTO HorseOwnerProfiles (user_id, company_name) VALUES (?, ?)",
                           (user_map["owner3"], "Hội quán Đua ngựa Hoàng Gia"))
            
            # Referees
            cursor.execute("INSERT INTO RefereeProfiles (user_id, certification_level) VALUES (?, ?)",
                           (user_map["referee1"], "Trọng tài Quốc tế Hạng A"))
            cursor.execute("INSERT INTO RefereeProfiles (user_id, certification_level) VALUES (?, ?)",
                           (user_map["referee2"], "Trọng tài Quốc gia Hạng B"))
            cursor.execute("INSERT INTO RefereeProfiles (user_id, certification_level) VALUES (?, ?)",
                           (user_map["referee3"], "Trọng tài Quốc tế Hạng B"))
            
            # Spectators
            cursor.execute("INSERT INTO SpectatorProfiles (user_id, favorite_horse_breed) VALUES (?, ?)",
                           (user_map["spectator1"], "Ngựa Thuần Chủng (Thoroughbred)"))
            cursor.execute("INSERT INTO SpectatorProfiles (user_id, favorite_horse_breed) VALUES (?, ?)",
                           (user_map["spectator2"], "Ngựa Ả Rập (Arabian)"))

        # Get Owner and Jockey Profile mappings
        cursor.execute("SELECT user_id, id FROM HorseOwnerProfiles")
        owner_profile_map = {u_id: p_id for u_id, p_id in cursor.fetchall()}
        cursor.execute("SELECT user_id, id FROM JockeyProfiles")
        jockey_profile_map = {u_id: p_id for u_id, p_id in cursor.fetchall()}
        cursor.execute("SELECT user_id, id FROM RefereeProfiles")
        referee_profile_map = {u_id: p_id for u_id, p_id in cursor.fetchall()}
        
        # Horses
        cursor.execute("SELECT COUNT(*) FROM Horses")
        if cursor.fetchone()[0] == 0:
            print("Seeding Horses...")
            horses = [
                ("Tia Chớp", 5, "Ngựa Thuần Chủng (Thoroughbred)", "Đực", owner_profile_map[user_map["owner1"]]),
                ("Phong Vân", 4, "Ngựa Ả Rập (Arabian)", "Cái", owner_profile_map[user_map["owner1"]]),
                ("Viên Đạn Bạc", 6, "Ngựa Quarter", "Thiến", owner_profile_map[user_map["owner2"]]),
                ("Thiên Mã", 3, "Ngựa Thuần Chủng (Thoroughbred)", "Đực", owner_profile_map[user_map["owner2"]]),
                ("Xích Long", 5, "Ngựa Thuần Chủng (Thoroughbred)", "Đực", owner_profile_map[user_map["owner3"]]),
                ("Hắc Kim", 4, "Ngựa Ả Rập (Arabian)", "Cái", owner_profile_map[user_map["owner3"]])
            ]
            cursor.executemany("INSERT INTO Horses (name, age, breed, gender, owner_id) VALUES (?, ?, ?, ?, ?)", horses)

        # Get Horse mapping
        cursor.execute("SELECT name, id FROM Horses")
        horse_map = {name: h_id for name, h_id in cursor.fetchall()}

        # Tournaments
        cursor.execute("SELECT COUNT(*) FROM Tournaments")
        if cursor.fetchone()[0] == 0:
            print("Seeding Tournaments...")
            cursor.execute("INSERT INTO Tournaments (name, description, start_date, end_date, location, status) VALUES (?, ?, ?, ?, ?, ?)",
                           ("Giải Vô Địch Mùa Hè 2026", "Giải đua ngựa lớn nhất năm quy tụ các trang trại hàng đầu cả nước", "2026-06-10", "2026-06-15", "Đấu trường Hoàng Gia", "UPCOMING"))
            cursor.execute("INSERT INTO Tournaments (name, description, start_date, end_date, location, status) VALUES (?, ?, ?, ?, ?, ?)",
                           ("Giải Spring Derby 2026", "Giải đua mùa xuân thường niên dành cho ngựa thuần chủng và địa phương", "2026-05-10", "2026-05-12", "Thung Lũng Xanh", "COMPLETED"))

        # Get Tournament mapping
        cursor.execute("SELECT name, id FROM Tournaments")
        tournament_map = {name: t_id for name, t_id in cursor.fetchall()}

        # Rounds
        cursor.execute("SELECT COUNT(*) FROM Rounds")
        if cursor.fetchone()[0] == 0:
            print("Seeding Rounds...")
            cursor.execute("INSERT INTO Rounds (tournament_id, name, sequence) VALUES (?, ?, ?)",
                           (tournament_map["Giải Vô Địch Mùa Hè 2026"], "Vòng Loại", 1))
            cursor.execute("INSERT INTO Rounds (tournament_id, name, sequence) VALUES (?, ?, ?)",
                           (tournament_map["Giải Vô Địch Mùa Hè 2026"], "Vòng Chung Kết", 2))
            cursor.execute("INSERT INTO Rounds (tournament_id, name, sequence) VALUES (?, ?, ?)",
                           (tournament_map["Giải Spring Derby 2026"], "Vòng Chung Kết", 1))

        # Get Rounds mapping (tournament_id, name -> id)
        cursor.execute("SELECT tournament_id, name, id FROM Rounds")
        round_map = {(t_id, name): r_id for t_id, name, r_id in cursor.fetchall()}

        # Races
        cursor.execute("SELECT COUNT(*) FROM Races")
        if cursor.fetchone()[0] == 0:
            print("Seeding Races...")
            # Heat 1 for Summer Qualification
            cursor.execute("INSERT INTO Races (round_id, name, race_time, track_condition, distance, referee_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                           (round_map[(tournament_map["Giải Vô Địch Mùa Hè 2026"], "Vòng Loại")],
                            "Trận Vòng Loại 1", "2026-06-10 14:00:00", "Tốt", 1200, referee_profile_map[user_map["referee1"]], "SCHEDULED"))
            
            # Grand Final for Spring Finals
            cursor.execute("INSERT INTO Races (round_id, name, race_time, track_condition, distance, referee_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                           (round_map[(tournament_map["Giải Spring Derby 2026"], "Vòng Chung Kết")],
                            "Trận Chung Kết Tổng", "2026-05-12 15:00:00", "Ẩm ướt", 1600, referee_profile_map[user_map["referee1"]], "COMPLETED"))

        # Get Races mapping
        cursor.execute("SELECT name, id FROM Races")
        race_map = {name: r_id for name, r_id in cursor.fetchall()}

        # Registrations (Horse-Jockey pair registering for a Tournament)
        cursor.execute("SELECT COUNT(*) FROM Registrations")
        if cursor.fetchone()[0] == 0:
            print("Seeding Registrations...")
            # Summer Championship
            cursor.execute("INSERT INTO Registrations (tournament_id, horse_id, jockey_id, status) VALUES (?, ?, ?, ?)",
                           (tournament_map["Giải Vô Địch Mùa Hè 2026"], horse_map["Tia Chớp"], jockey_profile_map[user_map["jockey1"]], "APPROVED"))
            cursor.execute("INSERT INTO Registrations (tournament_id, horse_id, jockey_id, status) VALUES (?, ?, ?, ?)",
                           (tournament_map["Giải Vô Địch Mùa Hè 2026"], horse_map["Viên Đạn Bạc"], jockey_profile_map[user_map["jockey2"]], "APPROVED"))
            cursor.execute("INSERT INTO Registrations (tournament_id, horse_id, jockey_id, status) VALUES (?, ?, ?, ?)",
                           (tournament_map["Giải Vô Địch Mùa Hè 2026"], horse_map["Xích Long"], jockey_profile_map[user_map["jockey3"]], "APPROVED"))
            
            # Spring Derby
            cursor.execute("INSERT INTO Registrations (tournament_id, horse_id, jockey_id, status) VALUES (?, ?, ?, ?)",
                           (tournament_map["Giải Spring Derby 2026"], horse_map["Phong Vân"], jockey_profile_map[user_map["jockey1"]], "APPROVED"))
            cursor.execute("INSERT INTO Registrations (tournament_id, horse_id, jockey_id, status) VALUES (?, ?, ?, ?)",
                           (tournament_map["Giải Spring Derby 2026"], horse_map["Thiên Mã"], jockey_profile_map[user_map["jockey2"]], "APPROVED"))

        # Get Registrations mapping (tournament_id, horse_id -> id)
        cursor.execute("SELECT tournament_id, horse_id, id FROM Registrations")
        registration_map = {(t_id, h_id): reg_id for t_id, h_id, reg_id in cursor.fetchall()}

        # JockeyInvitations
        cursor.execute("SELECT COUNT(*) FROM JockeyInvitations")
        if cursor.fetchone()[0] == 0:
            print("Seeding JockeyInvitations...")
            cursor.execute("INSERT INTO JockeyInvitations (owner_id, jockey_id, horse_id, tournament_id, message, status) VALUES (?, ?, ?, ?, ?, ?)",
                           (owner_profile_map[user_map["owner1"]], jockey_profile_map[user_map["jockey2"]], horse_map["Phong Vân"], tournament_map["Giải Vô Địch Mùa Hè 2026"], "Chào bạn, hãy tham gia cùng chúng tôi tại giải đua Mùa Hè này nhé!", "PENDING"))
            cursor.execute("INSERT INTO JockeyInvitations (owner_id, jockey_id, horse_id, tournament_id, message, status) VALUES (?, ?, ?, ?, ?, ?)",
                           (owner_profile_map[user_map["owner2"]], jockey_profile_map[user_map["jockey1"]], horse_map["Thiên Mã"], tournament_map["Giải Vô Địch Mùa Hè 2026"], "Hân hạnh mời nài ngựa Lê Minh Khoa cùng đồng hành tranh cúp vô địch Mùa Hè!", "ACCEPTED"))
            cursor.execute("INSERT INTO JockeyInvitations (owner_id, jockey_id, horse_id, tournament_id, message, status) VALUES (?, ?, ?, ?, ?, ?)",
                           (owner_profile_map[user_map["owner3"]], jockey_profile_map[user_map["jockey3"]], horse_map["Xích Long"], tournament_map["Giải Vô Địch Mùa Hè 2026"], "Hội quán Hoàng Gia trân trọng mời bạn tham gia lái chiến mã Xích Long.", "ACCEPTED"))

        # RaceParticipants
        cursor.execute("SELECT COUNT(*) FROM RaceParticipants")
        if cursor.fetchone()[0] == 0:
            print("Seeding RaceParticipants...")
            # Summer Heat 1
            cursor.execute("INSERT INTO RaceParticipants (race_id, registration_id, lane_number, status) VALUES (?, ?, ?, ?)",
                           (race_map["Trận Vòng Loại 1"], registration_map[(tournament_map["Giải Vô Địch Mùa Hè 2026"], horse_map["Tia Chớp"])], 1, "REGISTERED"))
            cursor.execute("INSERT INTO RaceParticipants (race_id, registration_id, lane_number, status) VALUES (?, ?, ?, ?)",
                           (race_map["Trận Vòng Loại 1"], registration_map[(tournament_map["Giải Vô Địch Mùa Hè 2026"], horse_map["Viên Đạn Bạc"])], 2, "REGISTERED"))
            cursor.execute("INSERT INTO RaceParticipants (race_id, registration_id, lane_number, status) VALUES (?, ?, ?, ?)",
                           (race_map["Trận Vòng Loại 1"], registration_map[(tournament_map["Giải Vô Địch Mùa Hè 2026"], horse_map["Xích Long"])], 3, "REGISTERED"))
            
            # Spring Grand Final
            cursor.execute("INSERT INTO RaceParticipants (race_id, registration_id, lane_number, start_time, finish_time, status) VALUES (?, ?, ?, ?, ?, ?)",
                           (race_map["Trận Chung Kết Tổng"], registration_map[(tournament_map["Giải Spring Derby 2026"], horse_map["Phong Vân"])], 1, "2026-05-12 15:00:00", "2026-05-12 15:01:42", "FINISHED"))
            cursor.execute("INSERT INTO RaceParticipants (race_id, registration_id, lane_number, start_time, finish_time, status) VALUES (?, ?, ?, ?, ?, ?)",
                           (race_map["Trận Chung Kết Tổng"], registration_map[(tournament_map["Giải Spring Derby 2026"], horse_map["Thiên Mã"])], 2, "2026-05-12 15:00:00", "2026-05-12 15:01:45", "FINISHED"))

        # Get Participant mapping
        cursor.execute("""
            SELECT rp.id, r.name, h.name 
            FROM RaceParticipants rp
            JOIN Races r ON rp.race_id = r.id
            JOIN Registrations reg ON rp.registration_id = reg.id
            JOIN Horses h ON reg.horse_id = h.id
        """)
        participant_map = {(r_name, h_name): rp_id for rp_id, r_name, h_name in cursor.fetchall()}

        # Results
        cursor.execute("SELECT COUNT(*) FROM Results")
        if cursor.fetchone()[0] == 0:
            print("Seeding Results...")
            # Phong Vân finished 1st in Grand Final
            cursor.execute("INSERT INTO Results (race_participant_id, rank, points, notes) VALUES (?, ?, ?, ?)",
                           (participant_map[("Trận Chung Kết Tổng", "Phong Vân")], 1, 10, "Bứt phá xuất sắc ở chặng nước rút 100m cuối cùng để về đích đầu tiên."))
            # Thiên Mã finished 2nd in Grand Final
            cursor.execute("INSERT INTO Results (race_participant_id, rank, points, notes) VALUES (?, ?, ?, ?)",
                           (participant_map[("Trận Chung Kết Tổng", "Thiên Mã")], 2, 6, "Dẫn đầu ở nửa đầu chặng đua nhưng có dấu hiệu đuối sức ở chặng cuối."))

        # Violations
        cursor.execute("SELECT COUNT(*) FROM Violations")
        if cursor.fetchone()[0] == 0:
            print("Seeding Violations...")
            # Thiên Mã got a violation
            cursor.execute("INSERT INTO Violations (race_participant_id, description, penalty, fine_amount, violation_date) VALUES (?, ?, ?, ?, ?)",
                           (participant_map[("Trận Chung Kết Tổng", "Thiên Mã")], "Lỗi lấn làn chạy làm cản trở đối thủ ở vòng cua số 4.", "Cảnh cáo", 1000000.00, "2026-05-12 15:15:00"))

        # Rankings
        cursor.execute("SELECT COUNT(*) FROM Rankings")
        if cursor.fetchone()[0] == 0:
            print("Seeding Rankings...")
            # Horses
            cursor.execute("INSERT INTO Rankings (entity_type, entity_id, points, rank) VALUES (?, ?, ?, ?)",
                           ("HORSE", horse_map["Phong Vân"], 10, 1))
            cursor.execute("INSERT INTO Rankings (entity_type, entity_id, points, rank) VALUES (?, ?, ?, ?)",
                           ("HORSE", horse_map["Thiên Mã"], 6, 2))
            # Jockeys
            cursor.execute("INSERT INTO Rankings (entity_type, entity_id, points, rank) VALUES (?, ?, ?, ?)",
                           ("JOCKEY", jockey_profile_map[user_map["jockey1"]], 10, 1))
            cursor.execute("INSERT INTO Rankings (entity_type, entity_id, points, rank) VALUES (?, ?, ?, ?)",
                           ("JOCKEY", jockey_profile_map[user_map["jockey2"]], 6, 2))

        # Predictions
        cursor.execute("SELECT COUNT(*) FROM Predictions")
        if cursor.fetchone()[0] == 0:
            print("Seeding Predictions...")
            cursor.execute("INSERT INTO Predictions (user_id, race_participant_id, predicted_rank, status) VALUES (?, ?, ?, ?)",
                           (user_map["spectator1"], participant_map[("Trận Chung Kết Tổng", "Phong Vân")], 1, "Won"))
            cursor.execute("INSERT INTO Predictions (user_id, race_participant_id, predicted_rank, status) VALUES (?, ?, ?, ?)",
                           (user_map["spectator1"], participant_map[("Trận Vòng Loại 1", "Tia Chớp")], 1, "PENDING"))
            cursor.execute("INSERT INTO Predictions (user_id, race_participant_id, predicted_rank, status) VALUES (?, ?, ?, ?)",
                           (user_map["spectator2"], participant_map[("Trận Chung Kết Tổng", "Thiên Mã")], 2, "Won"))

            # Trao reward points cho spectator1 & spectator2 (dự đoán đúng)
            cursor.execute("UPDATE SpectatorProfiles SET reward_points = 15 WHERE user_id = ?",
                           (user_map["spectator1"],))
            cursor.execute("UPDATE SpectatorProfiles SET reward_points = 10 WHERE user_id = ?",
                           (user_map["spectator2"],))

        # Prizes (Giải thưởng cho Spring Derby 2026 – đã COMPLETED)
        cursor.execute("SELECT COUNT(*) FROM Prizes")
        if cursor.fetchone()[0] == 0:
            print("Seeding Prizes...")
            spring_tid = tournament_map["Giải Spring Derby 2026"]
            cursor.execute(
                "INSERT INTO Prizes (tournament_id, position, title, prize_value, description) VALUES (?, ?, ?, ?, ?)",
                (spring_tid, 1, "Giải Nhất Spring Derby", 50000000.00, "Cúp Vàng + Bằng chứng nhận + Tiền thưởng")
            )
            cursor.execute(
                "INSERT INTO Prizes (tournament_id, position, title, prize_value, description) VALUES (?, ?, ?, ?, ?)",
                (spring_tid, 2, "Giải Nhì Spring Derby", 20000000.00, "Cúp Bạc + Bằng chứng nhận + Tiền thưởng")
            )
            cursor.execute(
                "INSERT INTO Prizes (tournament_id, position, title, prize_value, description) VALUES (?, ?, ?, ?, ?)",
                (spring_tid, 3, "Giải Ba Spring Derby", 10000000.00, "Cúp Đồng + Bằng chứng nhận + Tiền thưởng")
            )

            # Summer Championship 2026 – UPCOMING nên chỉ định nghĩa giải, chưa trao
            summer_tid = tournament_map["Giải Vô Địch Mùa Hè 2026"]
            cursor.execute(
                "INSERT INTO Prizes (tournament_id, position, title, prize_value, description) VALUES (?, ?, ?, ?, ?)",
                (summer_tid, 1, "Giải Vô Địch Mùa Hè", 100000000.00, "Cúp Vàng vô địch danh giá + Kỷ niệm chương + Phần thưởng hiện kim")
            )
            cursor.execute(
                "INSERT INTO Prizes (tournament_id, position, title, prize_value, description) VALUES (?, ?, ?, ?, ?)",
                (summer_tid, 2, "Giải Á Quân Mùa Hè", 40000000.00, "Bằng chứng nhận hạng Nhì + Phần thưởng hiện kim")
            )

        # Awards (tự động trao cho Spring Derby 2026 dựa trên kết quả)
        cursor.execute("SELECT COUNT(*) FROM Awards")
        if cursor.fetchone()[0] == 0:
            print("Seeding Awards...")
            # Lấy prize IDs của Spring Derby
            cursor.execute(
                "SELECT position, id FROM Prizes WHERE tournament_id = ?",
                (tournament_map["Giải Spring Derby 2026"],)
            )
            prize_rows = cursor.fetchall()
            prize_pos_map = {pos: pid for pos, pid in prize_rows}

            # Registration map Spring Derby
            spring_reg_map = {
                horse_map["Phong Vân"]: registration_map[(tournament_map["Giải Spring Derby 2026"], horse_map["Phong Vân"])],
                horse_map["Thiên Mã"]:    registration_map[(tournament_map["Giải Spring Derby 2026"], horse_map["Thiên Mã"])],
            }

            # Phong Vân hạng 1 → Giải Nhất
            if 1 in prize_pos_map:
                cursor.execute(
                    "INSERT INTO Awards (prize_id, registration_id, total_points, notes) VALUES (?, ?, ?, ?)",
                    (prize_pos_map[1], spring_reg_map[horse_map["Phong Vân"]], 10,
                     "Hệ thống tự động trao giải nhất khi hoàn thành giải đấu 'Giải Spring Derby 2026'.")
                )
            # Thiên Mã hạng 2 → Giải Nhì
            if 2 in prize_pos_map:
                cursor.execute(
                    "INSERT INTO Awards (prize_id, registration_id, total_points, notes) VALUES (?, ?, ?, ?)",
                    (prize_pos_map[2], spring_reg_map[horse_map["Thiên Mã"]], 6,
                     "Hệ thống tự động trao giải nhì khi hoàn thành giải đấu 'Giải Spring Derby 2026'.")
                )

        cursor.close()
        conn.close()
        print("Database seeded and setup successfully in Vietnamese!")
        
    except Exception as e:
        print(f"Error seeding or executing schema: {e}")

if __name__ == '__main__':
    main()
