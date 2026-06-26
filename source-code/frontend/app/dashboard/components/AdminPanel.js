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
  const [users, setUsers] = useState([]);

  // Form states
  const [newTournament, setNewTournament] = useState({ name: "", description: "", start_date: "", end_date: "", location: "" });
  const [newRound, setNewRound] = useState({ tournament_id: "", name: "", sequence: "1" });
  const [newRace, setNewRace] = useState({ round_id: "", name: "", race_time: "", track_condition: "Good", distance: "1200", referee_id: "" });
  const [newParticipant, setNewParticipant] = useState({ race_id: "", registration_id: "", lane_number: "" });
  const [prizes, setPrizes] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [stats, setStats] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [newPrize, setNewPrize] = useState({ position: "1", title: "", prize_value: "", description: "" });
  
  const loadData = async () => {
    try {
      const tours = await api.get("/tournaments");
      setTournaments(tours);

      const allRaces = await api.get("/races");
      setRaces(allRaces);

      const listJockeys = await api.get("/jockeys");
      setJockeys(listJockeys);
      try {
        const listReferees = await api.get("/referees");
        setReferees(listReferees || []);
      } catch (e) {
        console.error("Lỗi lấy danh sách trọng tài:", e);
        setReferees([]);
      }    

      const allRegs = [];
      for (const t of tours) {
        try {
          const regs = await api.get(`/tournaments/${t.id}/registrations`);
          regs.forEach(r => allRegs.push({ ...r, tournament_id: t.id }));
        } catch (e) { /* ignore per-tournament errors */ }
      }      
      setRegistrations(allRegs);
      
      try {
      const allUsers = await api.get(`/admin/users?search=${userSearch}&page=${userPage}&limit=10`);
      setUsers(allUsers || []);
    } catch (e) {      
      setUsers([       
      ]);
      console.error("Lỗi lấy danh sách thành viên từ API:", e);
    }
    try {
        const adminStats = await api.get("/admin/stats");
        setStats(adminStats);
      } catch (e) {
        console.error("Lỗi lấy thống kê hệ thống:", e);
        setStats({
          summary: { total_users: 150, total_tournaments: 5, total_races: 24, total_horses: 45, total_jockeys: 30 },
          predictions: { global_accuracy_rate: 74.5 },
          users_by_role: { "ADMIN": 3, "SPECTATOR": 120, "JOCKEY": 27 },
          top_horses: [
            { horse_id: 1, rank: 1, name: "Xích Thố", breed: "Thuần Chủng", total_points: 180 },
            { horse_id: 2, rank: 2, name: "Thần Phong", breed: "Ả Rập", total_points: 145 },
            { horse_id: 3, rank: 3, name: "Hắc Mã", breed: "Nội Địa", total_points: 110 }
          ]
        });
      }
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

  useEffect(() => {
    const loadAdminUsers = async () => {
      try {
        const allUsers = await api.get(`/admin/users?search=${userSearch}&page=${userPage}&limit=10`);
        setUsers(allUsers || []);
      } catch (e) {
        setUsers([]);
        console.error("Lỗi lấy danh sách thành viên từ API:", e);
      }
    };
    
    loadAdminUsers();
  }, [userSearch, userPage]);

  useEffect(() => {
    if (selectedTournamentId) {
      api.get(`/tournaments/${selectedTournamentId}/prizes`)
        .then(res => setPrizes(res || []))
        .catch(err => console.error("Lỗi tải giải thưởng:", err));
    } else {
      setPrizes([]);
    }
  }, [selectedTournamentId]);

  const tournamentMap = useMemo(() => {
  return new Map(tournaments.map(t => [t.id, t]));
}, [tournaments]);

const approvedRegistrations = useMemo(() => {
  return registrations.filter(r => r.status === "APPROVED");
}, [registrations]);

const handleCreatePrize = async (e) => {
    e.preventDefault();
    if (!selectedTournamentId) return showMsg("Vui lòng chọn giải đấu trước!", "error");
    try {
      await api.post(`/tournaments/${selectedTournamentId}/prizes`, {
        position: parseInt(newPrize.position, 10),
        title: newPrize.title,
        prize_value: parseFloat(newPrize.prize_value),
        description: newPrize.description
      });
      showMsg("Cấu hình hạng mục giải thưởng thành công!");
      setNewPrize({ position: "1", title: "", prize_value: "", description: "" });
      
      const res = await api.get(`/tournaments/${selectedTournamentId}/prizes`);
      setPrizes(res || []);
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const handleUpdateTournamentStatus = async (id, status) => {
    try {      
      await api.put(`/tournaments/status/${id}`, { new_status: status });            
      showMsg(`Chuyển trạng thái giải đấu sang "${status}" thành công!`);
      loadData(); 
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

const handleToggleUserStatus = async (userId, currentStatus) => {
  const nextStatus = !currentStatus;
  try {
    await api.put(`/admin/users/${userId}/status`, { is_active: nextStatus })
    showMsg("Cập nhật trạng thái người dùng thành công!");
    loadData(); 
  } catch (err) {
    setUsers(prevUsers =>
      prevUsers.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u)
    );
    showMsg("Đang cập nhật trạng thái ở chế độ Local!", "info");
  }
};

  const createTournament = async (e) => {
    e.preventDefault();
    try {
      await api.post("/tournaments", newTournament);
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
      if (err.status === 400 || (err.response && err.response.status === 400)) {
        const backendError = err.response?.data?.detail || "Lỗi trùng lịch thi đấu!";
        showMsg(backendError, "error");
      } else {
        showMsg(err.message, "error");
      }    
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

  const deleteTournament = async (tournamentId, tournamentName) => {
    console.log("deleteTournament called with:", tournamentId, tournamentName);
    if (!window.confirm(`⚠️ Bạn chắc chắn muốn xóa giải đấu "${tournamentName}"? Tất cả vòng đấu, trận đua liên quan sẽ bị xóa!`)) {
      console.log("Delete cancelled by user");
      return;
    }
    console.log("Delete confirmed, calling API for ID:", tournamentId);
    try {
      const res = await api.delete(`/tournaments/${tournamentId}`);
      console.log("API delete response:", res);
      showMsg("Xóa giải đấu thành công!");
      loadData();
    } catch (err) {
      console.error("API delete error:", err);
      showMsg(err.message, "error");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
  };
  

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  if (loading) {
    return <div style={styles.loading}>Đang tải dữ liệu Admin...</div>;
  }
  

  return (
    <>
      {/* TAB: Tổng quan hệ thống (Analytics)*/}
    {activeTab === "overview" && (
      <div style={styles.tabContent}>
        <h2>📊 Tổng quan & Phân tích hệ thống</h2>
        
        {/* Khối các thẻ con số thống kê sơ bộ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div className="glass" style={{ padding: "16px", borderRadius: "8px", textAlign: "center" }}>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Tổng Thành Viên</p>
            <h2 style={{ margin: "8px 0 0 0", color: "#3b82f6" }}>{stats?.summary?.total_users || 0}</h2>
          </div>
          <div className="glass" style={{ padding: "16px", borderRadius: "8px", textAlign: "center" }}>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Giải Đấu / Trận Đua</p>
            <h2 style={{ margin: "8px 0 0 0", color: "#10b981" }}>{stats?.summary?.total_tournaments || 0} / {stats?.summary?.total_races || 0}</h2>
          </div>
          <div className="glass" style={{ padding: "16px", borderRadius: "8px", textAlign: "center" }}>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Ngựa / Jockey</p>
            <h2 style={{ margin: "8px 0 0 0", color: "#f59e0b" }}>{stats?.summary?.total_horses || 0} / {stats?.summary?.total_jockeys || 0}</h2>
          </div>
          <div className="glass" style={{ padding: "16px", borderRadius: "8px", textAlign: "center" }}>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Tỷ lệ đoán đúng chính xác</p>
            <h2 style={{ margin: "8px 0 0 0", color: "#ec4899" }}>{stats?.predictions?.global_accuracy_rate || 0}%</h2>
          </div>
        </div>

        {/* KHỐI BIỂU ĐỒ TRỰC QUAN HÓA QUY MÔ HỆ THỐNG */}
        <div className="glass" style={{ padding: "20px", borderRadius: "12px", marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "24px" }}>📈 Biểu đồ phân tích quy mô dữ liệu</h3>
          <div style={{ 
            display: "flex", 
            alignItems: "flex-end", 
            justifyContent: "space-around", 
            height: "220px", 
            paddingBottom: "15px", 
            borderBottom: "2px solid rgba(255,255,255,0.1)"
          }}>
            {/* Cột Users */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "70px" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px" }}>{stats?.summary?.total_users || 0}</span>
              <div style={{ 
                width: "100%", 
                height: `${Math.min((stats?.summary?.total_users || 0) * 1.2, 160) || 10}px`, 
                background: "linear-gradient(to top, #3b82f6, #60a5fa)", 
                borderRadius: "6px 6px 0 0",
                transition: "height 0.6s ease"
              }}></div>
              <span style={{ fontSize: "12px", marginTop: "10px", color: "#94a3b8" }}>User</span>
            </div>

            {/* Cột Tournaments */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "70px" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px" }}>{stats?.summary?.total_tournaments || 0}</span>
              <div style={{ 
                width: "100%", 
                height: `${Math.min((stats?.summary?.total_tournaments || 0) * 20, 160) || 10}px`, 
                background: "linear-gradient(to top, #10b981, #34d399)", 
                borderRadius: "6px 6px 0 0",
                transition: "height 0.6s ease"
              }}></div>
              <span style={{ fontSize: "12px", marginTop: "10px", color: "#94a3b8" }}>Giải đấu</span>
            </div>

            {/* Cột Races */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "70px" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px" }}>{stats?.summary?.total_races || 0}</span>
              <div style={{ 
                width: "100%", 
                height: `${Math.min((stats?.summary?.total_races || 0) * 6, 160) || 10}px`, 
                background: "linear-gradient(to top, #f59e0b, #fbbf24)", 
                borderRadius: "6px 6px 0 0",
                transition: "height 0.6s ease"
              }}></div>
              <span style={{ fontSize: "12px", marginTop: "10px", color: "#94a3b8" }}>Trận đua</span>
            </div>
          </div>
        </div>

        {/* Khối bố cục Split Layout bên dưới */}
        <div style={styles.splitLayout}>
          <div className="glass" style={{ flex: 1, padding: "16px", borderRadius: "8px" }}>
            <h3>👥 Cơ cấu Vai trò thành viên</h3>
            {Object.entries(stats?.users_by_role || {}).map(([role, count]) => {
              const total = stats?.summary?.total_users || 1;
              const percentage = ((count / total) * 100).toFixed(1);
              return (
                <div key={role} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                    <span><b>{role}</b></span>
                    <span>{count} tài khoản ({percentage}%)</span>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.1)", height: "10px", borderRadius: "5px", overflow: "hidden" }}>
                    <div style={{ background: "#3b82f6", height: "100%", width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass" style={{ flex: 1, padding: "16px", borderRadius: "8px" }}>
            <h3>🏆 Top Ngựa Đua Xuất Sắc (Bảng Xếp Hạng Hệ Thống)</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Tên ngựa</th>
                  <th>Giống</th>
                  <th>Điểm số</th>
                </tr>
              </thead>
              <tbody>
                {stats?.top_horses?.map(h => (
                  <tr key={h.horse_id}>
                    <td>🏅 {h.rank}</td>
                    <td><b>{h.name}</b></td>
                    <td>{h.breed}</td>
                    <td style={{ color: "#10b981", fontWeight: "bold" }}>{h.total_points}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
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
                <input 
                  type="number" 
                  className="input-field" 
                  min="1" 
                  required
                  value={newRound.sequence} 
                  onKeyDown={(e) => {
                    if (["e", "E", "-", "+", "."].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val !== "") {
                      const num = parseInt(val, 10);
                      if (isNaN(num) || num < 1) {
                        val = "1";
                      }
                    }
                    setNewRound({ ...newRound, sequence: val });
                  }} 
                />
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
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map(t => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td style={{ fontWeight: "700" }}>{t.name}</td>
                      <td>{t.location}</td>
                      <td>{formatDate(t.start_date)} đến {formatDate(t.end_date)}</td>
                      <td>{t.rounds ? t.rounds.length : 0} vòng</td>                      
                      <td><span className="badge badge-info">{t.status}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {t.status === "UPCOMING" && (
                            <button 
                              type="button" 
                              className="btn-primary" 
                              style={{ padding: "6px 12px", fontSize: "12px" }} 
                              onClick={() => handleUpdateTournamentStatus(t.id, "ACTIVE")}
                            >
                              ▶️ Mở giải
                            </button>
                          )}
                          {t.status === "ACTIVE" && (
                            <button 
                              type="button" 
                              className="btn-primary" 
                              style={{ padding: "6px 12px", fontSize: "12px", background: "#10b981", color: "#fff" }} 
                              onClick={() => handleUpdateTournamentStatus(t.id, "COMPLETED")}
                            >
                              🏁 Kết thúc & Trao thưởng
                            </button>
                          )}
                          <button 
                            type="button" 
                            className="btn-secondary" 
                            style={{ 
                              padding: "6px 12px", 
                              fontSize: "12px", 
                              color: "var(--danger)",
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                              background: "rgba(239, 68, 68, 0.05)"
                            }} 
                            onClick={() => deleteTournament(t.id, t.name)}
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* TAB: Cấu hình Cơ cấu Giải thưởng (THÊM TOÀN BỘ KHỐI NÀY) */}
    {activeTab === "prizes" && (
      <div style={styles.tabContent}>
        <h2>🏆 Cấu hình Cơ cấu Giải thưởng (Huệ)</h2>
        <div style={{ marginBottom: "16px" }} className="form-group">
          <label style={{ fontWeight: "bold" }}>Chọn giải đấu để thiết lập giải thưởng:</label>
          <select className="input-field" value={selectedTournamentId} onChange={(e) => setSelectedTournamentId(e.target.value)}>
            <option value="">-- Chọn giải đấu --</option>
            {tournaments.map(t => <option key={t.id} value={t.id}>{t.name} [{t.status}]</option>)}
          </select>
        </div>

        {selectedTournamentId && (
          <div style={styles.splitLayout}>
            <form onSubmit={handleCreatePrize} style={styles.formPanel} className="glass">
              <h3>Thêm Hạng Mạc Giải Thưởng</h3>
              <div className="form-group">
                <label>Thứ hạng áp dụng (Hạng 1, 2, 3...)</label>
                <input type="number" className="input-field" min="1" required value={newPrize.position} onChange={(e) => setNewPrize({ ...newPrize, position: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Tên giải thưởng</label>
                <input type="text" className="input-field" placeholder="Ví dụ: Giải Nhất, Siêu cúp" required value={newPrize.title} onChange={(e) => setNewPrize({ ...newPrize, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Số tiền thưởng (VNĐ)</label>
                <input type="number" className="input-field" placeholder="Ví dụ: 20000000" min="0" required value={newPrize.prize_value} onChange={(e) => setNewPrize({ ...newPrize, prize_value: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Mô tả vật phẩm kèm theo</label>
                <textarea className="input-field" placeholder="Cúp lưu niệm, chứng nhận..." value={newPrize.description} onChange={(e) => setNewPrize({ ...newPrize, description: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary">💾 Lưu cấu hình giải</button>
            </form>

            <div style={{ flex: 1.5 }} className="glass">
              <h3 style={{ padding: "12px" }}>Danh sách giải thưởng & Kết quả trao giải tự động</h3>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Thứ hạng</th>
                      <th>Tên giải</th>
                      <th>Tiền thưởng</th>
                      <th>Bên đoạt giải (Khi giải kết thúc)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prizes.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: "center", color: "#64748b" }}>Chưa có cấu hình giải thưởng cho giải đấu này.</td></tr>
                    ) : (
                      prizes.map(p => (
                        <tr key={p.id}>
                          <td><span className="badge badge-info">Hạng {p.position}</span></td>
                          <td><b>{p.title}</b></td>
                          <td>{p.prize_value ? Math.abs(Number(p.prize_value)).toLocaleString("vi-VN") : 0} VNĐ</td>
                          <td>
                            {p.awarded_to_horse ? (
                              <div style={{ fontSize: "12px", color: "#10b981" }}>
                                🐴 <b>{p.awarded_to_horse}</b> (Jockey: {p.awarded_to_jockey}) <br/>
                                <small style={{ color: "#64748b" }}>Tích lũy: +{p.awarded_total_points}đ</small>
                              </div>
                            ) : <span style={{ color: "#64748b", fontSize: "12px" }}>Hệ thống tự trao khi đóng giải</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
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
                          {r.status === "PENDING" ? (
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                className="btn-primary" 
                                style={{ padding: "4px 8px", fontSize: "12px", cursor: "pointer" }}
                                onClick={() => approveRegistration(r.id, "APPROVED")}
                              >
                                Duyệt
                              </button>
                              <button
                                className="btn-secondary"
                                style={{ padding: "4px 8px", fontSize: "12px", color: "var(--danger)", cursor: "pointer" }}
                                onClick={() => approveRegistration(r.id, "REJECTED")}
                              >
                                Từ chối
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <span style={{ fontSize: "12px", color: "#64748b" }}>🔒 Đã xử lý ({r.status})</span>
                              <button
                                type="button"
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#3b82f6",
                                  textDecoration: "underline",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                  padding: 0
                                }}
                                onClick={() => approveRegistration(r.id, "PENDING")}
                              >
                                Thay đổi
                              </button>
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
                  {tournaments.flatMap(t => 
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
                  <input 
                    type="number" 
                    className="input-field" 
                    min="1" 
                    required
                    value={newRace.distance} 
                    onKeyDown={(e) => {
                      if (["e", "E", "-", "+", "."].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val !== "") {
                        const num = parseInt(val, 10);
                        if (isNaN(num) || num < 1) {
                          val = "1";
                        }
                      }
                      setNewRace({ ...newRace, distance: val });
                    }} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Phân công trọng tài</label>
                <select className="input-field"
                  value={newRace.referee_id} onChange={(e) => setNewRace({ ...newRace, referee_id: e.target.value })}>
                  <option value="">-- Không phân công / Phân công sau --</option>
                  {(referees || []).map(ref => (
                    <option key={ref.id} value={ref.id}>
                      {ref.full_name || `Trọng tài #${ref.id}`}
                    </option>
                  ))}
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
                  {races.map(rc => <option key={rc.id} value={rc.id}>{rc.name} ({formatDateTime(rc.race_time)})</option>)}
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
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="1-8" 
                  min="1" 
                  max="8" 
                  required
                  value={newParticipant.lane_number} 
                  onKeyDown={(e) => {
                    if (["e", "E", "-", "+", "."].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val !== "") {
                      const num = parseInt(val, 10);
                      if (isNaN(num) || num < 1) {
                        val = "1";
                      } else if (num > 8) {
                        val = "8";
                      }
                    }
                    setNewParticipant({ ...newParticipant, lane_number: val });
                  }} 
                />
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
                      <td>{formatDateTime(rc.race_time)}</td>
                      <td>{rc.distance}m</td>
                      <td>{rc.track_condition}</td>
                      <td>{rc.referee_name || "Chưa phân công"}</td>
                     <td>{rc.participants?.length || 0} cặp</td>
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
      {activeTab === "users" && (
  <div style={styles.tabContent}>
    <h2>👥 Quản lý Thành viên hệ thống</h2>
    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
      <input 
        type="text" 
        className="input-field" 
        style={{ maxWidth: "320px" }}
        placeholder="🔎 Nhập tên tài khoản hoặc email để tìm kiếm..." 
        value={userSearch}
        onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} 
      />
    </div>
    <div style={styles.tableWrapper}>
      <table style={styles.table}>        
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên tài khoản</th>
            <th>Email</th>
            <th>Vai trò (Role)</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", color: "#64748b" }}>
                Chưa có dữ liệu thành viên
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td style={{ fontWeight: "700" }}>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <span className="badge badge-info">{u.role_name}</span>
                </td>
                <td>
                  {u.is_active ? (
                    <span className="badge badge-approved">Đang hoạt động</span>
                  ) : (
                    <span className="badge badge-rejected">Đã khóa</span>
                  )}
                </td>
                <td>
                  <button
                    className={u.is_active ? "btn-secondary" : "btn-primary"}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      color: u.is_active ? "var(--danger)" : "#fff",
                    }}
                    onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                  >
                    {u.is_active ? " Khóa tài khoản" : " Mở khóa"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>      
    </div> 
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
            <button type="button" className="btn-secondary" style={{ padding: "4px 10px" }} disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)}>Trước</button>
            <span style={{ alignSelf: "center", fontSize: "14px" }}>Trang {userPage}</span>
            <button type="button" className="btn-secondary" style={{ padding: "4px 10px" }} disabled={users.length < 10} onClick={() => setUserPage(p => p + 1)}>Sau</button>
          </div>
        </div>
      )}   
    </>
  );
}
