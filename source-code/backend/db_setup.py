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
        print("Seeding database with English data...")

        # Roles
        cursor.execute("SELECT COUNT(*) FROM Roles")
        if cursor.fetchone()[0] == 0:
            print("Seeding Roles...")
            roles = [("ADMIN",), ("REFEREE",), ("JOCKEY",), ("OWNER",), ("SPECTATOR",)]
            cursor.executemany("INSERT INTO Roles (name) VALUES (?)", roles)

        # Get roles mapping
        cursor.execute("SELECT name, id FROM Roles")
        role_map = {name: r_id for name, r_id in cursor.fetchall()}

        # Users
        cursor.execute("SELECT COUNT(*) FROM Users")
        if cursor.fetchone()[0] == 0:
            print("Seeding Users...")
            pw_admin    = hash_password("admin123")
            pw_referee  = hash_password("ref123")
            pw_jockey   = hash_password("joc123")
            pw_owner    = hash_password("own123")
            pw_spectator = hash_password("spec123")

            users = [
                ("admin",      pw_admin,     "admin@horseracing.com",      "System Administrator",  role_map["ADMIN"]),
                ("referee1",   pw_referee,   "referee1@horseracing.com",   "Referee James Carter",  role_map["REFEREE"]),
                ("referee2",   pw_referee,   "referee2@horseracing.com",   "Referee Michael Brown", role_map["REFEREE"]),
                ("referee3",   pw_referee,   "referee3@horseracing.com",   "Referee David Wilson",  role_map["REFEREE"]),
                ("jockey1",    pw_jockey,    "jockey1@horseracing.com",    "Jockey Kevin Blake",    role_map["JOCKEY"]),
                ("jockey2",    pw_jockey,    "jockey2@horseracing.com",    "Jockey Ryan Foster",    role_map["JOCKEY"]),
                ("jockey3",    pw_jockey,    "jockey3@horseracing.com",    "Jockey Nathan Scott",   role_map["JOCKEY"]),
                ("owner1",     pw_owner,     "owner1@horseracing.com",     "Owner Robert Hughes",   role_map["OWNER"]),
                ("owner2",     pw_owner,     "owner2@horseracing.com",     "Owner Sarah Mitchell",  role_map["OWNER"]),
                ("owner3",     pw_owner,     "owner3@horseracing.com",     "Owner George Thornton", role_map["OWNER"]),
                ("spectator1", pw_spectator, "spectator1@horseracing.com", "Spectator Emily Davis", role_map["SPECTATOR"]),
                ("spectator2", pw_spectator, "spectator2@horseracing.com", "Spectator Chris Moore",  role_map["SPECTATOR"]),
            ]
            cursor.executemany(
                "INSERT INTO Users (username, password_hash, email, full_name, role_id) VALUES (?, ?, ?, ?, ?)",
                users
            )

        # Get Users mapping
        cursor.execute("SELECT username, id FROM Users")
        user_map = {username: u_id for username, u_id in cursor.fetchall()}

        # Profiles
        cursor.execute("SELECT COUNT(*) FROM JockeyProfiles")
        if cursor.fetchone()[0] == 0:
            print("Seeding Profiles...")

            # Jockeys
            cursor.execute(
                "INSERT INTO JockeyProfiles (user_id, bio, weight, height, experience_years) VALUES (?, ?, ?, ?, ?)",
                (user_map["jockey1"],
                 "A seasoned jockey with over 50 national championship victories and an exceptional finishing sprint.",
                 54.50, 1.62, 8)
            )
            cursor.execute(
                "INSERT INTO JockeyProfiles (user_id, bio, weight, height, experience_years) VALUES (?, ?, ?, ?, ?)",
                (user_map["jockey2"],
                 "A rising star in professional horse racing, known for explosive acceleration and tactical brilliance.",
                 52.00, 1.58, 4)
            )
            cursor.execute(
                "INSERT INTO JockeyProfiles (user_id, bio, weight, height, experience_years) VALUES (?, ?, ?, ?, ?)",
                (user_map["jockey3"],
                 "Technically gifted jockey excelling in short and mid-distance races that demand top speed.",
                 53.00, 1.60, 6)
            )

            # Owners
            cursor.execute(
                "INSERT INTO HorseOwnerProfiles (user_id, company_name) VALUES (?, ?)",
                (user_map["owner1"], "Apex Racing Stables")
            )
            cursor.execute(
                "INSERT INTO HorseOwnerProfiles (user_id, company_name) VALUES (?, ?)",
                (user_map["owner2"], "Blue Ribbon Breeding Centre")
            )
            cursor.execute(
                "INSERT INTO HorseOwnerProfiles (user_id, company_name) VALUES (?, ?)",
                (user_map["owner3"], "Royal Equestrian Club")
            )

            # Referees
            cursor.execute(
                "INSERT INTO RefereeProfiles (user_id, certification_level) VALUES (?, ?)",
                (user_map["referee1"], "International Grade A Referee")
            )
            cursor.execute(
                "INSERT INTO RefereeProfiles (user_id, certification_level) VALUES (?, ?)",
                (user_map["referee2"], "National Grade B Referee")
            )
            cursor.execute(
                "INSERT INTO RefereeProfiles (user_id, certification_level) VALUES (?, ?)",
                (user_map["referee3"], "International Grade B Referee")
            )

            # Spectators
            cursor.execute(
                "INSERT INTO SpectatorProfiles (user_id, favorite_horse_breed) VALUES (?, ?)",
                (user_map["spectator1"], "Thoroughbred")
            )
            cursor.execute(
                "INSERT INTO SpectatorProfiles (user_id, favorite_horse_breed) VALUES (?, ?)",
                (user_map["spectator2"], "Arabian")
            )

        # Get Owner, Jockey and Referee Profile mappings
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
                ("Thunder Bolt",   5, "Thoroughbred", "Male",   owner_profile_map[user_map["owner1"]]),
                ("Wind Dancer",    4, "Arabian",       "Female", owner_profile_map[user_map["owner1"]]),
                ("Silver Bullet",  6, "Quarter Horse", "Gelding",owner_profile_map[user_map["owner2"]]),
                ("Sky Legend",     3, "Thoroughbred", "Male",   owner_profile_map[user_map["owner2"]]),
                ("Red Dragon",     5, "Thoroughbred", "Male",   owner_profile_map[user_map["owner3"]]),
                ("Dark Diamond",   4, "Arabian",       "Female", owner_profile_map[user_map["owner3"]]),
            ]
            cursor.executemany(
                "INSERT INTO Horses (name, age, breed, gender, owner_id) VALUES (?, ?, ?, ?, ?)",
                horses
            )

        # Get Horse mapping
        cursor.execute("SELECT name, id FROM Horses")
        horse_map = {name: h_id for name, h_id in cursor.fetchall()}

        # Tournaments
        cursor.execute("SELECT COUNT(*) FROM Tournaments")
        if cursor.fetchone()[0] == 0:
            print("Seeding Tournaments...")
            cursor.execute(
                "INSERT INTO Tournaments (name, description, start_date, end_date, location, status) VALUES (?, ?, ?, ?, ?, ?)",
                ("Summer Championship 2026",
                 "The biggest horse racing event of the year, gathering top stables from across the country.",
                 "2026-06-10", "2026-06-15", "Royal Arena", "UPCOMING")
            )
            cursor.execute(
                "INSERT INTO Tournaments (name, description, start_date, end_date, location, status) VALUES (?, ?, ?, ?, ?, ?)",
                ("Spring Derby 2026",
                 "Annual spring derby for thoroughbred and local horses.",
                 "2026-05-10", "2026-05-12", "Green Valley Track", "COMPLETED")
            )

        # Get Tournament mapping
        cursor.execute("SELECT name, id FROM Tournaments")
        tournament_map = {name: t_id for name, t_id in cursor.fetchall()}

        # Rounds
        cursor.execute("SELECT COUNT(*) FROM Rounds")
        if cursor.fetchone()[0] == 0:
            print("Seeding Rounds...")
            cursor.execute(
                "INSERT INTO Rounds (tournament_id, name, sequence) VALUES (?, ?, ?)",
                (tournament_map["Summer Championship 2026"], "Qualifying Round", 1)
            )
            cursor.execute(
                "INSERT INTO Rounds (tournament_id, name, sequence) VALUES (?, ?, ?)",
                (tournament_map["Summer Championship 2026"], "Grand Final", 2)
            )
            cursor.execute(
                "INSERT INTO Rounds (tournament_id, name, sequence) VALUES (?, ?, ?)",
                (tournament_map["Spring Derby 2026"], "Grand Final", 1)
            )

        # Get Rounds mapping (tournament_id, name -> id)
        cursor.execute("SELECT tournament_id, name, id FROM Rounds")
        round_map = {(t_id, name): r_id for t_id, name, r_id in cursor.fetchall()}

        # Races
        cursor.execute("SELECT COUNT(*) FROM Races")
        if cursor.fetchone()[0] == 0:
            print("Seeding Races...")
            # Summer Championship – Qualifying Heat 1
            cursor.execute(
                "INSERT INTO Races (round_id, name, race_time, track_condition, distance, referee_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (round_map[(tournament_map["Summer Championship 2026"], "Qualifying Round")],
                 "Qualifying Heat 1", "2026-06-10 14:00:00", "Good", 1200,
                 referee_profile_map[user_map["referee1"]], "SCHEDULED")
            )
            # Spring Derby – Grand Final
            cursor.execute(
                "INSERT INTO Races (round_id, name, race_time, track_condition, distance, referee_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (round_map[(tournament_map["Spring Derby 2026"], "Grand Final")],
                 "Spring Derby Grand Final", "2026-05-12 15:00:00", "Soft", 1600,
                 referee_profile_map[user_map["referee1"]], "COMPLETED")
            )

        # Get Races mapping
        cursor.execute("SELECT name, id FROM Races")
        race_map = {name: r_id for name, r_id in cursor.fetchall()}

        # Registrations
        cursor.execute("SELECT COUNT(*) FROM Registrations")
        if cursor.fetchone()[0] == 0:
            print("Seeding Registrations...")
            # Summer Championship
            cursor.execute(
                "INSERT INTO Registrations (tournament_id, horse_id, jockey_id, status) VALUES (?, ?, ?, ?)",
                (tournament_map["Summer Championship 2026"], horse_map["Thunder Bolt"], jockey_profile_map[user_map["jockey1"]], "APPROVED")
            )
            cursor.execute(
                "INSERT INTO Registrations (tournament_id, horse_id, jockey_id, status) VALUES (?, ?, ?, ?)",
                (tournament_map["Summer Championship 2026"], horse_map["Silver Bullet"], jockey_profile_map[user_map["jockey2"]], "APPROVED")
            )
            cursor.execute(
                "INSERT INTO Registrations (tournament_id, horse_id, jockey_id, status) VALUES (?, ?, ?, ?)",
                (tournament_map["Summer Championship 2026"], horse_map["Red Dragon"], jockey_profile_map[user_map["jockey3"]], "APPROVED")
            )
            # Spring Derby
            cursor.execute(
                "INSERT INTO Registrations (tournament_id, horse_id, jockey_id, status) VALUES (?, ?, ?, ?)",
                (tournament_map["Spring Derby 2026"], horse_map["Wind Dancer"], jockey_profile_map[user_map["jockey1"]], "APPROVED")
            )
            cursor.execute(
                "INSERT INTO Registrations (tournament_id, horse_id, jockey_id, status) VALUES (?, ?, ?, ?)",
                (tournament_map["Spring Derby 2026"], horse_map["Sky Legend"], jockey_profile_map[user_map["jockey2"]], "APPROVED")
            )

        # Get Registrations mapping (tournament_id, horse_id -> id)
        cursor.execute("SELECT tournament_id, horse_id, id FROM Registrations")
        registration_map = {(t_id, h_id): reg_id for t_id, h_id, reg_id in cursor.fetchall()}

        # JockeyInvitations
        cursor.execute("SELECT COUNT(*) FROM JockeyInvitations")
        if cursor.fetchone()[0] == 0:
            print("Seeding JockeyInvitations...")
            cursor.execute(
                "INSERT INTO JockeyInvitations (owner_id, jockey_id, horse_id, tournament_id, message, status) VALUES (?, ?, ?, ?, ?, ?)",
                (owner_profile_map[user_map["owner1"]], jockey_profile_map[user_map["jockey2"]],
                 horse_map["Wind Dancer"], tournament_map["Summer Championship 2026"],
                 "Hello, we'd love to have you join us for the Summer Championship!", "PENDING")
            )
            cursor.execute(
                "INSERT INTO JockeyInvitations (owner_id, jockey_id, horse_id, tournament_id, message, status) VALUES (?, ?, ?, ?, ?, ?)",
                (owner_profile_map[user_map["owner2"]], jockey_profile_map[user_map["jockey1"]],
                 horse_map["Sky Legend"], tournament_map["Summer Championship 2026"],
                 "We are honoured to invite Kevin Blake to compete with Sky Legend in the Summer Championship!", "ACCEPTED")
            )
            cursor.execute(
                "INSERT INTO JockeyInvitations (owner_id, jockey_id, horse_id, tournament_id, message, status) VALUES (?, ?, ?, ?, ?, ?)",
                (owner_profile_map[user_map["owner3"]], jockey_profile_map[user_map["jockey3"]],
                 horse_map["Red Dragon"], tournament_map["Summer Championship 2026"],
                 "Royal Equestrian Club warmly invites you to ride Red Dragon this season.", "ACCEPTED")
            )

        # RaceParticipants
        cursor.execute("SELECT COUNT(*) FROM RaceParticipants")
        if cursor.fetchone()[0] == 0:
            print("Seeding RaceParticipants...")
            # Summer Qualifying Heat 1
            cursor.execute(
                "INSERT INTO RaceParticipants (race_id, registration_id, lane_number, status) VALUES (?, ?, ?, ?)",
                (race_map["Qualifying Heat 1"],
                 registration_map[(tournament_map["Summer Championship 2026"], horse_map["Thunder Bolt"])],
                 1, "REGISTERED")
            )
            cursor.execute(
                "INSERT INTO RaceParticipants (race_id, registration_id, lane_number, status) VALUES (?, ?, ?, ?)",
                (race_map["Qualifying Heat 1"],
                 registration_map[(tournament_map["Summer Championship 2026"], horse_map["Silver Bullet"])],
                 2, "REGISTERED")
            )
            cursor.execute(
                "INSERT INTO RaceParticipants (race_id, registration_id, lane_number, status) VALUES (?, ?, ?, ?)",
                (race_map["Qualifying Heat 1"],
                 registration_map[(tournament_map["Summer Championship 2026"], horse_map["Red Dragon"])],
                 3, "REGISTERED")
            )
            # Spring Derby Grand Final
            cursor.execute(
                "INSERT INTO RaceParticipants (race_id, registration_id, lane_number, start_time, finish_time, status) VALUES (?, ?, ?, ?, ?, ?)",
                (race_map["Spring Derby Grand Final"],
                 registration_map[(tournament_map["Spring Derby 2026"], horse_map["Wind Dancer"])],
                 1, "2026-05-12 15:00:00", "2026-05-12 15:01:42", "FINISHED")
            )
            cursor.execute(
                "INSERT INTO RaceParticipants (race_id, registration_id, lane_number, start_time, finish_time, status) VALUES (?, ?, ?, ?, ?, ?)",
                (race_map["Spring Derby Grand Final"],
                 registration_map[(tournament_map["Spring Derby 2026"], horse_map["Sky Legend"])],
                 2, "2026-05-12 15:00:00", "2026-05-12 15:01:45", "FINISHED")
            )

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
            cursor.execute(
                "INSERT INTO Results (race_participant_id, rank, points, notes) VALUES (?, ?, ?, ?)",
                (participant_map[("Spring Derby Grand Final", "Wind Dancer")], 1, 10,
                 "Brilliant late surge in the final 100m to cross the finish line first.")
            )
            cursor.execute(
                "INSERT INTO Results (race_participant_id, rank, points, notes) VALUES (?, ?, ?, ?)",
                (participant_map[("Spring Derby Grand Final", "Sky Legend")], 2, 6,
                 "Led for the first half but showed signs of fatigue in the final stretch.")
            )

        # Violations
        cursor.execute("SELECT COUNT(*) FROM Violations")
        if cursor.fetchone()[0] == 0:
            print("Seeding Violations...")
            cursor.execute(
                "INSERT INTO Violations (race_participant_id, description, penalty, fine_amount, violation_date) VALUES (?, ?, ?, ?, ?)",
                (participant_map[("Spring Derby Grand Final", "Sky Legend")],
                 "Lane encroachment on turn 4, obstructing a competitor.",
                 "Warning", 500.00, "2026-05-12 15:15:00")
            )

        # Rankings
        cursor.execute("SELECT COUNT(*) FROM Rankings")
        if cursor.fetchone()[0] == 0:
            print("Seeding Rankings...")
            cursor.execute(
                "INSERT INTO Rankings (entity_type, entity_id, points, rank) VALUES (?, ?, ?, ?)",
                ("HORSE", horse_map["Wind Dancer"], 10, 1)
            )
            cursor.execute(
                "INSERT INTO Rankings (entity_type, entity_id, points, rank) VALUES (?, ?, ?, ?)",
                ("HORSE", horse_map["Sky Legend"], 6, 2)
            )
            cursor.execute(
                "INSERT INTO Rankings (entity_type, entity_id, points, rank) VALUES (?, ?, ?, ?)",
                ("JOCKEY", jockey_profile_map[user_map["jockey1"]], 10, 1)
            )
            cursor.execute(
                "INSERT INTO Rankings (entity_type, entity_id, points, rank) VALUES (?, ?, ?, ?)",
                ("JOCKEY", jockey_profile_map[user_map["jockey2"]], 6, 2)
            )

        # Predictions
        cursor.execute("SELECT COUNT(*) FROM Predictions")
        if cursor.fetchone()[0] == 0:
            print("Seeding Predictions...")
            cursor.execute(
                "INSERT INTO Predictions (user_id, race_participant_id, predicted_rank, status) VALUES (?, ?, ?, ?)",
                (user_map["spectator1"], participant_map[("Spring Derby Grand Final", "Wind Dancer")], 1, "Won")
            )
            cursor.execute(
                "INSERT INTO Predictions (user_id, race_participant_id, predicted_rank, status) VALUES (?, ?, ?, ?)",
                (user_map["spectator1"], participant_map[("Qualifying Heat 1", "Thunder Bolt")], 1, "PENDING")
            )
            cursor.execute(
                "INSERT INTO Predictions (user_id, race_participant_id, predicted_rank, status) VALUES (?, ?, ?, ?)",
                (user_map["spectator2"], participant_map[("Spring Derby Grand Final", "Sky Legend")], 2, "Won")
            )
            # Award reward points for correct predictions
            cursor.execute(
                "UPDATE SpectatorProfiles SET reward_points = 15 WHERE user_id = ?",
                (user_map["spectator1"],)
            )
            cursor.execute(
                "UPDATE SpectatorProfiles SET reward_points = 10 WHERE user_id = ?",
                (user_map["spectator2"],)
            )

        # Prizes (Spring Derby 2026 – COMPLETED)
        cursor.execute("SELECT COUNT(*) FROM Prizes")
        if cursor.fetchone()[0] == 0:
            print("Seeding Prizes...")
            spring_tid = tournament_map["Spring Derby 2026"]
            cursor.execute(
                "INSERT INTO Prizes (tournament_id, position, title, prize_value, description) VALUES (?, ?, ?, ?, ?)",
                (spring_tid, 1, "Spring Derby 1st Place", 5000.00, "Gold Cup + Certificate of Excellence + Cash Prize")
            )
            cursor.execute(
                "INSERT INTO Prizes (tournament_id, position, title, prize_value, description) VALUES (?, ?, ?, ?, ?)",
                (spring_tid, 2, "Spring Derby 2nd Place", 2000.00, "Silver Cup + Certificate + Cash Prize")
            )
            cursor.execute(
                "INSERT INTO Prizes (tournament_id, position, title, prize_value, description) VALUES (?, ?, ?, ?, ?)",
                (spring_tid, 3, "Spring Derby 3rd Place", 1000.00, "Bronze Cup + Certificate + Cash Prize")
            )
            # Summer Championship – UPCOMING, prizes defined but not yet awarded
            summer_tid = tournament_map["Summer Championship 2026"]
            cursor.execute(
                "INSERT INTO Prizes (tournament_id, position, title, prize_value, description) VALUES (?, ?, ?, ?, ?)",
                (summer_tid, 1, "Summer Champion", 10000.00,
                 "Prestigious Gold Championship Trophy + Medal + Cash Prize")
            )
            cursor.execute(
                "INSERT INTO Prizes (tournament_id, position, title, prize_value, description) VALUES (?, ?, ?, ?, ?)",
                (summer_tid, 2, "Summer Runner-Up", 4000.00,
                 "Runner-Up Certificate + Cash Prize")
            )

        # Awards (auto-awarded for Spring Derby 2026 based on results)
        cursor.execute("SELECT COUNT(*) FROM Awards")
        if cursor.fetchone()[0] == 0:
            print("Seeding Awards...")
            cursor.execute(
                "SELECT position, id FROM Prizes WHERE tournament_id = ?",
                (tournament_map["Spring Derby 2026"],)
            )
            prize_pos_map = {pos: pid for pos, pid in cursor.fetchall()}

            spring_reg_map = {
                horse_map["Wind Dancer"]: registration_map[(tournament_map["Spring Derby 2026"], horse_map["Wind Dancer"])],
                horse_map["Sky Legend"]:  registration_map[(tournament_map["Spring Derby 2026"], horse_map["Sky Legend"])],
            }

            if 1 in prize_pos_map:
                cursor.execute(
                    "INSERT INTO Awards (prize_id, registration_id, total_points, notes) VALUES (?, ?, ?, ?)",
                    (prize_pos_map[1], spring_reg_map[horse_map["Wind Dancer"]], 10,
                     "System auto-awarded 1st place upon completion of Spring Derby 2026.")
                )
            if 2 in prize_pos_map:
                cursor.execute(
                    "INSERT INTO Awards (prize_id, registration_id, total_points, notes) VALUES (?, ?, ?, ?)",
                    (prize_pos_map[2], spring_reg_map[horse_map["Sky Legend"]], 6,
                     "System auto-awarded 2nd place upon completion of Spring Derby 2026.")
                )

        cursor.close()
        conn.close()
        print("Database seeded and setup successfully in English!")
        
    except Exception as e:
        print(f"Error seeding or executing schema: {e}")

if __name__ == '__main__':
    main()
