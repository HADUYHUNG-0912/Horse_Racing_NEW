"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "../../api";
import { styles } from "./styles";
import dashboardStyles from "../dashboard.module.css";
import PrizesPanel from "./PrizesPanel";
import {
  DashboardIcon,
  TrophyIcon,
  ListIcon,
  FlagIcon,
  StarIcon,
  AwardIcon,
  UsersIcon,
  LockIcon,
  KeyIcon,
  LogoutIcon,
  UserIcon,
  SearchIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PlayIcon
} from "./Icons";


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
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
    roleName: "ADMIN"
  });
  const [showPassword, setShowPassword] = useState(false);  

  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);  
  
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
        console.error("Error fetching referees list:", e);
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
      console.error("Error fetching users list from API:", e);
    }
    try {
        const adminStats = await api.get("/admin/stats");
        setStats(adminStats);
      } catch (e) {
        console.error("Error fetching system statistics:", e);
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
        console.error("Error fetching users list from API:", e);
      }
    };
    
    loadAdminUsers();
  }, [userSearch, userPage]);

  useEffect(() => {
    if (selectedTournamentId) {
      api.get(`/tournaments/${selectedTournamentId}/prizes`)
        .then(res => setPrizes(res || []))
        .catch(err => console.error("Error loading prizes:", err));
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

  const handleUpdateTournamentStatus = async (id, status) => {
    try {      
      await api.put(`/tournaments/${id}/status`, { new_status: status });
      showMsg(`Tournament status successfully updated to "${status}"!`);
      loadData(); 
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

const handleToggleUserStatus = async (userId, currentStatus) => {
  const actionText = currentStatus ? "lock" : "unlock";
 
  if (!window.confirm(`⚠️ Are you sure you want to ${actionText} this account?`)) {
    return; 
  }
  const nextStatus = !currentStatus;
  try {
    await api.put(`/admin/users/${userId}/status`, { is_active: nextStatus })
    showMsg("User status updated successfully!");
    loadData(); 
  } catch (err) {
    setUsers(prevUsers =>
      prevUsers.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u)
    );
    showMsg("Updating status in Local mode!", "info");
  }
};
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (adminForm.password.length < 8) {
    alert("⚠️ Mật khẩu phải chứa ít nhất 8 ký tự!"); 
    return; 
  }
    try {      
      await api.post("/admin/users/create-admin", {
        username: adminForm.username,
        email: adminForm.email,
        full_name: adminForm.fullName,
        password: adminForm.password,
        role_name: adminForm.roleName
      });
      
      showMsg("New administrator account created successfully!");
      setShowCreateAdminModal(false);
      setShowPassword(false);       
      setAdminForm({ username: "", email: "", fullName: "", password: "", roleName: "ADMIN" }); 
      loadData(); 
    } catch (err) {
      showMsg(err.message || "Account creation failed.", "error");
    }
  };  

  const handleViewUserDetails = async (userId) => {
    setLoadingDetail(true);
    setShowUserDetailModal(true);
    try {    
      const data = await api.get(`/admin/users/${userId}`);
      setSelectedUserDetails(data);
    } catch (err) {
      showMsg("Unable to load user details!", "error");
      setShowUserDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };
  const createTournament = async (e) => {
    e.preventDefault();
    try {
      await api.post("/tournaments", newTournament);
      showMsg("Create a successful tournament!");
      setNewTournament({ name: "", description: "", start_date: "", end_date: "", location: "" });
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const createRound = async (e) => {
    e.preventDefault();
    if (!newRound.tournament_id) return showMsg("Please select a tournament.", "error");
    try {
      await api.post(`/tournaments/${newRound.tournament_id}/rounds`, {
        name: newRound.name,
        sequence: parseInt(newRound.sequence, 10)
      });
      showMsg("Create a successful round!");
      setNewRound({ tournament_id: "", name: "", sequence: "1" });
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const createRace = async (e) => {
    e.preventDefault();
    if (!newRace.round_id) return showMsg("Please select a round.", "error");
    try {
      await api.post(`/races/rounds/${newRace.round_id}/races`, {
        name: newRace.name,
        race_time: newRace.race_time,
        track_condition: newRace.track_condition,
        distance: parseInt(newRace.distance, 10),
        referee_id: newRace.referee_id ? parseInt(newRace.referee_id, 10) : null
      });
      showMsg("Make the race a success!");
      setNewRace({ round_id: "", name: "", race_time: "", track_condition: "Good", distance: "1200", referee_id: "" });
      loadData();
    } catch (err) {
      if (err.status === 400 || (err.response && err.response.status === 400)) {
        const backendError = err.response?.data?.detail || "Match scheduling error!";
        showMsg(backendError, "error");
      } else {
        showMsg(err.message, "error");
      }    
    }
  };

  const addParticipant = async (e) => {
    e.preventDefault();
    if (!newParticipant.race_id || !newParticipant.registration_id) return showMsg("Please enter all the required information.", "error");
    try {
      await api.post(`/races/${newParticipant.race_id}/participants`, {
        registration_id: parseInt(newParticipant.registration_id, 10),
        lane_number: parseInt(newParticipant.lane_number, 10)
      });
      showMsg("Adding horses to the race track was a success!");
      setNewParticipant({ race_id: "", registration_id: "", lane_number: "" });
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const approveRegistration = async (regId, status) => {
    try {
      await api.put(`/tournaments/registrations/${regId}`, { status });
      showMsg(`Registration ${status === "APPROVED" ? "approved" : "rejected"} successfully!`);
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const deleteTournament = async (tournamentId, tournamentName) => {
    console.log("deleteTournament called with:", tournamentId, tournamentName);
    if (!window.confirm(`⚠️ Are you sure you want to delete the tournament "${tournamentName}"? All related rounds and races will be deleted!`)) {
      console.log("Delete cancelled by user");
      return;
    }
    console.log("Delete confirmed, calling API for ID:", tournamentId);
    try {
      const res = await api.delete(`/tournaments/${tournamentId}`);
      console.log("API delete response:", res);
      showMsg("Tournament deleted successfully!");
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
    return <div className={dashboardStyles.loading}>Đang tải dữ liệu Admin...</div>;
  }
  

  return (
    <>
      {/* TAB: Tổng quan hệ thống (Analytics)*/}
    {activeTab === "overview" && (
      <div className={dashboardStyles.tabContent}>
        <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <DashboardIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Tổng quan & Phân tích hệ thống
        </h2>
        
        {/* Khối các thẻ con số thống kê sơ bộ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div className={dashboardStyles.card} style={{ textAlign: "center", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <UsersIcon size={24} style={{ color: "var(--color-burgundy)", marginBottom: "8px" }} />
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "14px" }}>Tổng Thành Viên</p>
            <h2 style={{ margin: "8px 0 0 0", color: "var(--color-burgundy)", fontFamily: "var(--font-bungee)" }}>{stats?.summary?.total_users || 0}</h2>
          </div>
          <div className={dashboardStyles.card} style={{ textAlign: "center", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <TrophyIcon size={24} style={{ color: "var(--color-forest)", marginBottom: "8px" }} />
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "14px" }}>Giải Đấu / Trận Đua</p>
            <h2 style={{ margin: "8px 0 0 0", color: "var(--color-forest)", fontFamily: "var(--font-bungee)" }}>{stats?.summary?.total_tournaments || 0} / {stats?.summary?.total_races || 0}</h2>
          </div>
          <div className={dashboardStyles.card} style={{ textAlign: "center", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <FlagIcon size={24} style={{ color: "var(--color-burgundy)", marginBottom: "8px" }} />
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "14px" }}>Ngựa / Jockey</p>
            <h2 style={{ margin: "8px 0 0 0", color: "var(--color-burgundy)", fontFamily: "var(--font-bungee)" }}>{stats?.summary?.total_horses || 0} / {stats?.summary?.total_jockeys || 0}</h2>
          </div>
          <div className={dashboardStyles.card} style={{ textAlign: "center", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <StarIcon size={24} style={{ color: "var(--color-forest)", marginBottom: "8px" }} />
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "14px" }}>Tỷ lệ đoán đúng chính xác</p>
            <h2 style={{ margin: "8px 0 0 0", color: "var(--color-forest)", fontFamily: "var(--font-bungee)" }}>{stats?.predictions?.global_accuracy_rate || 0}%</h2>
          </div>
        </div>

        {/* KHỐI BIỂU ĐỒ TRỰC QUAN HÓA QUY MÔ HỆ THỐNG */}
        <div className={dashboardStyles.card} style={{ padding: "20px", marginBottom: "24px" }}>
          <h3 className={dashboardStyles.subHeading} style={{ marginBottom: "24px" }}>📈 Biểu đồ phân tích quy mô dữ liệu</h3>
          <div style={{ 
            display: "flex", 
            alignItems: "flex-end", 
            justifyContent: "space-around", 
            height: "220px", 
            paddingBottom: "15px", 
            borderBottom: "2px solid var(--color-border)"
          }}>
            {/* Cột Users */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "70px" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px", color: "var(--color-text-dark)" }}>{stats?.summary?.total_users || 0}</span>
              <div style={{ 
                width: "100%", 
                height: `${Math.min((stats?.summary?.total_users || 0) * 1.2, 160) || 10}px`, 
                background: "linear-gradient(to top, var(--color-burgundy-dark), var(--color-burgundy))", 
                borderRadius: "6px 6px 0 0",
                transition: "height 0.6s ease"
              }}></div>
              <span style={{ fontSize: "12px", marginTop: "10px", color: "var(--color-text-muted)" }}>User</span>
            </div>

            {/* Cột Tournaments */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "70px" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px", color: "var(--color-text-dark)" }}>{stats?.summary?.total_tournaments || 0}</span>
              <div style={{ 
                width: "100%", 
                height: `${Math.min((stats?.summary?.total_tournaments || 0) * 20, 160) || 10}px`, 
                background: "linear-gradient(to top, var(--color-forest-dark), var(--color-forest))", 
                borderRadius: "6px 6px 0 0",
                transition: "height 0.6s ease"
              }}></div>
              <span style={{ fontSize: "12px", marginTop: "10px", color: "var(--color-text-muted)" }}>Giải đấu</span>
            </div>

            {/* Cột Races */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "70px" }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px", color: "var(--color-text-dark)" }}>{stats?.summary?.total_races || 0}</span>
              <div style={{ 
                width: "100%", 
                height: `${Math.min((stats?.summary?.total_races || 0) * 6, 160) || 10}px`, 
                background: "linear-gradient(to top, var(--color-burgundy), var(--color-forest))", 
                borderRadius: "6px 6px 0 0",
                transition: "height 0.6s ease"
              }}></div>
              <span style={{ fontSize: "12px", marginTop: "10px", color: "var(--color-text-muted)" }}>Trận đua</span>
            </div>
          </div>
        </div>

        {/* Khối bố cục Split Layout bên dưới */}
        <div className={dashboardStyles.splitLayout}>
          <div className={dashboardStyles.card} style={{ flex: 1 }}>
            <h3 className={dashboardStyles.subHeading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <UsersIcon size={20} /> Cơ cấu Vai trò thành viên
            </h3>
            {Object.entries(stats?.users_by_role || {}).map(([role, count]) => {
              const total = stats?.summary?.total_users || 1;
              const percentage = ((count / total) * 100).toFixed(1);
              return (
                <div key={role} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                    <span><b>{role}</b></span>
                    <span>{count} tài khoản ({percentage}%)</span>
                  </div>
                  <div style={{ background: "var(--color-cream)", height: "10px", borderRadius: "5px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                    <div style={{ background: "var(--color-burgundy)", height: "100%", width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={dashboardStyles.card} style={{ flex: 1 }}>
            <h3 className={dashboardStyles.subHeading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TrophyIcon size={20} /> Top Ngựa Đua Xuất Sắc (Bảng Xếp Hạng Hệ Thống)
            </h3>
            <div className={dashboardStyles.tableWrapper}>
              <table className={dashboardStyles.table}>
                <thead>
                  <tr>
                    <th className={dashboardStyles.th}>Hạng</th>
                    <th className={dashboardStyles.th}>Tên ngựa</th>
                    <th className={dashboardStyles.th}>Giống</th>
                    <th className={dashboardStyles.th}>Điểm số</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.top_horses?.map(h => (
                    <tr key={h.horse_id} className={dashboardStyles.rowHover}>
                      <td className={dashboardStyles.td}>🏅 {h.rank}</td>
                      <td className={dashboardStyles.td}><b>{h.name}</b></td>
                      <td className={dashboardStyles.td}>{h.breed}</td>
                      <td className={dashboardStyles.td} style={{ color: "var(--color-burgundy)", fontWeight: "bold" }}>{h.total_points}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )}
      {/* TAB: Quản lý Giải đấu (Admin) */}
      {activeTab === "tournaments" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <TrophyIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Quản lý Giải đấu và Vòng đấu
          </h2>
          <div className={dashboardStyles.splitLayout}>
            {/* Create Tournament */}
            <form onSubmit={createTournament} className={dashboardStyles.formPanel}>
              <h3 className={dashboardStyles.subHeading}>Tạo Giải Đấu Mới</h3>
              <div className={dashboardStyles.formGroup}>
                <label>Tên giải đấu</label>
                <input type="text" className={dashboardStyles.inputField} placeholder="Ví dụ: Golden Cup 2026" required
                  value={newTournament.name} onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })} />
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Mô tả</label>
                <textarea className={dashboardStyles.inputField} placeholder="Chi tiết giải đấu..."
                  value={newTournament.description} onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })} />
              </div>
              <div style={styles.row}>
                <div className={dashboardStyles.formGroup} style={{ flex: 1 }}>
                  <label>Ngày bắt đầu</label>
                  <input type="date" className={dashboardStyles.inputField} required
                    value={newTournament.start_date} onChange={(e) => setNewTournament({ ...newTournament, start_date: e.target.value })} />
                </div>
                <div className={dashboardStyles.formGroup} style={{ flex: 1 }}>
                  <label>Ngày kết thúc</label>
                  <input type="date" className={dashboardStyles.inputField} required
                    value={newTournament.end_date} onChange={(e) => setNewTournament({ ...newTournament, end_date: e.target.value })} />
                </div>
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Địa điểm</label>
                <input type="text" className={dashboardStyles.inputField} placeholder="Ví dụ: Royal Track Arena" required
                  value={newTournament.location} onChange={(e) => setNewTournament({ ...newTournament, location: e.target.value })} />
              </div>
              <button type="submit" className={dashboardStyles.btnPrimary}>Tạo Giải Đấu</button>
            </form>


            {/* Create Round */}
            <form onSubmit={createRound} className={dashboardStyles.formPanel}>
              <h3 className={dashboardStyles.subHeading}>Thêm Vòng Đấu</h3>
              <div className={dashboardStyles.formGroup}>
                <label>Chọn giải đấu</label>
                <select className={dashboardStyles.inputField} required
                  value={newRound.tournament_id} onChange={(e) => setNewRound({ ...newRound, tournament_id: e.target.value })}>
                  <option value="">-- Chọn giải đấu --</option>
                  {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Tên vòng đấu</label>
                <input type="text" className={dashboardStyles.inputField} placeholder="Ví dụ: Bán kết, Chung kết" required
                  value={newRound.name} onChange={(e) => setNewRound({ ...newRound, name: e.target.value })} />
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Thứ tự vòng (Sequence)</label>
                <input 
                  type="number" 
                  className={dashboardStyles.inputField} 
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
              <button type="submit" className={dashboardStyles.btnPrimary}>Thêm Vòng Đấu</button>
            </form>
          </div>

          {/* Tournament List */}
          <div style={{ marginTop: "24px" }}>
            <h3 className={dashboardStyles.subHeading}>Danh sách Giải đấu hiện tại</h3>
            <div className={dashboardStyles.tableWrapper}>
              <table className={dashboardStyles.table}>
                <thead>
                  <tr>
                    <th className={dashboardStyles.th}>ID</th>
                    <th className={dashboardStyles.th}>Tên giải đấu</th>
                    <th className={dashboardStyles.th}>Địa điểm</th>
                    <th className={dashboardStyles.th}>Thời gian</th>
                    <th className={dashboardStyles.th}>Số vòng đấu</th>
                    <th className={dashboardStyles.th}>Trạng thái</th>
                    <th className={dashboardStyles.th}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map(t => (
                    <tr key={t.id} className={dashboardStyles.rowHover}>
                      <td className={dashboardStyles.td}>{t.id}</td>
                      <td className={dashboardStyles.td} style={{ fontWeight: "700" }}>{t.name}</td>
                      <td className={dashboardStyles.td}>{t.location}</td>
                      <td className={dashboardStyles.td}>{formatDate(t.start_date)} đến {formatDate(t.end_date)}</td>
                      <td className={dashboardStyles.td}>{t.rounds ? t.rounds.length : 0} vòng</td>                      
                      <td className={dashboardStyles.td}><span className={`${dashboardStyles.badge} ${dashboardStyles.badgeInfo}`}>{t.status}</span></td>
                      <td className={dashboardStyles.td}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {t.status === "UPCOMING" && (
                            <button 
                              type="button" 
                              className={dashboardStyles.btnPrimary} 
                              style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }} 
                              onClick={() => handleUpdateTournamentStatus(t.id, "ACTIVE")}
                            >
                              <PlayIcon size={12} /> Mở giải
                            </button>
                          )}
                          {t.status === "ACTIVE" && (
                            <button 
                              type="button" 
                              className={dashboardStyles.btnPrimary} 
                              style={{ padding: "6px 12px", fontSize: "12px", backgroundColor: "var(--color-forest)", color: "#fff", display: "inline-flex", alignItems: "center", gap: "4px" }} 
                              onClick={() => handleUpdateTournamentStatus(t.id, "COMPLETED")}
                            >
                              <FlagIcon size={12} /> Kết thúc & Trao thưởng
                            </button>
                          )}
                          <button 
                            type="button" 
                            className={dashboardStyles.btnSecondary} 
                            style={{ 
                              padding: "6px 12px", 
                              fontSize: "12px", 
                              color: "var(--danger)",
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                              background: "rgba(239, 68, 68, 0.05)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }} 
                            onClick={() => deleteTournament(t.id, t.name)}
                          >
                            <TrashIcon size={12} /> Xóa
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
      {/* TAB: Cấu hình Cơ cấu Giải thưởng */}
      {activeTab === "prizes" && (
        <div className={dashboardStyles.tabContent}>
          <PrizesPanel tournaments={tournaments} showMsg={showMsg} />
        </div>
      )}    
      {/* TAB: Xét duyệt Đăng ký (Admin) */}
      {activeTab === "registrations" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ListIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Danh sách và Xét duyệt Đăng ký thi đấu
          </h2>
          <div className={dashboardStyles.tableWrapper}>
            <table className={dashboardStyles.table}>
              <thead>
                <tr>
                  <th className={dashboardStyles.th}>Giải đấu</th>
                  <th className={dashboardStyles.th}>Ngựa đua</th>
                  <th className={dashboardStyles.th}>Jockey</th>
                  <th className={dashboardStyles.th}>Trạng thái đăng ký</th>
                  <th className={dashboardStyles.th}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: "center", color: "#64748b" }} className={dashboardStyles.td}>Chưa có đăng ký nào</td></tr>
                ) : (
                  registrations.map(r => {
                    const t = tournamentMap.get(r.tournament_id);
                    return (
                      <tr key={r.id} className={dashboardStyles.rowHover}>
                        <td className={dashboardStyles.td}>{t ? t.name : `Giải #${r.tournament_id}`}</td>
                        <td className={dashboardStyles.td} style={{ fontWeight: "700" }}>{r.horse_name}</td>
                        <td className={dashboardStyles.td}>{r.jockey_name}</td>
                        <td className={dashboardStyles.td}>
                          <span className={`${dashboardStyles.badge} ${r.status === "APPROVED" ? dashboardStyles.badgeApproved : r.status === "PENDING" ? dashboardStyles.badgePending : dashboardStyles.badgeRejected}`}>
                            {r.status}
                          </span>
                        </td>                        
                        <td className={dashboardStyles.td}>
                          {r.status === "PENDING" ? (
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                className={dashboardStyles.btnPrimary} 
                                style={{ padding: "4px 8px", fontSize: "12px", cursor: "pointer" }}
                                onClick={() => approveRegistration(r.id, "APPROVED")}
                              >
                                Duyệt
                              </button>
                              <button
                                className={dashboardStyles.btnSecondary}
                                style={{ padding: "4px 8px", fontSize: "12px", color: "var(--danger)", cursor: "pointer" }}
                                onClick={() => approveRegistration(r.id, "REJECTED")}
                              >
                                Từ chối
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <span style={{ fontSize: "12px", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <LockIcon size={12} style={{ color: "var(--color-text-muted)" }} /> Đã xử lý ({r.status})
                              </span>
                              <button
                                type="button"
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--color-burgundy)",
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
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FlagIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Lập lịch Trận đua và Xếp làn
          </h2>
          <div className={dashboardStyles.splitLayout}>
            {/* Create Race */}
            <form onSubmit={createRace} className={dashboardStyles.formPanel}>
              <h3 className={dashboardStyles.subHeading}>Tạo Trận Đua</h3>
              <div className={dashboardStyles.formGroup}>
                <label>Chọn Vòng đấu</label>
                <select className={dashboardStyles.inputField} required
                  value={newRace.round_id} onChange={(e) => setNewRace({ ...newRace, round_id: e.target.value })}>
                  <option value="">-- Chọn vòng đấu --</option>
                  {tournaments.flatMap(t => 
                    (t.rounds || []).map(r => (
                      <option key={r.id} value={r.id}>{t.name} - {r.name}</option>
                    ))
                  )}
                </select> 
              </div>   
              <div className={dashboardStyles.formGroup}>
                <label>Tên trận đua</label>
                <input type="text" className={dashboardStyles.inputField} placeholder="Ví dụ: Heat 1, Chung kết chính thức" required
                  value={newRace.name} onChange={(e) => setNewRace({ ...newRace, name: e.target.value })} />
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Thời gian diễn ra</label>
                <input type="datetime-local" className={dashboardStyles.inputField} required
                  value={newRace.race_time} onChange={(e) => setNewRace({ ...newRace, race_time: e.target.value })} />
              </div>
              <div style={styles.row}>
                <div className={dashboardStyles.formGroup} style={{ flex: 1 }}>
                  <label>Điều kiện sân bãi</label>
                  <input type="text" className={dashboardStyles.inputField} placeholder="Ví dụ: Good, Wet" required
                    value={newRace.track_condition} onChange={(e) => setNewRace({ ...newRace, track_condition: e.target.value })} />
                </div>
                <div className={dashboardStyles.formGroup} style={{ flex: 1 }}>
                  <label>Khoảng cách (mét)</label>
                  <input 
                    type="number" 
                    className={dashboardStyles.inputField} 
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
              <div className={dashboardStyles.formGroup}>
                <label>Phân công trọng tài</label>
                <select className={dashboardStyles.inputField}
                  value={newRace.referee_id} onChange={(e) => setNewRace({ ...newRace, referee_id: e.target.value })}>
                  <option value="">-- Không phân công / Phân công sau --</option>
                  {(referees || []).map(ref => (
                    <option key={ref.id} value={ref.id}>
                      {ref.full_name || `Trọng tài #${ref.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className={dashboardStyles.btnPrimary}>Tạo Trận Đua</button>
            </form>

            {/* Add participant / Xếp làn */}
            <form onSubmit={addParticipant} className={dashboardStyles.formPanel}>
              <h3 className={dashboardStyles.subHeading}>Xếp Làn Cho Ngựa Đua</h3>
              <div className={dashboardStyles.formGroup}>
                <label>Chọn trận đua</label>
                <select className={dashboardStyles.inputField} required
                  value={newParticipant.race_id} onChange={(e) => setNewParticipant({ ...newParticipant, race_id: e.target.value })}>
                  <option value="">-- Chọn trận đua --</option>
                  {races.map(rc => <option key={rc.id} value={rc.id}>{rc.name} ({formatDateTime(rc.race_time)})</option>)}
                </select>
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Chọn Cặp Ngựa - Jockey đã được duyệt</label>
                <select className={dashboardStyles.inputField} required
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
              <div className={dashboardStyles.formGroup}>
                <label>Làn số (Lane Number)</label>
                <input 
                  type="number" 
                  className={dashboardStyles.inputField} 
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
              <button type="submit" className={dashboardStyles.btnPrimary}>Xếp vào đường đua</button>
            </form>
          </div>

          {/* Race schedules list */}
          <div style={{ marginTop: "24px" }}>
            <h3 className={dashboardStyles.subHeading}>Lịch thi đấu các trận đua hiện tại</h3>
            <div className={dashboardStyles.tableWrapper}>
              <table className={dashboardStyles.table}>
                <thead>
                  <tr>
                    <th className={dashboardStyles.th}>Trận đua</th>
                    <th className={dashboardStyles.th}>Thời gian</th>
                    <th className={dashboardStyles.th}>Khoảng cách</th>
                    <th className={dashboardStyles.th}>Điều kiện</th>
                    <th className={dashboardStyles.th}>Trọng tài</th>
                    <th className={dashboardStyles.th}>Số ngựa thi đấu</th>
                    <th className={dashboardStyles.th}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {races.map(rc => (
                    <tr key={rc.id} className={dashboardStyles.rowHover}>
                      <td className={dashboardStyles.td} style={{ fontWeight: "700" }}>{rc.name}</td>
                      <td className={dashboardStyles.td}>{formatDateTime(rc.race_time)}</td>
                      <td className={dashboardStyles.td}>{rc.distance}m</td>
                      <td className={dashboardStyles.td}>{rc.track_condition}</td>
                      <td className={dashboardStyles.td}>{rc.referee_name || "Chưa phân công"}</td>
                      <td className={dashboardStyles.td}>{rc.participants?.length || 0} cặp</td>
                      <td className={dashboardStyles.td}>
                        <span className={`${dashboardStyles.badge} ${rc.status === "COMPLETED" ? dashboardStyles.badgeApproved : dashboardStyles.badgePending}`}>
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
  <div>
    <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <UsersIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Quản lý Thành viên hệ thống
    </h2>  
    
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
        <SearchIcon size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
        <input 
          type="text" 
          className={dashboardStyles.inputField} 
          style={{ paddingLeft: "36px", margin: 0, width: "100%" }}
          placeholder="Nhập tên tài khoản hoặc email để tìm kiếm..." 
          value={userSearch}
          onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} 
        />
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button 
          type="button" 
          className={dashboardStyles.btnPrimary} 
          style={{ width: "auto", padding: "10px 16px", margin: 0, display: "inline-flex", alignItems: "center", gap: "6px" }} 
          onClick={() => setShowCreateAdminModal(true)}
        >
          <PlusIcon size={16} /> Tạo Admin / Organizer
        </button>
      </div>
    </div>

    {/* 2. BẢNG DỮ LIỆU THÀNH VIÊN */}
    <div className={dashboardStyles.tableWrapper}>
      <table className={dashboardStyles.table}>        
        <thead>
          <tr>
            <th className={dashboardStyles.th}>ID</th>
            <th className={dashboardStyles.th}>Tên tài khoản</th>
            <th className={dashboardStyles.th}>Email</th>
            <th className={dashboardStyles.th}>Vai trò (Role)</th>
            <th className={dashboardStyles.th}>Trạng thái</th>
            <th className={dashboardStyles.th}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {(!users || !Array.isArray(users) || users.length === 0) ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", color: "#64748b" }} className={dashboardStyles.td}>
                Chưa có dữ liệu thành viên
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id} className={dashboardStyles.rowHover}>        
                <td className={dashboardStyles.td}>{u.id}</td> 
                <td style={{ fontWeight: "700" }} className={dashboardStyles.td}>{u.username}</td>
                <td className={dashboardStyles.td}>{u.email}</td>
                <td className={dashboardStyles.td}><span className={`${dashboardStyles.badge} ${dashboardStyles.badgeInfo}`}>{u.role_name}</span></td>
                <td className={dashboardStyles.td}>
                  {u.is_active ? (
                    <span className={`${dashboardStyles.badge} ${dashboardStyles.badgeApproved}`}>Đang hoạt động</span>
                  ) : (
                    <span className={`${dashboardStyles.badge} ${dashboardStyles.badgeRejected}`}>Đã khóa</span>
                  )}
                </td>
                <td className={dashboardStyles.td}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className={dashboardStyles.btnPrimary}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        backgroundColor: "var(--color-forest)", 
                        color: "#fff",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      onClick={() => handleViewUserDetails(u.id)}
                    >
                      <EyeIcon size={12} /> Xem chi tiết
                    </button>    
                    <button
                      className={u.is_active ? dashboardStyles.btnSecondary : dashboardStyles.btnPrimary}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        color: u.is_active ? "var(--danger)" : "#fff",
                        borderColor: u.is_active ? "rgba(239,68,68,0.3)" : "transparent",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                    >
                      {u.is_active ? <><LockIcon size={12} /> Khóa</> : <><KeyIcon size={12} /> Mở khóa</>}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>            
      </table>      
    </div>
    
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
      <button 
        type="button" 
        className={dashboardStyles.btnSecondary} 
        style={{ padding: "4px 10px" }} 
        disabled={userPage === 1} 
        onClick={() => setUserPage(p => p - 1)}
      >
        Trước
      </button>
      <span style={{ alignSelf: "center", fontSize: "14px" }}>Trang {userPage}</span>
      <button 
        type="button" 
        className={dashboardStyles.btnSecondary} 
        style={{ padding: "4px 10px" }} 
        disabled={users.length < 10} 
        onClick={() => setUserPage(p => p + 1)}
      >
        Sau
      </button>
    </div>

  </div>
)}      
      {showCreateAdminModal && (
        <div className={dashboardStyles.modalBackdrop}>
          <div className={dashboardStyles.modalContent}>
            <h3 className={dashboardStyles.modalTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <PlusIcon size={18} /> Tạo thành viên quản trị mới
            </h3>
            <form onSubmit={handleCreateAdmin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className={dashboardStyles.formGroup} style={{ margin: 0 }}>
                <label>Tên đăng nhập</label>
                <input type="text" className={dashboardStyles.inputField} placeholder="Ví dụ: admin_racing" required
                  value={adminForm.username} onChange={e => setAdminForm({...adminForm, username: e.target.value})} />
              </div>
              <div className={dashboardStyles.formGroup} style={{ margin: 0 }}>
                <label>Địa chỉ Email</label>
                <input type="email" className={dashboardStyles.inputField} placeholder="admin@example.com" required
                  value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} />
              </div>
              <div className={dashboardStyles.formGroup} style={{ margin: 0 }}>
                <label>Họ và tên</label>
                <input type="text" className={dashboardStyles.inputField} placeholder="Ví dụ: Nguyễn Văn Quản Trị" required
                  value={adminForm.fullName} onChange={e => setAdminForm({...adminForm, fullName: e.target.value})} />
              </div>
              <div className={dashboardStyles.formGroup} style={{ margin: 0 }}>
                <label>Mật khẩu tài khoản</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className={dashboardStyles.inputField} 
                    placeholder="Nhập mật khẩu bí mật" 
                    required
                    minLength="8"
                    style={{ paddingRight: "40px", width: "100%", margin: 0 }} 
                    value={adminForm.password} 
                    onChange={e => setAdminForm({...adminForm, password: e.target.value})} 
                  />    
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-muted)",
                      fontSize: "16px",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>
              <div className={dashboardStyles.formGroup} style={{ margin: 0 }}>
                <label>Chọn vai trò cấp phát</label>
                <select className={dashboardStyles.inputField} value={adminForm.roleName} onChange={e => setAdminForm({...adminForm, roleName: e.target.value})}>
                  <option value="ADMIN">ADMIN (Quản trị viên tối cao)</option>
                  <option value="ORGANIZER">ORGANIZER (Điều hành giải đấu)</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <button type="submit" className={dashboardStyles.btnPrimary} style={{ flex: 1, margin: 0 }}>Lưu thông tin</button>
                <button 
                  type="button" 
                  className={dashboardStyles.btnSecondary} 
                  style={{ flex: 1, margin: 0 }} 
                  onClick={() => {
                    setShowCreateAdminModal(false);
                    setShowPassword(false); 
                  }}
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT THÀNH VIÊN */}
      {showUserDetailModal && (
        <div className={dashboardStyles.modalBackdrop}>
          <div className={dashboardStyles.modalContent}>
            <h3 className={dashboardStyles.modalTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <UserIcon size={20} /> Chi tiết tài khoản
            </h3>
            {loadingDetail ? (
              <div style={{ textAlign: "center", padding: "20px", color: "var(--color-burgundy)", fontWeight: "bold" }}>Đang tải chi tiết...</div>
            ) : selectedUserDetails ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className={dashboardStyles.infoListItem}>
                  <label>Username:</label>
                  <span>{selectedUserDetails.username || "—"}</span>
                </div>
                <div className={dashboardStyles.infoListItem}>
                  <label>Họ và tên:</label>
                  <span>{selectedUserDetails.full_name || "—"}</span>
                </div>
                <div className={dashboardStyles.infoListItem}>
                  <label>Email:</label>
                  <span>{selectedUserDetails.email || "—"}</span>
                </div>
                <div className={dashboardStyles.infoListItem}>
                  <label>Số điện thoại:</label>
                  <span>{selectedUserDetails.phone_number || "Chưa có"}</span>
                </div>
                <div className={dashboardStyles.infoListItem}>
                  <label>Vai trò:</label>
                  <span className={`${dashboardStyles.badge} ${dashboardStyles.badgeInfo}`}>{selectedUserDetails.role_name}</span>
                </div>
                <div className={dashboardStyles.infoListItem}>
                  <label>Trạng thái:</label>
                  <span className={`${dashboardStyles.badge} ${selectedUserDetails.is_active ? dashboardStyles.badgeApproved : dashboardStyles.badgeRejected}`}>
                    {selectedUserDetails.is_active ? "Đang hoạt động" : "Đã khóa"}
                  </span>
                </div>
                
                {/* Chi tiết cho từng vai trò đặc thù */}
                {selectedUserDetails.role_name === "SPECTATOR" && selectedUserDetails.spectator_profile && (
                  <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed var(--color-border)" }}>
                    <h4 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--color-burgundy)" }}>Hồ sơ Khán giả</h4>
                    <div className={dashboardStyles.infoListItem}>
                      <label>Điểm tích lũy:</label>
                      <span>{selectedUserDetails.spectator_profile.reward_points ?? 0} pts</span>
                    </div>
                  </div>
                )}
                {selectedUserDetails.role_name === "JOCKEY" && selectedUserDetails.jockey_profile && (
                  <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed var(--color-border)" }}>
                    <h4 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--color-burgundy)" }}>Hồ sơ Jockey</h4>
                    <div className={dashboardStyles.infoListItem}>
                      <label>Số giấy phép:</label>
                      <span>{selectedUserDetails.jockey_profile.license_number || "—"}</span>
                    </div>
                    <div className={dashboardStyles.infoListItem}>
                      <label>Số năm kinh nghiệm:</label>
                      <span>{selectedUserDetails.jockey_profile.experience_years ?? 0} năm</span>
                    </div>
                  </div>
                )}
                {selectedUserDetails.role_name === "REFEREE" && selectedUserDetails.referee_profile && (
                  <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed var(--color-border)" }}>
                    <h4 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--color-burgundy)" }}>Hồ sơ Trọng tài</h4>
                    <div className={dashboardStyles.infoListItem}>
                      <label>Số giấy phép:</label>
                      <span>{selectedUserDetails.referee_profile.license_number || "—"}</span>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
                  <button
                    type="button"
                    className={dashboardStyles.btnPrimary}
                    style={{ width: "100%" }}
                    onClick={() => {
                      setShowUserDetailModal(false);
                      setSelectedUserDetails(null);
                    }}
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px", color: "var(--danger)" }}>Không thể tải thông tin chi tiết</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
