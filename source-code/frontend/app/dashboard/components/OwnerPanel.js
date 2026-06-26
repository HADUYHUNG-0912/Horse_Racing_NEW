"use client";

import { useEffect, useState } from "react";
import { api } from "../../api";
import { styles } from "./styles";

export default function OwnerPanel({ user, activeTab, showMsg }) {
  const [horses, setHorses] = useState([]);
  const [jockeys, setJockeys] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [upcomingRaces, setUpcomingRaces] = useState([]);
  const [resultHistory, setResultHistory] = useState([]);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone_number: "", company_name: "", avatar: "" });
  const [loading, setLoading] = useState(true);

  // Form states
  const [newHorse, setNewHorse] = useState({ name: "", age: "", breed: "", gender: "Stallion" });
  const [newInvitation, setNewInvitation] = useState({ jockey_id: "", horse_id: "", tournament_id: "", message: "" });
  const [editingHorse, setEditingHorse] = useState(null);
  const [editHorseForm, setEditHorseForm] = useState({ name: "", age: "", breed: "", gender: "Stallion" });

  const asArray = (data) => Array.isArray(data) ? data : data?.items || data?.data || [];
  const getJockeyLabel = (jockey) => {
    const name = jockey.full_name || jockey.username || `Jockey #${jockey.id}`;
    const experience = Number.isFinite(Number(jockey.experience_years))
      ? ` - Kinh nghiệm: ${jockey.experience_years} năm`
      : "";
    return `${name}${experience}`;
  };

  const loadData = async () => {
    try {
      const myHorses = await api.get("/horses");
      setHorses(asArray(myHorses));

      const listJockeys = await api.get("/jockeys");
      setJockeys(asArray(listJockeys));

      const invites = await api.get("/jockeys/invitations");
      setInvitations(asArray(invites));

      const tours = await api.get("/tournaments");
      setTournaments(asArray(tours));

      const ownerProfileData = await api.get("/owners/profile");
      setOwnerProfile(ownerProfileData);
      setProfileForm({
        full_name: ownerProfileData.full_name || "",
        phone_number: ownerProfileData.phone_number || "",
        company_name: ownerProfileData.company_name || "",
        avatar: ownerProfileData.avatar || ""
      });

      const races = await api.get("/owners/upcoming-races");
      setUpcomingRaces(Array.isArray(races) ? races : []);

      const results = await api.get("/owners/results");
      setResultHistory(Array.isArray(results) ? results : []);

      // Fetch registrations for each tournament (Task 3 - Thuỳ Anh)
      const allRegistrations = [];
      for (const tournament of asArray(tours)) {
        try {
          const tournamentRegs = await api.get(`/tournaments/${tournament.id}/registrations`);
          const regsArray = Array.isArray(tournamentRegs) ? tournamentRegs : tournamentRegs?.items || tournamentRegs?.data || [];
          regsArray.forEach(reg => {
            allRegistrations.push({ ...reg, tournament_name: tournament.name });
          });
        } catch (e) {
          console.error("Không tải được danh sách đăng ký của giải", tournament.id, e);
        }
      }
      setRegistrations(allRegistrations);
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

  const saveOwnerProfile = async (e) => {
    e.preventDefault();
    try {
      const updatedProfile = await api.put("/owners/profile", {
        full_name: profileForm.full_name,
        phone_number: profileForm.phone_number,
        company_name: profileForm.company_name,
        avatar: profileForm.avatar
      });
      setOwnerProfile(updatedProfile);
      setProfileForm({
        full_name: updatedProfile.full_name || "",
        phone_number: updatedProfile.phone_number || "",
        company_name: updatedProfile.company_name || "",
        avatar: updatedProfile.avatar || ""
      });
      showMsg("Cập nhật hồ sơ chủ sở hữu thành công!");
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const createHorse = async (e) => {
    e.preventDefault();
    if (parseInt(newHorse.age) < 2 || parseInt(newHorse.age) > 10) {
      showMsg("Tuổi ngựa phải từ 2 đến 10 năm!", "error");
      return;
    }
    try {
      await api.post("/horses/", {
        ...newHorse,
        age: parseInt(newHorse.age)
      });
      showMsg("Thêm ngựa thành công!");
      setNewHorse({ name: "", age: "", breed: "", gender: "Stallion" });
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const updateHorse = async (e) => {
    e.preventDefault();
    if (parseInt(editHorseForm.age) < 2 || parseInt(editHorseForm.age) > 10) {
      showMsg("Tuổi ngựa phải từ 2 đến 10 năm!", "error");
      return;
    }
    try {
      await api.put(`/horses/${editingHorse.id}`, {
        name: editHorseForm.name,
        age: parseInt(editHorseForm.age),
        breed: editHorseForm.breed,
        gender: editHorseForm.gender
      });
      showMsg("Cập nhật ngựa thành công!");
      setEditingHorse(null);
      setEditHorseForm({ name: "", age: "", breed: "", gender: "Stallion" });
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const deleteHorse = async (horseId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ngựa này?")) {
      return;
    }
    try {
      await api.delete(`/horses/${horseId}`);
      showMsg("Xóa ngựa thành công!");
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const startEditHorse = (horse) => {
    setEditingHorse(horse);
    setEditHorseForm({
      name: horse.name,
      age: horse.age.toString(),
      breed: horse.breed,
      gender: horse.gender
    });
  };

  const cancelEdit = () => {
    setEditingHorse(null);
    setEditHorseForm({ name: "", age: "", breed: "", gender: "Stallion" });
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
      loadData();
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
      loadData();
    } catch (err) {
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
    return <div style={styles.loading}>Đang tải dữ liệu Owner...</div>;
  }

  const horseMap = new Map(horses.map(h => [h.id, h.name]));
  const jockeyMap = new Map(jockeys.map(j => [j.id, j.full_name || j.username]));
  const tournamentMap = new Map(tournaments.map(t => [t.id, t.name]));

  return (
    <>
      {/* TAB: Quản lý Ngựa (Owner) */}
      {activeTab === "my-horses" && (
        <div style={styles.tabContent}>
          <h2>🐎 Quản lý danh sách ngựa đua của bạn</h2>
          <div style={styles.splitLayout}>
            {/* Edit or Create Horse */}
            <form onSubmit={editingHorse ? updateHorse : createHorse} style={styles.formPanel} className="glass">
              <h3>{editingHorse ? "✏️ Chỉnh sửa Ngựa" : "Đăng Ký Ngựa Mới"}</h3>
              <div className="form-group">
                <label>Tên ngựa đua</label>
                <input type="text" className="input-field" placeholder="Ví dụ: Thunderbolt II" required
                  value={editingHorse ? editHorseForm.name : newHorse.name} 
                  onChange={(e) => editingHorse ? setEditHorseForm({ ...editHorseForm, name: e.target.value }) : setNewHorse({ ...newHorse, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Tuổi (2-10 năm)</label>
                <input type="number" className="input-field" placeholder="Ví dụ: 4" required min="2" max="10"
                  value={editingHorse ? editHorseForm.age : newHorse.age} 
                  onChange={(e) => editingHorse ? setEditHorseForm({ ...editHorseForm, age: e.target.value }) : setNewHorse({ ...newHorse, age: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Giống ngựa</label>
                <select className="input-field" required
                  value={editingHorse ? editHorseForm.breed : newHorse.breed} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingHorse) {
                      setEditHorseForm({ ...editHorseForm, breed: val });
                    } else {
                      setNewHorse({ ...newHorse, breed: val });
                    }
                  }}>
                  <option value="">-- Chọn giống ngựa --</option>
                  <option value="Thoroughbred">Thoroughbred</option>
                  <option value="Arabian">Arabian</option>
                  <option value="Quarter Horse">Quarter Horse</option>
                  <option value="Appaloosa">Appaloosa</option>
                  <option value="Morgan">Morgan</option>
                  <option value="Standardbred">Standardbred</option>
                  <option value="Warmblood">Warmblood</option>
                  <option value="Paint Horse">Paint Horse</option>
                  <option value="__other__">Khác</option>
                </select>
                {(editingHorse ? editHorseForm.breed !== "" && !["Thoroughbred","Arabian","Quarter Horse","Appaloosa","Morgan","Standardbred","Warmblood","Paint Horse"].includes(editHorseForm.breed) : newHorse.breed !== "" && !["Thoroughbred","Arabian","Quarter Horse","Appaloosa","Morgan","Standardbred","Warmblood","Paint Horse"].includes(newHorse.breed)) && (
                  <>
                    <input type="text" className="input-field" placeholder="Nhập giống ngựa khác..." style={{ marginTop: "8px" }} required
                      value={editingHorse ? (editHorseForm.breed === "__other__" ? "" : editHorseForm.breed) : (newHorse.breed === "__other__" ? "" : newHorse.breed)}
                      onChange={(e) => editingHorse ? setEditHorseForm({ ...editHorseForm, breed: e.target.value }) : setNewHorse({ ...newHorse, breed: e.target.value })} />
                    <p style={{ color: "#eab308", fontSize: "12px", marginTop: "4px" }}>⚠️ Giống ngựa này chưa có trong hệ thống, vui lòng kiểm tra lại.</p>
                  </>
                )}
              </div>
              <div className="form-group">
                <label>Giới tính</label>
                <select className="input-field"
                  value={editingHorse ? editHorseForm.gender : newHorse.gender} 
                  onChange={(e) => editingHorse ? setEditHorseForm({ ...editHorseForm, gender: e.target.value }) : setNewHorse({ ...newHorse, gender: e.target.value })}>
                  <option value="Stallion">Stallion (Ngựa đực)</option>
                  <option value="Mare">Mare (Ngựa cái)</option>
                  <option value="Gelding">Gelding (Ngựa thiến)</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingHorse ? "Lưu Thay đổi" : "Đăng ký Ngựa"}</button>
                {editingHorse && (
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={cancelEdit}>Hủy</button>
                )}
              </div>
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
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horses.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: "center", color: "#64748b" }}>Chưa có ngựa đua nào được đăng ký</td></tr>
                    ) : (
                      horses.map(h => (
                        <tr key={h.id}>
                          <td style={{ fontWeight: "700" }}>{h.name}</td>
                          <td>{h.age} tuổi</td>
                          <td>{h.breed}</td>
                          <td>{h.gender}</td>
                          <td style={{ display: "flex", gap: "6px" }}>
                            <button className="btn-primary" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => startEditHorse(h)}>✏️ Sửa</button>
                            <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: "11px", backgroundColor: "#ef4444" }} onClick={() => deleteHorse(h.id)}>🗑️ Xóa</button>
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

      {/* TAB: Mời Jockey (Owner) */}
      {activeTab === "invite-jockey" && (
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
                  {jockeys.length === 0 && (
                    <option value="" disabled>Chưa có Jockey nào trong hệ thống</option>
                  )}
                  {jockeys.map(j => (
                    <option key={j.id} value={j.id}>{getJockeyLabel(j)}</option>
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
                    {invitations.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: "center", color: "#64748b" }}>Chưa gửi lời mời nào</td></tr>
                    ) : (
                      invitations.map(i => (
                        <tr key={i.id}>
                          <td>{i.jockey_name || `Jockey #${i.jockey_id}`}</td>
                          <td style={{ fontWeight: "700" }}>{i.horse_name || `Ngựa #${i.horse_id}`}</td>
                          <td>{i.tournament_name || `Giải đấu #${i.tournament_id}`}</td>
                          <td>
                            <span className={`badge ${i.status === "ACCEPTED" ? "badge-approved" : i.status === "PENDING" ? "badge-pending" : "badge-rejected"}`}>
                              {i.status}
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

      {/* TAB: Đăng ký Giải đấu (Owner) */}
      {activeTab === "register-tournament" && (
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
                {tournaments.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: "center", color: "#64748b" }}>Không tìm thấy giải đấu nào</td></tr>
                ) : (
                  tournaments.map(t => {
                    const acceptedInvites = invitations.filter(i => i.tournament_id === t.id && i.status === "ACCEPTED");

                    return (
                      <tr key={t.id}>
                        <td style={{ fontWeight: "700" }}>{t.name}</td>
                        <td>{t.location}</td>
                        <td>{formatDate(t.start_date)} đến {formatDate(t.end_date)}</td>
                        <td>
                          {acceptedInvites.length === 0 ? (
                            <span style={{ color: "#64748b", fontSize: "13px" }}>Cần mời và được Jockey đồng ý trước</span>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {acceptedInvites.map(inv => (
                                <div key={inv.id} style={{ fontSize: "13px" }}>
                                  🏇 {inv.horse_name || `Ngựa #${inv.horse_id}`} & {inv.jockey_name || `Jockey #${inv.jockey_id}`}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          {acceptedInvites.map(inv => {
                            const isRegistered = registrations.some(
                              reg => reg.tournament_id === t.id && reg.horse_id === inv.horse_id
                            );
                            return isRegistered ? (
                              <span key={inv.id} className="badge badge-approved" style={{ display: "block", marginBottom: "4px", padding: "6px 12px", textAlign: "center", fontSize: "12px" }}>
                                ✓ Đã đăng ký
                              </span>
                            ) : (
                              <button
                                key={inv.id}
                                className="btn-primary"
                                style={{ padding: "6px 12px", fontSize: "12px", marginBottom: "4px", display: "block", width: "100%" }}
                                onClick={() => registerForTournament(t.id, inv.horse_id, inv.jockey_id)}
                              >
                                Đăng ký: {inv.horse_name || `#${inv.horse_id}`}
                              </button>
                            );
                          })}
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

      {/* TAB: Danh sách giải đấu đã đăng ký (Owner) */}
      {activeTab === "my-registrations" && (
        <div style={styles.tabContent}>
          <h2>📋 Danh sách giải đấu đã đăng ký</h2>
          <p style={{ color: "#94a3b8", marginBottom: "16px" }}>Xem trạng thái duyệt hồ sơ đăng ký của bạn từ Admin (PENDING: Chờ duyệt, APPROVED: Đã chấp nhận, REJECTED: Bị từ chối)</p>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Tên giải đấu</th>
                  <th>Ngựa</th>
                  <th>Jockey</th>
                  <th>Ngày đăng ký</th>
                  <th>Trạng thái duyệt</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: "center", color: "#64748b" }}>Chưa đăng ký giải đấu nào</td></tr>
                ) : (
                  registrations.map(reg => (
                    <tr key={reg.id}>
                      <td style={{ fontWeight: "700" }}>{reg.tournament_name}</td>
                      <td>{reg.horse_name || `Ngựa #${reg.horse_id}`}</td>
                      <td>{reg.jockey_name || `Jockey #${reg.jockey_id}`}</td>
                      <td>{formatDate(reg.registration_date)}</td>
                      <td>
                        <span className={`badge ${
                          reg.status === "APPROVED" ? "badge-approved" :
                          reg.status === "PENDING" ? "badge-pending" :
                          "badge-rejected"
                        }`}>
                          {reg.status === "APPROVED" ? "✓ Đã chấp nhận" :
                           reg.status === "PENDING" ? "⏳ Chờ duyệt" :
                           "✗ Bị từ chối"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Lịch thi đấu của Ngựa (Owner) */}
      {activeTab === "upcoming-races" && (
        <div style={styles.tabContent}>
          <h2>📅 Lịch thi đấu của Ngựa</h2>
          <p style={{ color: "#94a3b8", marginBottom: "16px" }}>
            Những trận đua sắp tới cho ngựa của bạn.
          </p>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Ngựa</th>
                  <th>Giải đấu</th>
                  <th>Ngày giờ</th>
                  <th>Địa điểm</th>
                </tr>
              </thead>
              <tbody>
                {upcomingRaces.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: "center", color: "#64748b" }}>Không có lịch thi đấu nào sắp tới</td></tr>
                ) : (
                  upcomingRaces.map(r => (
                    <tr key={r.race_id}>
                      <td style={{ fontWeight: "700" }}>{r.horse_name}</td>
                      <td>{r.tournament_name}</td>
                      <td>{formatDateTime(r.race_date)}</td>
                      <td>{r.location || "Chưa rõ"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "results" && (
        <div style={styles.tabContent}>
          <h2>🏁 Kết quả thi đấu</h2>
          <p style={{ color: "#94a3b8", marginBottom: "16px" }}>
            Lịch sử xếp hạng và vi phạm của ngựa của bạn.
          </p>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Ngựa</th>
                  <th>Cuộc đua</th>
                  <th>Giải đấu</th>
                  <th>Rank</th>
                  <th>Điểm</th>
                  <th>Ghi chú</th>
                  <th>Vi phạm</th>
                </tr>
              </thead>
              <tbody>
                {resultHistory.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: "center", color: "#64748b" }}>Chưa có kết quả nào</td></tr>
                ) : (
                  resultHistory.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: "700" }}>{item.horse_name}</td>
                      <td>{item.race_name}</td>
                      <td>{item.tournament_name}</td>
                      <td>{item.rank ?? "-"}</td>
                      <td>{item.points ?? "-"}</td>
                      <td>{item.notes || "-"}</td>
                      <td>{item.violation_count > 0 ? item.violations : "Không có"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Hồ sơ cá nhân Owner */}
      {activeTab === "profile" && (
        <div style={styles.tabContent}>
          <h2>👤 Hồ sơ cá nhân Chủ Sở Hữu</h2>
          <div style={styles.splitLayout}>
            <form onSubmit={saveOwnerProfile} style={styles.formPanel} className="glass">
              <h3>Chỉnh sửa thông tin</h3>
              <div className="form-group">
                <label>Họ tên</label>
                <input
                  type="text"
                  className="input-field"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="text"
                  className="input-field"
                  value={profileForm.phone_number}
                  onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Công ty / Tên đội</label>
                <input
                  type="text"
                  className="input-field"
                  value={profileForm.company_name}
                  onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Avatar (URL)</label>
                <input
                  type="text"
                  className="input-field"
                  value={profileForm.avatar}
                  onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-primary">Lưu thay đổi</button>
            </form>

            <div style={{ flex: 1.2, minWidth: "280px" }}>
              <div style={styles.formPanel} className="glass">
                <h3>Thông tin hiện tại</h3>
                {ownerProfile ? (
                  <div style={{ display: "grid", gap: "12px" }}>
                    <div><strong>Họ tên:</strong> {ownerProfile.full_name}</div>
                    <div><strong>Email:</strong> {ownerProfile.email}</div>
                    <div><strong>SĐT:</strong> {ownerProfile.phone_number || "Chưa có"}</div>
                    <div>
                      <strong>Avatar:</strong>
                      {ownerProfile.avatar ? (
                        <img
                          src={ownerProfile.avatar}
                          alt="Owner Avatar"
                          width={80}
                          height={80}
                          style={{
                            display: "block",
                            marginTop: "8px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            backgroundColor: "#f1f5f9"
                          }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/fallback-avatar.png";
                          }}
                        />
                      ) : (
                        <span>Chưa có</span>
                      )}
                    </div>
                    <div><strong>Công ty:</strong> {ownerProfile.company_name || "Chưa có"}</div>
                  </div>
                ) : (
                  <p style={{ color: "#94a3b8" }}>Đang tải thông tin hồ sơ...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
