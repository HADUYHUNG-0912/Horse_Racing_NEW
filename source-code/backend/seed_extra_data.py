"""
seed_extra_data.py - Bo sung them du lieu test (tieng Anh) vao he thong Horse Racing
Khong xoa du lieu cu - chi INSERT them vao nhung bang con thieu hoac bo sung them record

Du lieu bo sung bao gom:
 - 6 ngua moi (Golden Flash, Storm Breaker, Blue Horizon, Night Fury, Crimson Star, Iron Will)
 - Tournament "Autumn Classic 2026" (COMPLETED) - test Owner Awards, Jockey Results
 - Tournament "Winter Cup 2026" (ACTIVE) - test Referee ghi ket qua, Admin quan ly
 - 5 rounds, 5 races (3 COMPLETED + 2 SCHEDULED)
 - 9 Results, 1 Violation, 3 Awards
 - 6 JockeyInvitations (ACCEPTED)
 - 4 Predictions cho Spectators (Winter Cup - PENDING)
 - Rankings cap nhat
"""

import os
import pyodbc
import bcrypt

def load_dotenv():
    for path in [".env", "source-code/backend/.env", "../.env"]:
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
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def main():
    server = os.getenv("SQL_SERVER_HOST", r"localhost\SQLEXPRESS")
    db_conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={server};DATABASE=HorseRacing;Trusted_Connection=yes;Encrypt=no;"
    )

    try:
        conn = pyodbc.connect(db_conn_str, autocommit=True)
        cursor = conn.cursor()
        print("[OK] Connected to HorseRacing database.")
    except Exception as e:
        print(f"[ERR] Cannot connect: {e}")
        return

    # -----------------------------------------------
    # Fetch existing mappings
    # -----------------------------------------------
    cursor.execute("SELECT username, id FROM Users")
    user_map = {u: uid for u, uid in cursor.fetchall()}

    cursor.execute("SELECT user_id, id FROM HorseOwnerProfiles")
    owner_profile_map = {uid: pid for uid, pid in cursor.fetchall()}

    cursor.execute("SELECT user_id, id FROM JockeyProfiles")
    jockey_profile_map = {uid: pid for uid, pid in cursor.fetchall()}

    cursor.execute("SELECT user_id, id FROM RefereeProfiles")
    referee_profile_map = {uid: pid for uid, pid in cursor.fetchall()}

    cursor.execute("SELECT name, id FROM Horses")
    horse_map = {n: hid for n, hid in cursor.fetchall()}

    cursor.execute("SELECT name, id FROM Tournaments")
    tournament_map = {n: tid for n, tid in cursor.fetchall()}

    # -----------------------------------------------
    # 1. THEM HORSES
    # -----------------------------------------------
    extra_horses = [
        ("Golden Flash",   5, "Thoroughbred",  "Male",   owner_profile_map[user_map["owner1"]]),
        ("Storm Breaker",  4, "Quarter Horse",  "Gelding",owner_profile_map[user_map["owner2"]]),
        ("Blue Horizon",   6, "Arabian",        "Female", owner_profile_map[user_map["owner3"]]),
        ("Night Fury",     3, "Thoroughbred",   "Male",   owner_profile_map[user_map["owner1"]]),
        ("Crimson Star",   5, "Arabian",        "Female", owner_profile_map[user_map["owner2"]]),
        ("Iron Will",      7, "Quarter Horse",  "Gelding",owner_profile_map[user_map["owner3"]]),
    ]
    for hname, age, breed, gender, oid in extra_horses:
        if hname not in horse_map:
            cursor.execute(
                "INSERT INTO Horses (name, age, breed, gender, owner_id) VALUES (?, ?, ?, ?, ?)",
                (hname, age, breed, gender, oid)
            )
            print(f"  [HORSE] Inserted: {hname}")
    cursor.execute("SELECT name, id FROM Horses")
    horse_map = {n: hid for n, hid in cursor.fetchall()}

    # -----------------------------------------------
    # 2. TOURNAMENTS
    # -----------------------------------------------
    if "Autumn Classic 2026" not in tournament_map:
        cursor.execute(
            "INSERT INTO Tournaments (name, description, start_date, end_date, location, status) VALUES (?, ?, ?, ?, ?, ?)",
            ("Autumn Classic 2026",
             "A prestigious autumn racing event with competitors from across the nation, featuring sprint and stamina races.",
             "2026-09-20", "2026-09-22", "Heritage Raceway", "COMPLETED")
        )
        print("  [TOURNAMENT] Inserted: Autumn Classic 2026")

    if "Winter Cup 2026" not in tournament_map:
        cursor.execute(
            "INSERT INTO Tournaments (name, description, start_date, end_date, location, status) VALUES (?, ?, ?, ?, ?, ?)",
            ("Winter Cup 2026",
             "The premier indoor winter racing competition held at the newly renovated National Equestrian Centre.",
             "2026-12-05", "2026-12-08", "National Equestrian Centre", "ACTIVE")
        )
        print("  [TOURNAMENT] Inserted: Winter Cup 2026")

    cursor.execute("SELECT name, id FROM Tournaments")
    tournament_map = {n: tid for n, tid in cursor.fetchall()}

    # -----------------------------------------------
    # 3. ROUNDS
    # -----------------------------------------------
    cursor.execute("SELECT tournament_id, name, id FROM Rounds")
    round_map = {(tid, n): rid for tid, n, rid in cursor.fetchall()}

    def ensure_round(t_name, r_name, seq):
        key = (tournament_map[t_name], r_name)
        if key not in round_map:
            cursor.execute(
                "INSERT INTO Rounds (tournament_id, name, sequence) VALUES (?, ?, ?)",
                (tournament_map[t_name], r_name, seq)
            )
            print(f"  [ROUND] {r_name} @ {t_name}")
        cursor.execute("SELECT tournament_id, name, id FROM Rounds")
        for tid, n, rid in cursor.fetchall():
            round_map[(tid, n)] = rid

    ensure_round("Autumn Classic 2026", "Qualifying Round", 1)
    ensure_round("Autumn Classic 2026", "Semi-Final",       2)
    ensure_round("Autumn Classic 2026", "Grand Final",      3)
    ensure_round("Winter Cup 2026",     "Qualifying Round", 1)
    ensure_round("Winter Cup 2026",     "Grand Final",      2)

    # -----------------------------------------------
    # 4. PRIZES
    # -----------------------------------------------
    cursor.execute("SELECT tournament_id, position FROM Prizes")
    existing_prizes = {(row[0], row[1]) for row in cursor.fetchall()}

    def ensure_prize(t_name, pos, title, value, desc):
        tid = tournament_map[t_name]
        if (tid, pos) not in existing_prizes:
            cursor.execute(
                "INSERT INTO Prizes (tournament_id, position, title, prize_value, description) VALUES (?, ?, ?, ?, ?)",
                (tid, pos, title, value, desc)
            )
            print(f"  [PRIZE] {title}")

    ensure_prize("Autumn Classic 2026", 1, "Autumn Classic Champion",    8000.00, "Gold Trophy + Prestige Medal + $8,000 Cash")
    ensure_prize("Autumn Classic 2026", 2, "Autumn Classic Runner-Up",   3000.00, "Silver Trophy + $3,000 Cash")
    ensure_prize("Autumn Classic 2026", 3, "Autumn Classic Third Place", 1500.00, "Bronze Trophy + $1,500 Cash")
    ensure_prize("Winter Cup 2026",     1, "Winter Cup Champion",       12000.00, "Grand Gold Trophy + Champion Sash + $12,000 Cash")
    ensure_prize("Winter Cup 2026",     2, "Winter Cup Runner-Up",       5000.00, "Silver Trophy + $5,000 Cash")
    ensure_prize("Winter Cup 2026",     3, "Winter Cup Third Place",     2500.00, "Bronze Trophy + $2,500 Cash")

    # -----------------------------------------------
    # 5. JOCKEY INVITATIONS
    # -----------------------------------------------
    cursor.execute("SELECT owner_id, jockey_id, horse_id, tournament_id FROM JockeyInvitations")
    existing_invites = {(row[0], row[1], row[2], row[3]) for row in cursor.fetchall()}

    def ensure_invite(owner_uname, jockey_uname, horse_name, t_name, msg, status):
        oid = owner_profile_map[user_map[owner_uname]]
        jid = jockey_profile_map[user_map[jockey_uname]]
        hid = horse_map[horse_name]
        tid = tournament_map[t_name]
        if (oid, jid, hid, tid) not in existing_invites:
            cursor.execute(
                "INSERT INTO JockeyInvitations (owner_id, jockey_id, horse_id, tournament_id, message, status) VALUES (?, ?, ?, ?, ?, ?)",
                (oid, jid, hid, tid, msg, status)
            )
            print(f"  [INVITE] {owner_uname} -> {jockey_uname} ({horse_name} @ {t_name})")

    # Autumn Classic invitations
    ensure_invite("owner1", "jockey1", "Golden Flash",  "Autumn Classic 2026",
                  "Apex Racing Stables invites Kevin Blake to ride Golden Flash at the Autumn Classic.", "ACCEPTED")
    ensure_invite("owner2", "jockey2", "Storm Breaker", "Autumn Classic 2026",
                  "Blue Ribbon invites Ryan Foster to ride Storm Breaker at the Autumn Classic.", "ACCEPTED")
    ensure_invite("owner3", "jockey3", "Blue Horizon",  "Autumn Classic 2026",
                  "Royal Equestrian Club invites Nathan Scott to ride Blue Horizon at the Autumn Classic.", "ACCEPTED")

    # Winter Cup invitations
    ensure_invite("owner1", "jockey2", "Night Fury",    "Winter Cup 2026",
                  "Apex Racing Stables invites Ryan Foster to ride Night Fury at the Winter Cup.", "ACCEPTED")
    ensure_invite("owner2", "jockey3", "Crimson Star",  "Winter Cup 2026",
                  "Blue Ribbon invites Nathan Scott to ride Crimson Star at the Winter Cup.", "ACCEPTED")
    ensure_invite("owner3", "jockey1", "Iron Will",     "Winter Cup 2026",
                  "Royal Equestrian Club invites Kevin Blake to ride Iron Will at the Winter Cup.", "ACCEPTED")

    # -----------------------------------------------
    # 6. REGISTRATIONS
    # -----------------------------------------------
    cursor.execute("SELECT tournament_id, horse_id, id FROM Registrations")
    registration_map = {(tid, hid): rid for tid, hid, rid in cursor.fetchall()}

    def ensure_registration(t_name, horse_name, jockey_uname, status="APPROVED"):
        tid = tournament_map[t_name]
        hid = horse_map[horse_name]
        jid = jockey_profile_map[user_map[jockey_uname]]
        if (tid, hid) not in registration_map:
            cursor.execute(
                "INSERT INTO Registrations (tournament_id, horse_id, jockey_id, status) VALUES (?, ?, ?, ?)",
                (tid, hid, jid, status)
            )
            print(f"  [REG] {horse_name} + {jockey_uname} @ {t_name}")
        cursor.execute("SELECT tournament_id, horse_id, id FROM Registrations")
        for t, h, r in cursor.fetchall():
            registration_map[(t, h)] = r

    ensure_registration("Autumn Classic 2026", "Golden Flash",  "jockey1")
    ensure_registration("Autumn Classic 2026", "Storm Breaker", "jockey2")
    ensure_registration("Autumn Classic 2026", "Blue Horizon",  "jockey3")
    ensure_registration("Winter Cup 2026",     "Night Fury",    "jockey2")
    ensure_registration("Winter Cup 2026",     "Crimson Star",  "jockey3")
    ensure_registration("Winter Cup 2026",     "Iron Will",     "jockey1")

    # -----------------------------------------------
    # 7. RACES
    # -----------------------------------------------
    cursor.execute("SELECT name, id FROM Races")
    race_map = {n: rid for n, rid in cursor.fetchall()}

    def ensure_race(round_t_name, round_name, race_name, race_time, track, dist, referee_uname, status):
        if race_name not in race_map:
            rnd_id = round_map[(tournament_map[round_t_name], round_name)]
            ref_id = referee_profile_map[user_map[referee_uname]]
            cursor.execute(
                "INSERT INTO Races (round_id, name, race_time, track_condition, distance, referee_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (rnd_id, race_name, race_time, track, dist, ref_id, status)
            )
            print(f"  [RACE] {race_name} ({status})")
        cursor.execute("SELECT name, id FROM Races")
        for n, rid in cursor.fetchall():
            race_map[n] = rid

    ensure_race("Autumn Classic 2026", "Qualifying Round",
                "Autumn Qualifying Sprint",   "2026-09-20 10:00:00", "Good",   1000, "referee2", "COMPLETED")
    ensure_race("Autumn Classic 2026", "Semi-Final",
                "Autumn Semi-Final",          "2026-09-21 14:00:00", "Good",   1200, "referee2", "COMPLETED")
    ensure_race("Autumn Classic 2026", "Grand Final",
                "Autumn Classic Grand Final", "2026-09-22 15:00:00", "Firm",   1600, "referee1", "COMPLETED")
    ensure_race("Winter Cup 2026", "Qualifying Round",
                "Winter Qualifying Heat",     "2026-12-05 11:00:00", "Indoor", 1000, "referee3", "SCHEDULED")
    ensure_race("Winter Cup 2026", "Grand Final",
                "Winter Cup Grand Final",     "2026-12-08 15:00:00", "Indoor", 1600, "referee1", "SCHEDULED")

    # -----------------------------------------------
    # 8. RACE PARTICIPANTS
    # -----------------------------------------------
    cursor.execute("""
        SELECT rp.id, r.name, h.name
        FROM RaceParticipants rp
        JOIN Races r ON rp.race_id = r.id
        JOIN Registrations reg ON rp.registration_id = reg.id
        JOIN Horses h ON reg.horse_id = h.id
    """)
    participant_map = {(rn, hn): pid for pid, rn, hn in cursor.fetchall()}

    def ensure_participant(race_name, t_name, horse_name, lane, status,
                           start_time=None, finish_time=None):
        key = (race_name, horse_name)
        if key not in participant_map:
            rid  = race_map[race_name]
            reg_id = registration_map[(tournament_map[t_name], horse_map[horse_name])]
            if start_time and finish_time:
                cursor.execute(
                    "INSERT INTO RaceParticipants (race_id, registration_id, lane_number, start_time, finish_time, status) VALUES (?, ?, ?, ?, ?, ?)",
                    (rid, reg_id, lane, start_time, finish_time, status)
                )
            else:
                cursor.execute(
                    "INSERT INTO RaceParticipants (race_id, registration_id, lane_number, status) VALUES (?, ?, ?, ?)",
                    (rid, reg_id, lane, status)
                )
            print(f"  [PARTICIPANT] {horse_name} in {race_name}")
        cursor.execute("""
            SELECT rp.id, r.name, h.name
            FROM RaceParticipants rp
            JOIN Races r ON rp.race_id = r.id
            JOIN Registrations reg ON rp.registration_id = reg.id
            JOIN Horses h ON reg.horse_id = h.id
        """)
        for pid, rn, hn in cursor.fetchall():
            participant_map[(rn, hn)] = pid

    # Autumn - Qualifying Sprint (COMPLETED)
    ensure_participant("Autumn Qualifying Sprint", "Autumn Classic 2026", "Golden Flash",
                       1, "FINISHED", "2026-09-20 10:00:00", "2026-09-20 10:01:00")
    ensure_participant("Autumn Qualifying Sprint", "Autumn Classic 2026", "Storm Breaker",
                       2, "FINISHED", "2026-09-20 10:00:00", "2026-09-20 10:01:03")
    ensure_participant("Autumn Qualifying Sprint", "Autumn Classic 2026", "Blue Horizon",
                       3, "FINISHED", "2026-09-20 10:00:00", "2026-09-20 10:01:06")
    # Autumn - Semi-Final (COMPLETED)
    ensure_participant("Autumn Semi-Final", "Autumn Classic 2026", "Golden Flash",
                       1, "FINISHED", "2026-09-21 14:00:00", "2026-09-21 14:01:10")
    ensure_participant("Autumn Semi-Final", "Autumn Classic 2026", "Storm Breaker",
                       2, "FINISHED", "2026-09-21 14:00:00", "2026-09-21 14:01:08")
    ensure_participant("Autumn Semi-Final", "Autumn Classic 2026", "Blue Horizon",
                       3, "FINISHED", "2026-09-21 14:00:00", "2026-09-21 14:01:12")
    # Autumn - Grand Final (COMPLETED)
    ensure_participant("Autumn Classic Grand Final", "Autumn Classic 2026", "Golden Flash",
                       1, "FINISHED", "2026-09-22 15:00:00", "2026-09-22 15:01:52")
    ensure_participant("Autumn Classic Grand Final", "Autumn Classic 2026", "Storm Breaker",
                       2, "FINISHED", "2026-09-22 15:00:00", "2026-09-22 15:01:48")
    ensure_participant("Autumn Classic Grand Final", "Autumn Classic 2026", "Blue Horizon",
                       3, "FINISHED", "2026-09-22 15:00:00", "2026-09-22 15:02:01")
    # Winter Cup - Qualifying (SCHEDULED)
    ensure_participant("Winter Qualifying Heat", "Winter Cup 2026", "Night Fury",   1, "REGISTERED")
    ensure_participant("Winter Qualifying Heat", "Winter Cup 2026", "Crimson Star", 2, "REGISTERED")
    ensure_participant("Winter Qualifying Heat", "Winter Cup 2026", "Iron Will",    3, "REGISTERED")
    # Winter Cup - Grand Final (SCHEDULED)
    ensure_participant("Winter Cup Grand Final",  "Winter Cup 2026", "Night Fury",  1, "REGISTERED")
    ensure_participant("Winter Cup Grand Final",  "Winter Cup 2026", "Crimson Star",2, "REGISTERED")
    ensure_participant("Winter Cup Grand Final",  "Winter Cup 2026", "Iron Will",   3, "REGISTERED")

    # -----------------------------------------------
    # 9. RESULTS (Autumn Classic - 3 races COMPLETED)
    # -----------------------------------------------
    cursor.execute("SELECT race_participant_id FROM Results")
    existing_results = {row[0] for row in cursor.fetchall()}

    def ensure_result(race_name, horse_name, rank, pts, notes):
        pid = participant_map.get((race_name, horse_name))
        if pid and pid not in existing_results:
            cursor.execute(
                "INSERT INTO Results (race_participant_id, rank, points, notes) VALUES (?, ?, ?, ?)",
                (pid, rank, pts, notes)
            )
            print(f"  [RESULT] {horse_name} Rank #{rank} in {race_name}")
            existing_results.add(pid)

    # Qualifying Sprint
    ensure_result("Autumn Qualifying Sprint", "Golden Flash",
                  1, 8, "Explosive start, maintained lead throughout the sprint course.")
    ensure_result("Autumn Qualifying Sprint", "Storm Breaker",
                  2, 5, "Strong performance, finished close behind the leader.")
    ensure_result("Autumn Qualifying Sprint", "Blue Horizon",
                  3, 3, "Consistent pace but unable to challenge the front two.")
    # Semi-Final
    ensure_result("Autumn Semi-Final", "Storm Breaker",
                  1, 8, "Tactical brilliance - bided time then unleashed in final 300m.")
    ensure_result("Autumn Semi-Final", "Golden Flash",
                  2, 5, "Led from the front but was overhauled in the final stretch.")
    ensure_result("Autumn Semi-Final", "Blue Horizon",
                  3, 3, "Ran well but lacked the pace to match the top two.")
    # Grand Final
    ensure_result("Autumn Classic Grand Final", "Storm Breaker",
                  1, 12, "Championship performance - dominated from start to finish. New track record!")
    ensure_result("Autumn Classic Grand Final", "Golden Flash",
                  2, 8, "Gallant effort, led briefly at the halfway mark before being passed.")
    ensure_result("Autumn Classic Grand Final", "Blue Horizon",
                  3, 5, "Solid third place finish, showed great stamina over the 1600m distance.")

    # -----------------------------------------------
    # 10. VIOLATIONS
    # -----------------------------------------------
    cursor.execute("SELECT race_participant_id FROM Violations")
    existing_violations = {row[0] for row in cursor.fetchall()}

    def ensure_violation(race_name, horse_name, desc, penalty, fine, v_date):
        pid = participant_map.get((race_name, horse_name))
        if pid and pid not in existing_violations:
            cursor.execute(
                "INSERT INTO Violations (race_participant_id, description, penalty, fine_amount, violation_date) VALUES (?, ?, ?, ?, ?)",
                (pid, desc, penalty, fine, v_date)
            )
            print(f"  [VIOLATION] {horse_name} in {race_name}")
            existing_violations.add(pid)

    ensure_violation("Autumn Classic Grand Final", "Golden Flash",
                     "Slight deviation from assigned lane in the final turn, causing minor obstruction to a competitor.",
                     "Official Warning", 200.00, "2026-09-22 15:10:00")

    # -----------------------------------------------
    # 11. RANKINGS
    # -----------------------------------------------
    cursor.execute("SELECT entity_type, entity_id FROM Rankings")
    existing_rankings = {(row[0], row[1]) for row in cursor.fetchall()}

    def ensure_ranking(etype, entity_id, pts, rnk):
        if (etype, entity_id) not in existing_rankings:
            cursor.execute(
                "INSERT INTO Rankings (entity_type, entity_id, points, rank) VALUES (?, ?, ?, ?)",
                (etype, entity_id, pts, rnk)
            )
            print(f"  [RANK] {etype} id={entity_id} pts={pts} rank={rnk}")
        else:
            cursor.execute(
                "UPDATE Rankings SET points = points + ?, rank = ? WHERE entity_type = ? AND entity_id = ?",
                (pts, rnk, etype, entity_id)
            )

    ensure_ranking("HORSE",  horse_map["Storm Breaker"],              25, 1)
    ensure_ranking("HORSE",  horse_map["Golden Flash"],               21, 2)
    ensure_ranking("HORSE",  horse_map["Blue Horizon"],               11, 3)
    ensure_ranking("JOCKEY", jockey_profile_map[user_map["jockey2"]], 25, 1)
    ensure_ranking("JOCKEY", jockey_profile_map[user_map["jockey1"]], 21, 2)
    ensure_ranking("JOCKEY", jockey_profile_map[user_map["jockey3"]], 11, 3)

    # -----------------------------------------------
    # 12. AWARDS (Autumn Classic 2026 - COMPLETED)
    # -----------------------------------------------
    cursor.execute("SELECT prize_id FROM Awards")
    existing_award_prizes = {row[0] for row in cursor.fetchall()}

    cursor.execute(
        "SELECT position, id FROM Prizes WHERE tournament_id = ?",
        (tournament_map["Autumn Classic 2026"],)
    )
    autumn_prize_map = {pos: pid for pos, pid in cursor.fetchall()}

    def ensure_award(prize_pos, t_name, horse_name, pts, notes):
        prize_id = autumn_prize_map.get(prize_pos)
        if prize_id and prize_id not in existing_award_prizes:
            reg_id = registration_map.get((tournament_map[t_name], horse_map[horse_name]))
            if reg_id:
                cursor.execute(
                    "INSERT INTO Awards (prize_id, registration_id, total_points, notes) VALUES (?, ?, ?, ?)",
                    (prize_id, reg_id, pts, notes)
                )
                print(f"  [AWARD] {horse_name} pos={prize_pos} @ {t_name}")
                existing_award_prizes.add(prize_id)

    ensure_award(1, "Autumn Classic 2026", "Storm Breaker", 25,
                 "Auto-awarded 1st place - Autumn Classic 2026 Grand Final Champion.")
    ensure_award(2, "Autumn Classic 2026", "Golden Flash",  21,
                 "Auto-awarded 2nd place - Autumn Classic 2026.")
    ensure_award(3, "Autumn Classic 2026", "Blue Horizon",  11,
                 "Auto-awarded 3rd place - Autumn Classic 2026.")

    # -----------------------------------------------
    # 13. PREDICTIONS (Winter Cup - SCHEDULED, de Spectators test du doan)
    # -----------------------------------------------
    cursor.execute("SELECT user_id, race_participant_id FROM Predictions")
    existing_preds = {(row[0], row[1]) for row in cursor.fetchall()}

    def ensure_prediction(user_uname, race_name, horse_name, predicted_rank, status):
        uid = user_map.get(user_uname)
        pid = participant_map.get((race_name, horse_name))
        if uid and pid and (uid, pid) not in existing_preds:
            cursor.execute(
                "INSERT INTO Predictions (user_id, race_participant_id, predicted_rank, status) VALUES (?, ?, ?, ?)",
                (uid, pid, predicted_rank, status)
            )
            print(f"  [PREDICTION] {user_uname} -> {horse_name} rank {predicted_rank}")
            existing_preds.add((uid, pid))

    ensure_prediction("spectator1", "Winter Qualifying Heat", "Night Fury",   1, "PENDING")
    ensure_prediction("spectator1", "Winter Qualifying Heat", "Iron Will",    3, "PENDING")
    ensure_prediction("spectator2", "Winter Qualifying Heat", "Crimson Star", 1, "PENDING")
    ensure_prediction("spectator2", "Winter Cup Grand Final", "Iron Will",    1, "PENDING")

    # -----------------------------------------------
    cursor.close()
    conn.close()
    print("\n[DONE] Extra seed data inserted successfully!")
    print("  Summary:")
    print("  - 6 new horses added")
    print("  - Autumn Classic 2026 (COMPLETED): 3 rounds, 3 races, 9 results, 1 violation, 3 awards")
    print("  - Winter Cup 2026 (ACTIVE): 2 rounds, 2 races SCHEDULED")
    print("  - 6 JockeyInvitations (ACCEPTED)")
    print("  - 4 Predictions for spectators (PENDING - Winter Cup)")
    print("  - Rankings updated for all horses and jockeys")

if __name__ == "__main__":
    main()
