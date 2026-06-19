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
  const [loading, setLoading] = useState(true);

  // Form states
  const [newHorse, setNewHorse] = useState({ name: "", age: "", breed: "", gender: "Stallion" });
  const [newInvitation, setNewInvitation] = useState({ jockey_id: "", horse_id: "", tournament_id: "", message: "" });

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

  const createHorse = async (e) => {
    e.preventDefault();
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

  if (loading) {
    return <div style={styles.loading}>Đang tải dữ liệu Owner...</div>;
  }

  return (
    <>
      {/* TAB: Quản lý Ngựa (Owner) */}
      {activeTab === "my-horses" && (
        <div style={styles.tabContent}>
          <h2>🐎 Quản lý danh sách ngựa đua của bạn</h2>
          <div style={styles.splitLayout}>
            {/* Create Horse */}
            <form onSubmit={createHorse} style={styles.formPanel} className="glass">
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
                          <td>Jockey #{i.jockey_id}</td>
                          <td style={{ fontWeight: "700" }}>Ngựa #{i.horse_id}</td>
                          <td>Giải đấu #{i.tournament_id}</td>
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
                              style={{ padding: "6px 12px", fontSize: "12px", marginBottom: "4px", display: "block" }}
                              onClick={() => registerForTournament(t.id, inv.horse_id, inv.jockey_id)}
                            >
                              Đăng ký cặp #{inv.horse_id}
                            </button>
                          ))}
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
                      <td>{new Date(reg.registration_date).toLocaleDateString("vi-VN")}</td>
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
    </>
  );
}
