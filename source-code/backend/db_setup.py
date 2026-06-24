import os
import pyodbc
import bcrypt

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
        print("Seeding database...")
        
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
            pw_admin = hash_password("admin123")
            pw_referee = hash_password("ref123")
            pw_jockey = hash_password("joc123")
            pw_owner = hash_password("own123")
            pw_spectator = hash_password("spec123")
            
            users = [
                ("admin", pw_admin, "admin@horseracing.com", "Admin Organizer", role_map["ADMIN"]),
                ("referee1", pw_referee, "referee1@horseracing.com", "John Referee", role_map["REFEREE"]),
                ("referee2", pw_referee, "referee2@horseracing.com", "David Referee", role_map["REFEREE"]),
                ("jockey1", pw_jockey, "jockey1@horseracing.com", "Mike Jockey", role_map["JOCKEY"]),
                ("jockey2", pw_jockey, "jockey2@horseracing.com", "Sarah Jockey", role_map["JOCKEY"]),
                ("owner1", pw_owner, "owner1@horseracing.com", "Arthur Owner", role_map["OWNER"]),
                ("owner2", pw_owner, "owner2@horseracing.com", "Elizabeth Owner", role_map["OWNER"]),
                ("spectator1", pw_spectator, "spectator1@horseracing.com", "Bob Spectator", role_map["SPECTATOR"])
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
                           (user_map["jockey1"], "Experienced jockey with 50+ wins", 54.50, 1.62, 8))
            cursor.execute("INSERT INTO JockeyProfiles (user_id, bio, weight, height, experience_years) VALUES (?, ?, ?, ?, ?)",
                           (user_map["jockey2"], "Fast rising star in horse racing", 52.00, 1.58, 4))
            
            # Owners
            cursor.execute("INSERT INTO HorseOwnerProfiles (user_id, company_name) VALUES (?, ?)",
                           (user_map["owner1"], "Apex Racing Stables"))
            cursor.execute("INSERT INTO HorseOwnerProfiles (user_id, company_name) VALUES (?, ?)",
                           (user_map["owner2"], "Blue Ribbon Breeding"))
            
            # Referees
            cursor.execute("INSERT INTO RefereeProfiles (user_id, certification_level) VALUES (?, ?)",
                           (user_map["referee1"], "International Class A"))
            cursor.execute("INSERT INTO RefereeProfiles (user_id, certification_level) VALUES (?, ?)",
                           (user_map["referee2"], "National Class B"))
            
            # Spectators
            cursor.execute("INSERT INTO SpectatorProfiles (user_id, favorite_horse_breed) VALUES (?, ?)",
                           (user_map["spectator1"], "Thoroughbred"))

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
                ("Thunderbolt", 5, "Thoroughbred", "Stallion", owner_profile_map[user_map["owner1"]]),
                ("Windrunner", 4, "Arabian", "Mare", owner_profile_map[user_map["owner1"]]),
                ("Silver Bullet", 6, "Quarter Horse", "Gelding", owner_profile_map[user_map["owner2"]]),
                ("Pegasus", 3, "Thoroughbred", "Stallion", owner_profile_map[user_map["owner2"]])
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
                           ("Summer Championship 2026", "The biggest summer event of horse racing", "2026-06-10", "2026-06-15", "Royal Arena", "UPCOMING"))
            cursor.execute("INSERT INTO Tournaments (name, description, start_date, end_date, location, status) VALUES (?, ?, ?, ?, ?, ?)",
                           ("Spring Derby 2026", "Spring tournament for local breeds", "2026-05-10", "2026-05-12", "Green Valley", "COMPLETED"))

        # Get Tournament mapping
        cursor.execute("SELECT name, id FROM Tournaments")
        tournament_map = {name: t_id for name, t_id in cursor.fetchall()}

        # Rounds
        cursor.execute("SELECT COUNT(*) FROM Rounds")
        if cursor.fetchone()[0] == 0:
            print("Seeding Rounds...")
            cursor.execute("INSERT INTO Rounds (tournament_id, name, sequence) VALUES (?, ?, ?)",
                           (tournament_map["Summer Championship 2026"], "Qualification", 1))
            cursor.execute("INSERT INTO Rounds (tournament_id, name, sequence) VALUES (?, ?, ?)",
                           (tournament_map["Summer Championship 2026"], "Finals", 2))
            cursor.execute("INSERT INTO Rounds (tournament_id, name, sequence) VALUES (?, ?, ?)",
                           (tournament_map["Spring Derby 2026"], "Finals", 1))

        # Get Rounds mapping (tournament_id, name -> id)
        cursor.execute("SELECT tournament_id, name, id FROM Rounds")
        round_map = {(t_id, name): r_id for t_id, name, r_id in cursor.fetchall()}

        # Races
        cursor.execute("SELECT COUNT(*) FROM Races")
        if cursor.fetchone()[0] == 0:
            print("Seeding Races...")
            # Heat 1 for Summer Qualification
            cursor.execute("INSERT INTO Races (round_id, name, race_time, track_condition, distance, referee_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                           (round_map[(tournament_map["Summer Championship 2026"], "Qualification")],
                            "Heat 1", "2026-06-10 14:00:00", "Good", 1200, referee_profile_map[user_map["referee1"]], "SCHEDULED"))
            
            # Grand Final for Spring Finals
            cursor.execute("INSERT INTO Races (round_id, name, race_time, track_condition, distance, referee_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                           (round_map[(tournament_map["Spring Derby 2026"], "Finals")],
                            "Grand Final", "2026-05-12 15:00:00", "Wet", 1600, referee_profile_map[user_map["referee1"]], "COMPLETED"))

        # Get Races mapping
        cursor.execute("SELECT name, id FROM Races")
        race_map = {name: r_id for name, r_id in cursor.fetchall()}

        # Registrations (Horse-Jockey pair registering for a Tournament)
        cursor.execute("SELECT COUNT(*) FROM Registrations")
        if cursor.fetchone()[0] == 0:
            print("Seeding Registrations...")
            # Summer Championship
            cursor.execute("INSERT INTO Registrations (tournament_id, horse_id, jockey_id, status) VALUES (?, ?, ?, ?)",
                           (tournament_map["Summer Championship 2026"], horse_map["Thunderbolt"], jockey_profile_map[user_map["jockey1"]], "APPROVED"))
            cursor.execute("INSERT INTO Registrations (tournament_id, horse_id, jockey_id, status) VALUES (?, ?, ?, ?)",
                           (tournament_map["Summer Championship 2026"], horse_map["Silver Bullet"], jockey_profile_map[user_map["jockey2"]], "APPROVED"))
            
            # Spring Derby
            cursor.execute("INSERT INTO Registrations (tournament_id, horse_id, jockey_id, status) VALUES (?, ?, ?, ?)",
                           (tournament_map["Spring Derby 2026"], horse_map["Windrunner"], jockey_profile_map[user_map["jockey1"]], "APPROVED"))
            cursor.execute("INSERT INTO Registrations (tournament_id, horse_id, jockey_id, status) VALUES (?, ?, ?, ?)",
                           (tournament_map["Spring Derby 2026"], horse_map["Pegasus"], jockey_profile_map[user_map["jockey2"]], "APPROVED"))

        # Get Registrations mapping (tournament_id, horse_id -> id)
        cursor.execute("SELECT tournament_id, horse_id, id FROM Registrations")
        registration_map = {(t_id, h_id): reg_id for t_id, h_id, reg_id in cursor.fetchall()}

        # JockeyInvitations
        cursor.execute("SELECT COUNT(*) FROM JockeyInvitations")
        if cursor.fetchone()[0] == 0:
            print("Seeding JockeyInvitations...")
            cursor.execute("INSERT INTO JockeyInvitations (owner_id, jockey_id, horse_id, tournament_id, message, status) VALUES (?, ?, ?, ?, ?, ?)",
                           (owner_profile_map[user_map["owner1"]], jockey_profile_map[user_map["jockey2"]], horse_map["Windrunner"], tournament_map["Summer Championship 2026"], "Join us for the Summer race!", "PENDING"))
            cursor.execute("INSERT INTO JockeyInvitations (owner_id, jockey_id, horse_id, tournament_id, message, status) VALUES (?, ?, ?, ?, ?, ?)",
                           (owner_profile_map[user_map["owner2"]], jockey_profile_map[user_map["jockey1"]], horse_map["Pegasus"], tournament_map["Summer Championship 2026"], "Let's win this together!", "ACCEPTED"))

        # RaceParticipants
        cursor.execute("SELECT COUNT(*) FROM RaceParticipants")
        if cursor.fetchone()[0] == 0:
            print("Seeding RaceParticipants...")
            # Summer Heat 1
            cursor.execute("INSERT INTO RaceParticipants (race_id, registration_id, lane_number, status) VALUES (?, ?, ?, ?)",
                           (race_map["Heat 1"], registration_map[(tournament_map["Summer Championship 2026"], horse_map["Thunderbolt"])], 1, "REGISTERED"))
            cursor.execute("INSERT INTO RaceParticipants (race_id, registration_id, lane_number, status) VALUES (?, ?, ?, ?)",
                           (race_map["Heat 1"], registration_map[(tournament_map["Summer Championship 2026"], horse_map["Silver Bullet"])], 2, "REGISTERED"))
            
            # Spring Grand Final
            cursor.execute("INSERT INTO RaceParticipants (race_id, registration_id, lane_number, start_time, finish_time, status) VALUES (?, ?, ?, ?, ?, ?)",
                           (race_map["Grand Final"], registration_map[(tournament_map["Spring Derby 2026"], horse_map["Windrunner"])], 1, "2026-05-12 15:00:00", "2026-05-12 15:01:42", "FINISHED"))
            cursor.execute("INSERT INTO RaceParticipants (race_id, registration_id, lane_number, start_time, finish_time, status) VALUES (?, ?, ?, ?, ?, ?)",
                           (race_map["Grand Final"], registration_map[(tournament_map["Spring Derby 2026"], horse_map["Pegasus"])], 2, "2026-05-12 15:00:00", "2026-05-12 15:01:45", "FINISHED"))

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
            # Windrunner finished 1st in Grand Final
            cursor.execute("INSERT INTO Results (race_participant_id, rank, points, notes) VALUES (?, ?, ?, ?)",
                           (participant_map[("Grand Final", "Windrunner")], 1, 10, "Superb sprint at the end"))
            # Pegasus finished 2nd in Grand Final
            cursor.execute("INSERT INTO Results (race_participant_id, rank, points, notes) VALUES (?, ?, ?, ?)",
                           (participant_map[("Grand Final", "Pegasus")], 2, 6, "Tired out in last 100m"))

        # Violations
        cursor.execute("SELECT COUNT(*) FROM Violations")
        if cursor.fetchone()[0] == 0:
            print("Seeding Violations...")
            # Pegasus got a violation
            cursor.execute("INSERT INTO Violations (race_participant_id, description, penalty, fine_amount, violation_date) VALUES (?, ?, ?, ?, ?)",
                           (participant_map[("Grand Final", "Pegasus")], "Lane crossing infraction in final turn", "Warning", 50.00, "2026-05-12 15:15:00"))

        # Rankings
        cursor.execute("SELECT COUNT(*) FROM Rankings")
        if cursor.fetchone()[0] == 0:
            print("Seeding Rankings...")
            # Horses
            cursor.execute("INSERT INTO Rankings (entity_type, entity_id, points, rank) VALUES (?, ?, ?, ?)",
                           ("HORSE", horse_map["Windrunner"], 10, 1))
            cursor.execute("INSERT INTO Rankings (entity_type, entity_id, points, rank) VALUES (?, ?, ?, ?)",
                           ("HORSE", horse_map["Pegasus"], 6, 2))
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
                           (user_map["spectator1"], participant_map[("Grand Final", "Windrunner")], 1, "CORRECT"))
            cursor.execute("INSERT INTO Predictions (user_id, race_participant_id, predicted_rank, status) VALUES (?, ?, ?, ?)",
                           (user_map["spectator1"], participant_map[("Heat 1", "Thunderbolt")], 1, "PENDING"))

        cursor.close()
        conn.close()
        print("Database seeded and setup successfully!")
        
    except Exception as e:
        print(f"Error seeding or executing schema: {e}")

if __name__ == '__main__':
    main()
