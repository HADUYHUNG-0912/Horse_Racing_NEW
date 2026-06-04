"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../api";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const router = useRouter();

  // Common data states
  const [tournaments, setTournaments] = useState([]);
  const [horses, setHorses] = useState([]);
  const [jockeys, setJockeys] = useState([]);
  const [races, setRaces] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [referees, setReferees] = useState([]);

  // Form states
  const [newTournament, setNewTournament] = useState({ name: "", description: "", start_date: "", end_date: "", location: "" });
  const [newHorse, setNewHorse] = useState({ name: "", age: "", breed: "", gender: "Stallion" });
  const [newInvitation, setNewInvitation] = useState({ jockey_id: "", horse_id: "", tournament_id: "", message: "" });
  const [newRace, setNewRace] = useState({ round_id: "", name: "", race_time: "", track_condition: "Good", distance: "1200", referee_id: "" });
  const [newParticipant, setNewParticipant] = useState({ race_id: "", registration_id: "", lane_number: "" });
  const [newRound, setNewRound] = useState({ tournament_id: "", name: "", sequence: "1" });
  const [selectedRace, setSelectedRace] = useState(null);
  const [resultsForm, setResultsForm] = useState([]); // Array of { race_participant_id, rank, points, notes }
  const [violationForm, setViolationForm] = useState({ race_participant_id: "", description: "", penalty: "Warning", fine_amount: "0" });
  const [predictionForm, setPredictionForm] = useState({ race_participant_id: "", predicted_rank: "1" });

  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const u = await api.getMe();
        setUser(u);
        setLoading(false);
        
        // Determine default tab based on role
        if (u.role_name === "ADMIN") setActiveTab("tournaments");
        else if (u.role_name === "OWNER") setActiveTab("my-horses");
        else if (u.role_name === "JOCKEY") setActiveTab("invitations");
        else if (u.role_name === "REFEREE") setActiveTab("assigned-races");
        else if (u.role_name === "SPECTATOR") setActiveTab("predictions");

        // Load baseline data
        loadData(u.role_name);
      } catch (err) {
        console.error("Auth failed:", err);
        router.push("/login");
      }
    };
    checkAuthAndLoad();
  }, []);

  const loadData = async (roleName) => {
    try {
      const tours = await api.get("/tournaments");
      setTournaments(tours);

      const rankList = await api.get("/results/rankings");
      setRankings(rankList);

      const allRaces = await api.get("/races");
      setRaces(allRaces);

      if (roleName === "ADMIN") {
        const listJockeys = await api.get("/jockeys");
        setJockeys(listJockeys);
        // Find Referees
        const listReferees = [];
        const uList = await api.get("/jockeys"); // Dummy pull or filter from other listings. Let's make a mock or list of users with referee profile
        // Actually, we can get list of all users and filter by role, or fetch from a helper
        // Since we seeded referee1 & referee2, we can fetch all races to find referee profiles, or list jockeys which lists profiles
        // For local simplicity, we can fetch referees using a custom list
        setReferees([
          { id: 1, name: "John Referee" },
          { id: 2, name: "David Referee" }
        ]);
      }

      if (roleName === "OWNER") {
        const myHorses = await api.get("/horses");
        setHorses(myHorses);
        const listJockeys = await api.get("/jockeys");
        setJockeys(listJockeys);
        const invites = await api.get("/jockeys/invitations");
        setInvitations(invites);
      }

      if (roleName === "JOCKEY") {
        const invites = await api.get("/jockeys/invitations");
        setInvitations(invites);
      }

      if (roleName === "SPECTATOR") {
        const preds = await api.get("/spectators/predictions");
        setPredictions(preds);
      }
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleLogout = () => {
    api.logout();
    router.push("/");
  };

  // --- ACTIONS ---

  // Admin Actions
  const createTournament = async (e) => {
    e.preventDefault();
    try {
      await api.post("/tournaments/", newTournament);
      showMsg("Tạo giải đấu thành công!");
      setNewTournament({ name: "", description: "", start_date: "", end_date: "", location: "" });
      loadData(user.role_name);
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const createRound = async (e) => {
    e.preventDefault();
    if (!newRound.tournament_id) return showMsg("Vui lòng chọn giải đấu", "error");
    try {
      await api.post(`/tournaments/${newRound.tournament_id}/rounds`, {
        name: newRound.name,
        sequence: parseInt(newRound.sequence)
      });
      showMsg("Tạo vòng đấu thành công!");
      setNewRound({ tournament_id: "", name: "", sequence: "1" });
      loadData(user.role_name);
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const createRace = async (e) => {
    e.preventDefault();
    if (!newRace.round_id) return showMsg("Vui lòng chọn vòng đấu", "error");
    try {
      await api.post(`/races/rounds/${newRace.round_id}/races`, {
        name: newRace.name,
        race_time: newRace.race_time,
        track_condition: newRace.track_condition,
        distance: parseInt(newRace.distance),
        referee_id: newRace.referee_id ? parseInt(newRace.referee_id) : null
      });
      showMsg("Tạo trận đua thành công!");
      setNewRace({ round_id: "", name: "", race_time: "", track_condition: "Good", distance: "1200", referee_id: "" });
      loadData(user.role_name);
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const addParticipant = async (e) => {
    e.preventDefault();
    if (!newParticipant.race_id || !newParticipant.registration_id) return showMsg("Vui lòng nhập đầy đủ thông tin", "error");
    try {
      await api.post(`/races/${newParticipant.race_id}/participants`, {
        registration_id: parseInt(newParticipant.registration_id),
        lane_number: parseInt(newParticipant.lane_number)
      });
      showMsg("Thêm ngựa vào đường đua thành công!");
      setNewParticipant({ race_id: "", registration_id: "", lane_number: "" });
      loadData(user.role_name);
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const approveRegistration = async (regId, status) => {
    try {
      await api.put(`/tournaments/registrations/${regId}`, { status });
      showMsg(`Đã ${status === "APPROVED" ? "phê duyệt" : "từ chối"} đăng ký!`);
      loadData(user.role_name);
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  // Owner Actions
  const createHorse = async (e) => {
    e.preventDefault();
    try {
      await api.post("/horses/", {
        ...newHorse,
        age: parseInt(newHorse.age)
      });
      showMsg("Thêm ngựa thành công!");
      setNewHorse({ name: "", age: "", breed: "", gender: "Stallion" });
      loadData(user.role_name);
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const registerForTournament = async (tournamentId, horseId, jockeyId) => {
    try {
      await api.post(`/tournaments/${tournamentId}/register`, {
        tournament_id: tournamentId,
        horse_id: horseId,
        jockey_id: jockeyId
      });
      showMsg("Đã gửi đơn đăng ký tham gia giải đấu!");
      loadData(user.role_name);
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const sendJockeyInvitation = async (e) => {
    e.preventDefault();
    try {
      await api.post("/jockeys/invite", {
        jockey_id: parseInt(newInvitation.jockey_id),
        horse_id: parseInt(newInvitation.horse_id),
        tournament_id: parseInt(newInvitation.tournament_id),
        message: newInvitation.message
      });
      showMsg("Đã gửi lời mời tới Jockey!");
      setNewInvitation({ jockey_id: "", horse_id: "", tournament_id: "", message: "" });
      loadData(user.role_name);
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  // Jockey Actions
  const respondInvitation = async (id, status) => {
    try {
      await api.put(`/jockeys/invitations/${id}`, { status });
      showMsg(status === "ACCEPTED" ? "Đã chấp nhận lời mời!" : "Đã từ chối lời mời.");
      loadData(user.role_name);
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  // Referee Actions
  const initResultsForm = (race) => {
    setSelectedRace(race);
    setResultsForm(
      race.participants.map((p) => ({
        race_participant_id: p.id,
        horse_name: p.horse_name,
        rank: 1,
        points: 10,
        notes: ""
      }))
    );
  };

  const submitResults = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/results/${selectedRace.id}/results`, resultsForm.map(({ race_participant_id, rank, points, notes }) => ({
        race_participant_id,
        rank: parseInt(rank),
        points: parseInt(points),
        notes
      })));
      showMsg("Ghi nhận kết quả cuộc đua thành công!");
      setSelectedRace(null);
      loadData(user.role_name);
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const submitViolation = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/results/${selectedRace.id}/violations`, {
        race_participant_id: parseInt(violationForm.race_participant_id),
        description: violationForm.description,
        penalty: violationForm.penalty,
        fine_amount: parseFloat(violationForm.fine_amount)
      });
      showMsg("Báo cáo vi phạm thành công!");
      setViolationForm({ race_participant_id: "", description: "", penalty: "Warning", fine_amount: "0" });
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  // Spectator Actions
  const makePrediction = async (e) => {
    e.preventDefault();
    try {
      await api.post("/spectators/predictions", {
        race_participant_id: parseInt(predictionForm.race_participant_id),
        predicted_rank: parseInt(predictionForm.predicted_rank)
      });
      showMsg("Dự đoán thành công!");
      setPredictionForm({ race_participant_id: "", predicted_rank: "1" });
      loadData(user.role_name);
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  if (loading) {
    return <div style={styles.loading}>Đang tải trang điều khiển...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Top Navbar */}
      <header style={styles.header} className="glass">
        <div style={styles.brand}>
          <span style={{ fontSize: "24px" }}>🏇</span>
          <span style={styles.brandText}>DASHBOARD</span>
        </div>
        <div style={styles.userProfile}>
          <span style={styles.userInfo}>
            <span style={styles.userName}>{user.full_name}</span>
            <span className="badge badge-info" style={{ fontSize: "10px" }}>{user.role_name}</span>
          </span>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "13px" }}>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Action Banner */}
      {message.text && (
        <div style={{
          ...styles.banner,
          backgroundColor: message.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
          borderColor: message.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)",
          color: message.type === "error" ? "var(--danger)" : "var(--success)"
        }}>
          {message.text}
        </div>
      )}

      {/* Main Grid: Sidebar + Workspace */}
      <div style={styles.mainGrid}>
        
        {/* Sidebar Nav */}
        <nav style={styles.sidebar} className="glass">
          {/* Admin Tabs */}
          {user.role_name === "ADMIN" && (
            <>
              <button style={activeTab === "tournaments" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("tournaments")}>
                🏆 Quản lý Giải đấu
              </button>
              <button style={activeTab === "registrations" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("registrations")}>
                📋 Xét duyệt Đăng ký
              </button>
              <button style={activeTab === "races" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("races")}>
                🏁 Lập lịch Trận đua
              </button>
            </>
          )}

          {/* Owner Tabs */}
          {user.role_name === "OWNER" && (
            <>
              <button style={activeTab === "my-horses" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("my-horses")}>
                🐎 Quản lý Ngựa
              </button>
              <button style={activeTab === "invite-jockey" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("invite-jockey")}>
                ✉️ Mời Jockey
              </button>
              <button style={activeTab === "register-tournament" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("register-tournament")}>
                🏆 Đăng ký Giải đấu
              </button>
            </>
          )}

          {/* Jockey Tabs */}
          {user.role_name === "JOCKEY" && (
            <>
              <button style={activeTab === "invitations" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("invitations")}>
                ✉️ Lời mời Nhận được
              </button>
              <button style={activeTab === "jockey-races" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("jockey-races")}>
                🏁 Lịch trình Đua
              </button>
            </>
          )}

          {/* Referee Tabs */}
          {user.role_name === "REFEREE" && (
            <>
              <button style={activeTab === "assigned-races" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("assigned-races")}>
                🏁 Trận đua phân công
              </button>
            </>
          )}

          {/* Spectator Tabs */}
          {user.role_name === "SPECTATOR" && (
            <>
              <button style={activeTab === "predictions" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("predictions")}>
                🔮 Dự đoán Trận đua
              </button>
            </>
          )}

          {/* Common Leaderboard tab */}
          <div style={{ borderTop: "1px solid var(--card-border)", margin: "10px 0", paddingTop: "10px" }} />
          <button style={activeTab === "leaderboard" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("leaderboard")}>
            ⭐ Bảng Xếp Hạng
          </button>
        </nav>

        {/* Work Area */}
        <main style={styles.workspace} className="glass">
          
          {/* TAB: Quản lý Giải đấu (Admin) */}
          {activeTab === "tournaments" && user.role_name === "ADMIN" && (
            <div style={styles.tabContent}>
              <h2>🏆 Quản lý Giải đấu và Vòng đấu</h2>
              <div style={styles.splitLayout}>
                {/* Create Tournament */}
                <form onSubmit={createTournament} style={styles.formPanel} className="glass">
                  <h3>Tạo Giải Đấu Mới</h3>
                  <div className="form-group">
                    <label>Tên giải đấu</label>
                    <input type="text" className="input-field" placeholder="Ví dụ: Golden Cup 2026" required
                      value={newTournament.name} onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Mô tả</label>
                    <textarea className="input-field" placeholder="Chi tiết giải đấu..."
                      value={newTournament.description} onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })} />
                  </div>
                  <div style={styles.row}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Ngày bắt đầu</label>
                      <input type="date" className="input-field" required
                        value={newTournament.start_date} onChange={(e) => setNewTournament({ ...newTournament, start_date: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Ngày kết thúc</label>
                      <input type="date" className="input-field" required
                        value={newTournament.end_date} onChange={(e) => setNewTournament({ ...newTournament, end_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Địa điểm</label>
                    <input type="text" className="input-field" placeholder="Ví dụ: Royal Track Arena" required
                      value={newTournament.location} onChange={(e) => setNewTournament({ ...newTournament, location: e.target.value })} />
                  </div>
                  <button type="submit" className="btn-primary">Tạo Giải Đấu</button>
                </form>

                {/* Create Round */}
                <form onSubmit={createRound} style={styles.formPanel} className="glass">
                  <h3>Thêm Vòng Đấu</h3>
                  <div className="form-group">
                    <label>Chọn giải đấu</label>
                    <select className="input-field" required
                      value={newRound.tournament_id} onChange={(e) => setNewRound({ ...newRound, tournament_id: e.target.value })}>
                      <option value="">-- Chọn giải đấu --</option>
                      {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tên vòng đấu</label>
                    <input type="text" className="input-field" placeholder="Ví dụ: Bán kết, Chung kết" required
                      value={newRound.name} onChange={(e) => setNewRound({ ...newRound, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Thứ tự vòng (Sequence)</label>
                    <input type="number" className="input-field" required
                      value={newRound.sequence} onChange={(e) => setNewRound({ ...newRound, sequence: e.target.value })} />
                  </div>
                  <button type="submit" className="btn-primary">Thêm Vòng Đấu</button>
                </form>
              </div>

              {/* Tournament List */}
              <div style={{ marginTop: "24px" }}>
                <h3>Danh sách Giải đấu hiện tại</h3>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tên giải đấu</th>
                        <th>Địa điểm</th>
                        <th>Thời gian</th>
                        <th>Số vòng đấu</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournaments.map(t => (
                        <tr key={t.id}>
                          <td>{t.id}</td>
                          <td style={{ fontWeight: "700" }}>{t.name}</td>
                          <td>{t.location}</td>
                          <td>{t.start_date} đến {t.end_date}</td>
                          <td>{t.rounds.length} vòng</td>
                          <td><span className="badge badge-info">{t.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Xét duyệt Đăng ký (Admin) */}
          {activeTab === "registrations" && user.role_name === "ADMIN" && (
            <div style={styles.tabContent}>
              <h2>📋 Danh sách và Xét duyệt Đăng ký thi đấu</h2>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Giải đấu</th>
                      <th>Ngựa đua</th>
                      <th>Jockey</th>
                      <th>Trạng thái đăng ký</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournaments.map(t => {
                      const [regs, setRegs] = useState([]);
                      useEffect(() => {
                        api.get(`/tournaments/${t.id}/registrations`).then(setRegs).catch(console.error);
                      }, [tournaments]);

                      if (regs.length === 0) return null;
                      return regs.map(r => (
                        <tr key={r.id}>
                          <td>{t.name}</td>
                          <td style={{ fontWeight: "700" }}>{r.horse_name}</td>
                          <td>{r.jockey_name}</td>
                          <td>
                            <span className={`badge ${r.status === "APPROVED" ? "badge-approved" : r.status === "PENDING" ? "badge-pending" : "badge-rejected"}`}>
                              {r.status}
                            </span>
                          </td>
                          <td>
                            {r.status === "PENDING" && (
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button className="btn-primary" style={{ padding: "4px 8px", fontSize: "12px" }}
                                  onClick={() => approveRegistration(r.id, "APPROVED")}>Duyệt</button>
                                <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: "12px", color: "var(--danger)" }}
                                  onClick={() => approveRegistration(r.id, "REJECTED")}>Từ chối</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Lập lịch Trận đua (Admin) */}
          {activeTab === "races" && user.role_name === "ADMIN" && (
            <div style={styles.tabContent}>
              <h2>🏁 Lập lịch Trận đua và Xếp làn</h2>
              <div style={styles.splitLayout}>
                {/* Create Race */}
                <form onSubmit={createRace} style={styles.formPanel} className="glass">
                  <h3>Tạo Trận Đua</h3>
                  <div className="form-group">
                    <label>Chọn Vòng đấu</label>
                    <select className="input-field" required
                      value={newRace.round_id} onChange={(e) => setNewRace({ ...newRace, round_id: e.target.value })}>
                      <option value="">-- Chọn vòng đấu --</option>
                      {tournaments.map(t => (
                        t.rounds.map(r => (
                          <option key={r.id} value={r.id}>{t.name} - {r.name}</option>
                        ))
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tên trận đua</label>
                    <input type="text" className="input-field" placeholder="Ví dụ: Heat 1, Chung kết chính thức" required
                      value={newRace.name} onChange={(e) => setNewRace({ ...newRace, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Thời gian diễn ra</label>
                    <input type="datetime-local" className="input-field" required
                      value={newRace.race_time} onChange={(e) => setNewRace({ ...newRace, race_time: e.target.value })} />
                  </div>
                  <div style={styles.row}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Điều kiện sân bãi</label>
                      <input type="text" className="input-field" placeholder="Ví dụ: Good, Wet" required
                        value={newRace.track_condition} onChange={(e) => setNewRace({ ...newRace, track_condition: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Khoảng cách (mét)</label>
                      <input type="number" className="input-field" required
                        value={newRace.distance} onChange={(e) => setNewRace({ ...newRace, distance: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Phân công trọng tài</label>
                    <select className="input-field"
                      value={newRace.referee_id} onChange={(e) => setNewRace({ ...newRace, referee_id: e.target.value })}>
                      <option value="">-- Không phân công / Phân công sau --</option>
                      {referees.map(ref => <option key={ref.id} value={ref.id}>{ref.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="btn-primary">Tạo Trận Đua</button>
                </form>

                {/* Add participant / Xếp làn */}
                <form onSubmit={addParticipant} style={styles.formPanel} className="glass">
                  <h3>Xếp Làn Cho Ngựa Đua</h3>
                  <div className="form-group">
                    <label>Chọn trận đua</label>
                    <select className="input-field" required
                      value={newParticipant.race_id} onChange={(e) => setNewParticipant({ ...newParticipant, race_id: e.target.value })}>
                      <option value="">-- Chọn trận đua --</option>
                      {races.map(rc => <option key={rc.id} value={rc.id}>{rc.name} ({rc.race_time})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Chọn Cặp Ngựa - Jockey đã được duyệt</label>
                    <select className="input-field" required
                      value={newParticipant.registration_id} onChange={(e) => setNewParticipant({ ...newParticipant, registration_id: e.target.value })}>
                      <option value="">-- Chọn đăng ký --</option>
                      {tournaments.map(t => {
                        const [regs, setRegs] = useState([]);
                        useEffect(() => {
                          api.get(`/tournaments/${t.id}/registrations`).then(setRegs).catch(console.error);
                        }, [tournaments]);

                        return regs.filter(r => r.status === "APPROVED").map(r => (
                          <option key={r.id} value={r.id}>{t.name}: {r.horse_name} (Jockey: {r.jockey_name})</option>
                        ));
                      })}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Làn số (Lane Number)</label>
                    <input type="number" className="input-field" placeholder="1-8" required
                      value={newParticipant.lane_number} onChange={(e) => setNewParticipant({ ...newParticipant, lane_number: e.target.value })} />
                  </div>
                  <button type="submit" className="btn-primary">Xếp vào đường đua</button>
                </form>
              </div>

              {/* Race schedules list */}
              <div style={{ marginTop: "24px" }}>
                <h3>Lịch thi đấu các trận đua hiện tại</h3>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th>Trận đua</th>
                        <th>Thời gian</th>
                        <th>Khoảng cách</th>
                        <th>Điều kiện</th>
                        <th>Trọng tài</th>
                        <th>Số ngựa thi đấu</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {races.map(rc => (
                        <tr key={rc.id}>
                          <td style={{ fontWeight: "700" }}>{rc.name}</td>
                          <td>{rc.race_time}</td>
                          <td>{rc.distance}m</td>
                          <td>{rc.track_condition}</td>
                          <td>{rc.referee_name || "Chưa phân công"}</td>
                          <td>{rc.participants.length} cặp</td>
                          <td>
                            <span className={`badge ${rc.status === "COMPLETED" ? "badge-approved" : "badge-pending"}`}>
                              {rc.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Quản lý Ngựa (Owner) */}
          {activeTab === "my-horses" && user.role_name === "OWNER" && (
            <div style={styles.tabContent}>
              <h2>🐎 Quản lý danh sách ngựa đua của bạn</h2>
              <div style={styles.splitLayout}>
                {/* Create Horse */}
                <form onSubmit={createHorse} style={styles.formPanel} className="glass" style={{ flex: 1 }}>
                  <h3>Đăng Ký Ngựa Mới</h3>
                  <div className="form-group">
                    <label>Tên ngựa đua</label>
                    <input type="text" className="input-field" placeholder="Ví dụ: Thunderbolt II" required
                      value={newHorse.name} onChange={(e) => setNewHorse({ ...newHorse, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Tuổi</label>
                    <input type="number" className="input-field" placeholder="Ví dụ: 4" required
                      value={newHorse.age} onChange={(e) => setNewHorse({ ...newHorse, age: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Giống ngựa</label>
                    <input type="text" className="input-field" placeholder="Thoroughbred, Arabian..." required
                      value={newHorse.breed} onChange={(e) => setNewHorse({ ...newHorse, breed: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Giới tính</label>
                    <select className="input-field"
                      value={newHorse.gender} onChange={(e) => setNewHorse({ ...newHorse, gender: e.target.value })}>
                      <option value="Stallion">Stallion (Ngựa đực)</option>
                      <option value="Mare">Mare (Ngựa cái)</option>
                      <option value="Gelding">Gelding (Ngựa thiến)</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary">Đăng ký Ngựa</button>
                </form>

                {/* Horse List */}
                <div style={{ flex: 1.5 }}>
                  <h3>Ngựa đua đã sở hữu</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>Tên ngựa</th>
                          <th>Tuổi</th>
                          <th>Giống</th>
                          <th>Giới tính</th>
                        </tr>
                      </thead>
                      <tbody>
                        {horses.length === 0 ? (
                          <tr><td colSpan="4" style={{ textAlign: "center", color: "#64748b" }}>Chưa có ngựa đua nào được đăng ký</td></tr>
                        ) : (
                          horses.map(h => (
                            <tr key={h.id}>
                              <td style={{ fontWeight: "700" }}>{h.name}</td>
                              <td>{h.age} tuổi</td>
                              <td>{h.breed}</td>
                              <td>{h.gender}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Mời Jockey (Owner) */}
          {activeTab === "invite-jockey" && user.role_name === "OWNER" && (
            <div style={styles.tabContent}>
              <h2>✉️ Mời Jockey lái ngựa thi đấu</h2>
              <div style={styles.splitLayout}>
                {/* Send invitation */}
                <form onSubmit={sendJockeyInvitation} style={styles.formPanel} className="glass">
                  <h3>Gửi Lời Mời Mới</h3>
                  <div className="form-group">
                    <label>Chọn Jockey</label>
                    <select className="input-field" required
                      value={newInvitation.jockey_id} onChange={(e) => setNewInvitation({ ...newInvitation, jockey_id: e.target.value })}>
                      <option value="">-- Chọn Jockey --</option>
                      {jockeys.map(j => (
                        <option key={j.id} value={j.id}>{j.user_id} - Kinh nghiệm: {j.experience_years} năm</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Chọn Ngựa đua</label>
                    <select className="input-field" required
                      value={newInvitation.horse_id} onChange={(e) => setNewInvitation({ ...newInvitation, horse_id: e.target.value })}>
                      <option value="">-- Chọn Ngựa --</option>
                      {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Chọn Giải đấu</label>
                    <select className="input-field" required
                      value={newInvitation.tournament_id} onChange={(e) => setNewInvitation({ ...newInvitation, tournament_id: e.target.value })}>
                      <option value="">-- Chọn Giải đấu --</option>
                      {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tin nhắn gửi kèm</label>
                    <textarea className="input-field" placeholder="Mời tham gia giải đua..."
                      value={newInvitation.message} onChange={(e) => setNewInvitation({ ...newInvitation, message: e.target.value })} />
                  </div>
                  <button type="submit" className="btn-primary">Gửi Lời Mời</button>
                </form>

                {/* Invitation lists sent */}
                <div style={{ flex: 1.2 }}>
                  <h3>Trạng thái lời mời đã gửi</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>Jockey</th>
                          <th>Ngựa</th>
                          <th>Giải đấu</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invitations.map(i => (
                          <tr key={i.id}>
                            <td>Jockey #{i.jockey_id}</td>
                            <td style={{ fontWeight: "700" }}>Ngựa #{i.horse_id}</td>
                            <td>Giải đấu #{i.tournament_id}</td>
                            <td>
                              <span className={`badge ${i.status === "ACCEPTED" ? "badge-approved" : i.status === "PENDING" ? "badge-pending" : "badge-rejected"}`}>
                                {i.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Đăng ký Giải đấu (Owner) */}
          {activeTab === "register-tournament" && user.role_name === "OWNER" && (
            <div style={styles.tabContent}>
              <h2>🏆 Đăng ký Ngựa và Jockey tham gia Giải đấu</h2>
              <p style={{ color: "#94a3b8", marginBottom: "16px" }}>Chỉ đăng ký được các giải đấu sắp diễn ra bằng cách sử dụng các Jockey đã CHẤP NHẬN lời mời lái ngựa của bạn.</p>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Tên giải đấu</th>
                      <th>Địa điểm</th>
                      <th>Thời gian</th>
                      <th>Cặp đăng ký khả dụng</th>
                      <th>Đăng ký thi đấu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournaments.map(t => {
                      // Filter invitations that were ACCEPTED for this tournament
                      const acceptedInvites = invitations.filter(i => i.tournament_id === t.id && i.status === "ACCEPTED");

                      return (
                        <tr key={t.id}>
                          <td style={{ fontWeight: "700" }}>{t.name}</td>
                          <td>{t.location}</td>
                          <td>{t.start_date} đến {t.end_date}</td>
                          <td>
                            {acceptedInvites.length === 0 ? (
                              <span style={{ color: "#64748b", fontSize: "13px" }}>Cần mời và được Jockey đồng ý trước</span>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {acceptedInvites.map(inv => (
                                  <div key={inv.id} style={{ fontSize: "13px" }}>
                                    🏇 Ngựa #{inv.horse_id} & Jockey #{inv.jockey_id}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            {acceptedInvites.map(inv => (
                              <button
                                key={inv.id}
                                className="btn-primary"
                                style={{ padding: "6px 12px", fontSize: "12px", marginBottom: "4px" }}
                                onClick={() => registerForTournament(t.id, inv.horse_id, inv.jockey_id)}
                              >
                                Đăng ký cặp #{inv.horse_id}
                              </button>
                            ))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Lời mời Nhận được (Jockey) */}
          {activeTab === "invitations" && user.role_name === "JOCKEY" && (
            <div style={styles.tabContent}>
              <h2>✉️ Hộp thư lời mời nhận được từ các Chủ ngựa</h2>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Chủ ngựa</th>
                      <th>Ngựa đua</th>
                      <th>Giải đấu</th>
                      <th>Tin nhắn</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: "center", color: "#64748b" }}>Không tìm thấy lời mời nào</td></tr>
                    ) : (
                      invitations.map(inv => (
                        <tr key={inv.id}>
                          <td>Chủ ngựa #{inv.owner_id}</td>
                          <td style={{ fontWeight: "700" }}>Ngựa #{inv.horse_id}</td>
                          <td>Giải đấu #{inv.tournament_id}</td>
                          <td>{inv.message || "-"}</td>
                          <td>
                            <span className={`badge ${inv.status === "ACCEPTED" ? "badge-approved" : inv.status === "PENDING" ? "badge-pending" : "badge-rejected"}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td>
                            {inv.status === "PENDING" && (
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px" }}
                                  onClick={() => respondInvitation(inv.id, "ACCEPTED")}>Đồng ý</button>
                                <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", color: "var(--danger)" }}
                                  onClick={() => respondInvitation(inv.id, "REJECTED")}>Từ chối</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Lịch trình Đua (Jockey) */}
          {activeTab === "jockey-races" && user.role_name === "JOCKEY" && (
            <div style={styles.tabContent}>
              <h2>🏁 Lịch trình các trận đua đã đăng ký</h2>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Trận đua</th>
                      <th>Thời gian đua</th>
                      <th>Khoảng cách</th>
                      <th>Đường chạy</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {races.filter(r => r.participants.some(p => p.jockey_name === user.full_name)).map(rc => (
                      <tr key={rc.id}>
                        <td style={{ fontWeight: "700" }}>{rc.name}</td>
                        <td>{rc.race_time}</td>
                        <td>{rc.distance}m</td>
                        <td>{rc.track_condition}</td>
                        <td>
                          <span className={`badge ${rc.status === "COMPLETED" ? "badge-approved" : "badge-pending"}`}>
                            {rc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Trận đua phân công (Referee) */}
          {activeTab === "assigned-races" && user.role_name === "REFEREE" && (
            <div style={styles.tabContent}>
              <h2>🏁 Các trận đua được phân công giám sát</h2>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Tên trận đua</th>
                      <th>Thời gian</th>
                      <th>Khoảng cách</th>
                      <th>Điều kiện chạy</th>
                      <th>Số ngựa tham gia</th>
                      <th>Trạng thái</th>
                      <th>Ghi kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {races.filter(rc => rc.referee_name === user.full_name).map(rc => (
                      <tr key={rc.id}>
                        <td style={{ fontWeight: "700" }}>{rc.name}</td>
                        <td>{rc.race_time}</td>
                        <td>{rc.distance}m</td>
                        <td>{rc.track_condition}</td>
                        <td>{rc.participants.length}</td>
                        <td>
                          <span className={`badge ${rc.status === "COMPLETED" ? "badge-approved" : "badge-pending"}`}>
                            {rc.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => initResultsForm(rc)}>
                            {rc.status === "COMPLETED" ? "Sửa kết quả" : "Nhập kết quả"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Enter Results Overlay Panel */}
              {selectedRace && (
                <div style={{ marginTop: "32px", borderTop: "1px solid var(--card-border)", paddingTop: "24px" }}>
                  <h2>📝 Nhập kết quả & Vi phạm cho trận: <span style={{ color: "var(--primary)" }}>{selectedRace.name}</span></h2>
                  
                  <div style={styles.splitLayout}>
                    {/* Results Form */}
                    <form onSubmit={submitResults} style={styles.formPanel} className="glass" style={{ flex: 1.5 }}>
                      <h3>Xếp hạng và Điểm số</h3>
                      {resultsForm.map((field, idx) => (
                        <div key={field.race_participant_id} style={{
                          display: "flex", gap: "16px", background: "rgba(255,255,255,0.01)",
                          padding: "12px", borderRadius: "8px", marginBottom: "8px", alignItems: "center"
                        }}>
                          <span style={{ fontWeight: "700", width: "120px" }}>🐎 {field.horse_name}</span>
                          <div className="form-group" style={{ margin: 0, flex: 1 }}>
                            <label>Hạng về đích</label>
                            <input type="number" min="1" className="input-field" required
                              value={field.rank} onChange={(e) => {
                                const copy = [...resultsForm];
                                copy[idx].rank = e.target.value;
                                setResultsForm(copy);
                              }} />
                          </div>
                          <div className="form-group" style={{ margin: 0, flex: 1 }}>
                            <label>Điểm cộng</label>
                            <input type="number" className="input-field" required
                              value={field.points} onChange={(e) => {
                                const copy = [...resultsForm];
                                copy[idx].points = e.target.value;
                                setResultsForm(copy);
                              }} />
                          </div>
                          <div className="form-group" style={{ margin: 0, flex: 1.5 }}>
                            <label>Ghi chú</label>
                            <input type="text" className="input-field" placeholder="Ghi chú đua..."
                              value={field.notes} onChange={(e) => {
                                const copy = [...resultsForm];
                                copy[idx].notes = e.target.value;
                                setResultsForm(copy);
                              }} />
                          </div>
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button type="submit" className="btn-primary">Lưu kết quả cuộc đua</button>
                        <button type="button" onClick={() => setSelectedRace(null)} className="btn-secondary">Hủy</button>
                      </div>
                    </form>

                    {/* Violations Form */}
                    <form onSubmit={submitViolation} style={styles.formPanel} className="glass" style={{ flex: 1 }}>
                      <h3>Báo Cáo Vi Phạm</h3>
                      <div className="form-group">
                        <label>Chọn ngựa vi phạm</label>
                        <select className="input-field" required
                          value={violationForm.race_participant_id} onChange={(e) => setViolationForm({ ...violationForm, race_participant_id: e.target.value })}>
                          <option value="">-- Chọn ngựa đua --</option>
                          {selectedRace.participants.map(p => <option key={p.id} value={p.id}>{p.horse_name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Mô tả vi phạm</label>
                        <textarea className="input-field" placeholder="Ví dụ: Chạy lấn làn của ngựa khác..." required
                          value={violationForm.description} onChange={(e) => setViolationForm({ ...violationForm, description: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Hình thức phạt</label>
                        <input type="text" className="input-field" placeholder="Warning, Ban 1 match..." required
                          value={violationForm.penalty} onChange={(e) => setViolationForm({ ...violationForm, penalty: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Số tiền phạt ($)</label>
                        <input type="number" className="input-field" required
                          value={violationForm.fine_amount} onChange={(e) => setViolationForm({ ...violationForm, fine_amount: e.target.value })} />
                      </div>
                      <button type="submit" className="btn-primary" style={{ backgroundColor: "var(--danger)" }}>Báo cáo vi phạm</button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Dự đoán Trận đua (Spectator) */}
          {activeTab === "predictions" && user.role_name === "SPECTATOR" && (
            <div style={styles.tabContent}>
              <h2>🔮 Dự đoán thứ hạng trận đua dành cho khán giả</h2>
              <div style={styles.splitLayout}>
                {/* Make prediction */}
                <form onSubmit={makePrediction} style={styles.formPanel} className="glass">
                  <h3>Tạo dự đoán mới</h3>
                  <div className="form-group">
                    <label>Chọn Trận đua & Ngựa</label>
                    <select className="input-field" required
                      value={predictionForm.race_participant_id} onChange={(e) => setPredictionForm({ ...predictionForm, race_participant_id: e.target.value })}>
                      <option value="">-- Chọn ngựa đua --</option>
                      {races.filter(rc => rc.status === "SCHEDULED").map(rc => (
                        rc.participants.map(p => (
                          <option key={p.id} value={p.id}>{rc.name} - Ngựa: {p.horse_name} (Làn {p.lane_number})</option>
                        ))
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Dự đoán thứ hạng về đích</label>
                    <select className="input-field"
                      value={predictionForm.predicted_rank} onChange={(e) => setPredictionForm({ ...predictionForm, predicted_rank: e.target.value })}>
                      <option value="1">Hạng 1 (Về nhất)</option>
                      <option value="2">Hạng 2 (Về nhì)</option>
                      <option value="3">Hạng 3 (Về ba)</option>
                      <option value="4">Hạng 4</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary">Gửi dự đoán</button>
                </form>

                {/* Predictions History */}
                <div style={{ flex: 1.3 }}>
                  <h3>Lịch sử dự đoán của bạn</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>Trận đua</th>
                          <th>Ngựa đua</th>
                          <th>Hạng dự đoán</th>
                          <th>Kết quả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictions.length === 0 ? (
                          <tr><td colSpan="4" style={{ textAlign: "center", color: "#64748b" }}>Chưa có dự đoán nào</td></tr>
                        ) : (
                          predictions.map(p => (
                            <tr key={p.id}>
                              <td>{p.race_name || `Làn ${p.race_participant_id}`}</td>
                              <td style={{ fontWeight: "700" }}>{p.horse_name}</td>
                              <td>Hạng {p.predicted_rank}</td>
                              <td>
                                <span className={`badge ${p.status === "CORRECT" ? "badge-approved" : p.status === "INCORRECT" ? "badge-rejected" : "badge-pending"}`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Leaderboard (Common) */}
          {activeTab === "leaderboard" && (
            <div style={styles.tabContent}>
              <h2>⭐ Bảng xếp hạng thi đấu chính thức</h2>
              <div style={styles.splitLayout}>
                {/* Horse standings */}
                <div style={{ flex: 1 }}>
                  <h3>Xếp hạng Ngựa đua</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>Hạng</th>
                          <th>Tên Ngựa</th>
                          <th>Điểm tích lũy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankings.filter(r => r.entity_type === "HORSE").map((r, i) => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: "800", color: "var(--primary)" }}>#{i + 1}</td>
                            <td style={{ fontWeight: "700" }}>{r.entity_name}</td>
                            <td>{r.points} điểm</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Jockey standings */}
                <div style={{ flex: 1 }}>
                  <h3>Xếp hạng Jockey</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>Hạng</th>
                          <th>Tên Jockey</th>
                          <th>Điểm tích lũy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankings.filter(r => r.entity_type === "JOCKEY").map((r, i) => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: "800", color: "var(--secondary)" }}>#{i + 1}</td>
                            <td style={{ fontWeight: "700" }}>{r.entity_name}</td>
                            <td>{r.points} điểm</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1600px",
    margin: "0 auto",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderRadius: "12px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  brandText: {
    fontSize: "18px",
    fontWeight: "800",
    letterSpacing: "1px",
  },
  userProfile: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "2px",
  },
  userName: {
    fontSize: "14px",
    fontWeight: "700",
  },
  banner: {
    borderWidth: "1px",
    borderStyle: "solid",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "14px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: "20px",
    flex: 1,
  },
  sidebar: {
    padding: "16px",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    height: "fit-content",
  },
  tabBtn: {
    width: "100%",
    padding: "12px 16px",
    textAlign: "left",
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: "14px",
    fontWeight: "600",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  activeTabBtn: {
    width: "100%",
    padding: "12px 16px",
    textAlign: "left",
    background: "var(--primary-glow)",
    border: "none",
    color: "var(--primary)",
    fontSize: "14px",
    fontWeight: "700",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: "inset 0 0 10px rgba(249,115,22,0.1)",
  },
  workspace: {
    padding: "32px",
    borderRadius: "16px",
    minHeight: "650px",
  },
  tabContent: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  splitLayout: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
  },
  formPanel: {
    padding: "24px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    flex: 1,
    background: "rgba(255,255,255,0.01)",
    border: "1px solid rgba(255,255,255,0.04)",
  },
  tableWrapper: {
    overflowX: "auto",
    background: "rgba(255,255,255,0.01)",
    border: "1px solid var(--card-border)",
    borderRadius: "12px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "14px",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    color: "var(--primary)",
    fontWeight: "700",
    fontSize: "18px",
  },
  row: {
    display: "flex",
    gap: "16px",
  }
};
