"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "../../api";
import { styles } from "./styles";

export default function AdminPanel({ user, activeTab, showMsg }) {
  const [tournaments, setTournaments] = useState([]);
  const [races, setRaces] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [referees, setReferees] = useState([]);
  const [jockeys, setJockeys] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newTournament, setNewTournament] = useState({ name: "", description: "", start_date: "", end_date: "", location: "" });
  const [newRound, setNewRound] = useState({ tournament_id: "", name: "", sequence: "1" });
  const [newRace, setNewRace] = useState({ round_id: "", name: "", race_time: "", track_condition: "Good", distance: "1200", referee_id: "" });
  const [newParticipant, setNewParticipant] = useState({ race_id: "", registration_id: "", lane_number: "" });

  const loadData = async () => {
    try {
      const tours = await api.get("/tournaments");
      setTournaments(tours);

      const allRaces = await api.get("/races");
      setRaces(allRaces);

      const listJockeys = await api.get("/jockeys");
      setJockeys(listJockeys);

      setReferees([
        { id: 1, name: "John Referee" },
        { id: 2, name: "David Referee" }
      ]);

      const allRegs = [];
      for (const t of tours) {
        try {
          const regs = await api.get(`/tournaments/${t.id}/registrations`);
          regs.forEach(r => allRegs.push({ ...r, tournament_id: t.id }));
        } catch (e) { /* ignore per-tournament errors */ }
      }
      setRegistrations(allRegs);
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const tournamentMap = useMemo(() => {
  return new Map(tournaments.map(t => [t.id, t]));
}, [tournaments]);

const approvedRegistrations = useMemo(() => {
  return registrations.filter(r => r.status === "APPROVED");
}, [registrations]);

  const createTournament = async (e) => {
    e.preventDefault();
    try {
      await api.post("/tournaments/", newTournament);
      showMsg("Tạo giải đấu thành công!");
      setNewTournament({ name: "", description: "", start_date: "", end_date: "", location: "" });
      loadData();
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
        sequence: parseInt(newRound.sequence, 10)
      });
      showMsg("Tạo vòng đấu thành công!");
      setNewRound({ tournament_id: "", name: "", sequence: "1" });
      loadData();
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
        distance: parseInt(newRace.distance, 10),
        referee_id: newRace.referee_id ? parseInt(newRace.referee_id, 10) : null
      });
      showMsg("Tạo trận đua thành công!");
      setNewRace({ round_id: "", name: "", race_time: "", track_condition: "Good", distance: "1200", referee_id: "" });
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const addParticipant = async (e) => {
    e.preventDefault();
    if (!newParticipant.race_id || !newParticipant.registration_id) return showMsg("Vui lòng nhập đầy đủ thông tin", "error");
    try {
      await api.post(`/races/${newParticipant.race_id}/participants`, {
        registration_id: parseInt(newParticipant.registration_id, 10),
        lane_number: parseInt(newParticipant.lane_number, 10)
      });
      showMsg("Thêm ngựa vào đường đua thành công!");
      setNewParticipant({ race_id: "", registration_id: "", lane_number: "" });
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const approveRegistration = async (regId, status) => {
    try {
      await api.put(`/tournaments/registrations/${regId}`, { status });
      showMsg(`Đã ${status === "APPROVED" ? "phê duyệt" : "từ chối"} đăng ký!`);
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  if (loading) {
    return <div style={styles.loading}>Đang tải dữ liệu Admin...</div>;
  }

  return (
    <>
      {/* TAB: Quản lý Giải đấu (Admin) */}
      {activeTab === "tournaments" && (
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
                      <td>{t.rounds ? t.rounds.length : 0} vòng</td>                      
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
      {activeTab === "registrations" && (
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
                {registrations.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: "center", color: "#64748b" }}>Chưa có đăng ký nào</td></tr>
                ) : (
                  registrations.map(r => {
                    const t = tournamentMap.get(r.tournament_id);
                    return (
                      <tr key={r.id}>
                        <td>{t ? t.name : `Giải #${r.tournament_id}`}</td>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Lập lịch Trận đua (Admin) */}
      {activeTab === "races" && (
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
                  {tournaments.map(t => 
                    (t.rounds || []).map(r => (
                      <option key={r.id} value={r.id}>{t.name} - {r.name}</option>
                    ))
                  )}
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
                  {approvedRegistrations.map(r => {
                    const t = tournamentMap.get(r.tournament_id);
                    return (
                      <option key={r.id} value={r.id}>{t ? t.name : `Giải #${r.tournament_id}`}: {r.horse_name} (Jockey: {r.jockey_name})</option>
                    );
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
    </>
  );
}
