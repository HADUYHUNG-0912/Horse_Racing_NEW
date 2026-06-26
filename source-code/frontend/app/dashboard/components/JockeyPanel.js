"use client";

import { useEffect, useState } from "react";
import { api } from "../../api";
import { styles } from "./styles";

// FIX: import { jockeyApi } từ "../../api" gây lỗi
// "Cannot read properties of undefined (reading 'respondToInvitation')"
// vì jockeyApi bị undefined hoặc không có method respondToInvitation.
// Thay vào đó, gọi trực tiếp qua "api" (object đã chắc chắn hoạt động vì
// api.get đang được dùng thành công ở loadData) để không bị crash.

export default function JockeyPanel({ user, activeTab, showMsg }) {
  const [invitations, setInvitations] = useState([]);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab Giải thưởng
  const [rankings, setRankings] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("all");
  const [rankingsLoading, setRankingsLoading] = useState(true);

  // FIX (Task 4): KHÔNG còn dùng localStorage. Hồ sơ được nạp từ API
  // (GET /jockeys/profile) khi component mount, và lưu xuống Database
  // qua API (PUT /jockeys/profile) khi submit form.
  // - Bỏ field "phone" vì cột này chưa tồn tại trong bảng JockeyProfiles.
  // - "experience" (text tự do) đổi thành "experience_years" (số nguyên)
  //   để khớp đúng cột experience_years (INT) trong Database.
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    weight: "",
    height: "",
    experience_years: "",
    email: user?.email || "",
    bio: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  const loadData = async () => {
    try {
      const invites = await api.get("/jockeys/invitations");
      // FIX: đảm bảo luôn là array, tránh crash nếu API trả về dạng khác (object lỗi, null...)
      setInvitations(Array.isArray(invites) ? invites : []);

      const allRaces = await api.get("/races");
      setRaces(Array.isArray(allRaces) ? allRaces : []);
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // FIX (Task 4): nạp hồ sơ thật từ Database thay vì đọc localStorage
  const loadProfile = async () => {
    try {
      const data = await api.get("/jockeys/profile");
      setProfile({
        full_name: data?.full_name ?? user?.full_name ?? "",
        weight: data?.weight ?? "",
        height: data?.height ?? "",
        experience_years: data?.experience_years ?? "",
        email: data?.email ?? user?.email ?? "",
        bio: data?.bio ?? "",
      });
    } catch (err) {
      showMsg(err?.message || "Không thể tải hồ sơ cá nhân!", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const loadRankings = async () => {
    try {
      const [rankData, tourData] = await Promise.all([
        api.get("/results/rankings"),
        api.get("/tournaments"),
      ]);
      setRankings(Array.isArray(rankData) ? rankData : []);
      setTournaments(Array.isArray(tourData) ? tourData : []);
    } catch (err) {
      // rankings không critical
    } finally {
      setRankingsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadProfile();
    loadRankings();
  }, []);

  const respondInvitation = async (id, status) => {
    const actionName = status === 'ACCEPTED' ? 'CHẤP NHẬN' : 'TỪ CHỐI';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} lời mời này?`)) {
      return;
    }

    try {
      // FIX: gọi qua api.put trực tiếp thay vì jockeyApi.respondToInvitation
      // (jockeyApi/method đó không tồn tại -> gây lỗi "Cannot read properties of undefined")
      await api.put(`/jockeys/invitations/${id}`, { status });
      setInvitations(prevInvites =>
        prevInvites.map(inv => inv.id === id ? { ...inv, status: status } : inv)
      );
      showMsg(status === "ACCEPTED" ? "Đã chấp nhận lời mời!" : "Đã từ chối lời mời.");
    } catch (err) {
      // FIX: trước đây catch vẫn cập nhật state thành công và hiện message thành công
      // dù request thất bại -> dữ liệu UI sai lệch với server. Giờ chỉ báo lỗi thật.
      showMsg(err?.message || "Không thể xử lý lời mời. Vui lòng thử lại!", "error");
    }
  };

  // FIX (Task 4): lưu hồ sơ xuống Database qua API thay vì localStorage.
  // localStorage chỉ tồn tại trên máy của từng người dùng -> Chủ ngựa/Admin
  // không thể xem được hồ sơ, và gây lỗi Hydration Mismatch của Next.js
  // (vì localStorage không tồn tại khi server render).
  // Validate form profile trước khi gửi API
  const validateProfile = () => {
    const errors = {};
    if (!profile.full_name?.trim()) errors.full_name = "Họ tên không được để trống";
    if (!profile.email?.trim()) errors.email = "Email không được để trống";

    const weight = Number(profile.weight);
    if (profile.weight === "" || isNaN(weight)) errors.weight = "Cân nặng không được để trống";
    else if (weight <= 0) errors.weight = "Cân nặng phải lớn hơn 0";
    else if (weight > 300) errors.weight = "Cân nặng không hợp lệ (tối đa 300kg)";

    if (profile.height !== "" && profile.height !== null) {
      const height = Number(profile.height);
      if (isNaN(height) || height <= 0) errors.height = "Chiều cao phải lớn hơn 0";
      else if (height > 250) errors.height = "Chiều cao không hợp lệ (tối đa 250cm)";
    }

    const expYears = Number(profile.experience_years);
    if (profile.experience_years === "" || isNaN(expYears)) errors.experience_years = "Số năm kinh nghiệm không được để trống";
    else if (expYears < 0) errors.experience_years = "Số năm kinh nghiệm không thể âm";
    else if (expYears > 50) errors.experience_years = "Số năm kinh nghiệm không hợp lệ (tối đa 50 năm)";

    return errors;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    // Validate trước khi gọi API
    const errors = validateProfile();
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) {
      showMsg("Vui lòng kiểm tra lại thông tin nhập!", "error");
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        full_name: profile.full_name.trim(),
        weight: Number(profile.weight),
        height: profile.height === "" ? null : Number(profile.height),
        experience_years: Number(profile.experience_years),
        email: profile.email.trim(),
        bio: profile.bio?.trim() || null,
      };
      const updated = await api.put("/jockeys/profile", payload);
      setProfile({
        full_name: updated?.full_name ?? profile.full_name,
        weight: updated?.weight ?? "",
        height: updated?.height ?? "",
        experience_years: updated?.experience_years ?? "",
        email: updated?.email ?? profile.email,
        bio: updated?.bio ?? "",
      });
      setProfileErrors({});
      showMsg("Cập nhật thông tin hồ sơ Jockey thành công!");
    } catch (err) {
      showMsg(err?.message || "Không thể lưu hồ sơ. Vui lòng thử lại!", "error");
    } finally {
      setSavingProfile(false);
    }
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
    return <div style={styles.loading}>Đang tải dữ liệu Jockey...</div>;
  }

  // FIX: tính trước danh sách race của jockey hiện tại, dùng optional chaining
  // để tránh crash khi participants bị thiếu/null hoặc user chưa có full_name
  const myRaces = races.filter(r =>
    Array.isArray(r?.participants) &&
    r.participants.some(p => p.jockey_name === profile.full_name)
  );

  return (
    <>
      {/* TAB: Lời mời Nhận được (Jockey) */}
      {activeTab === "invitations" && (
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
                      <td>{inv.owner_name || `Chủ ngựa #${inv.owner_id}`}</td>
                      <td style={{ fontWeight: "700" }}>{inv.horse_name || `Ngựa #${inv.horse_id}`}</td>
                      <td>{inv.tournament_name || `Giải đấu #${inv.tournament_id}`}</td>
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
      {activeTab === "jockey-races" && (
        <div style={styles.tabContent}>
          <h2>🏁 Lịch trình các trận đua đã đăng ký</h2>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Trận đua</th>
                  <th>Ngựa đua</th>
                  <th>Thời gian đua</th>
                  <th>Khoảng cách</th>
                  <th>Đường chạy</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {myRaces.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", color: "#64748b" }}>Chưa có lịch thi đấu nào</td></tr>
                ) : (
                  myRaces.map(rc => {
                    const myParticipation = rc.participants.find(p => p.jockey_name === profile.full_name);
                    return (
                      <tr key={rc.id}>
                        <td style={{ fontWeight: "700" }}>{rc.name}</td>
                        <td style={{ color: "#38bdf8", fontWeight: "600" }}>
                          {myParticipation?.horse_name || "Chưa rõ"}
                        </td>
                        <td>{formatDateTime(rc.race_time)}</td>
                        <td>{rc.distance}m</td>
                        <td>{rc.track_condition}</td>
                        <td>
                          <span className={`badge ${rc.status === "COMPLETED" ? "badge-approved" : "badge-pending"}`}>
                            {rc.status}
                          </span>
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

      {/* TASK 4: TAB CẬP NHẬT HỒ SƠ CÁ NHÂN */}
      {activeTab === "profile" && (
        <div style={styles.tabContent}>
          <h2>👤 Hồ sơ cá nhân Jockey: {user?.full_name}</h2>
          {profileLoading ? (
            <div style={styles.loading}>Đang tải hồ sơ...</div>
          ) : (
            <form onSubmit={handleSaveProfile} style={{ maxWidth: "520px", marginTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Họ và tên */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontWeight: "600", color: "#94a3b8" }}>Họ và tên <span style={{ color: "var(--danger)" }}>*</span></label>
                <input
                  type="text"
                  value={profile.full_name}
                  placeholder="Nhập họ và tên đầy đủ"
                  style={{ padding: "10px", borderRadius: "6px", border: `1px solid ${profileErrors.full_name ? "var(--danger)" : "#334155"}`, background: "#1e293b", color: "#fff" }}
                  onChange={(e) => { setProfile({ ...profile, full_name: e.target.value }); setProfileErrors({ ...profileErrors, full_name: "" }); }}
                />
                {profileErrors.full_name && <span style={{ color: "var(--danger)", fontSize: "12px" }}>⚠ {profileErrors.full_name}</span>}
              </div>

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontWeight: "600", color: "#94a3b8" }}>Địa chỉ Email <span style={{ color: "var(--danger)" }}>*</span></label>
                <input
                  type="email"
                  value={profile.email}
                  placeholder="example@email.com"
                  style={{ padding: "10px", borderRadius: "6px", border: `1px solid ${profileErrors.email ? "var(--danger)" : "#334155"}`, background: "#1e293b", color: "#fff" }}
                  onChange={(e) => { setProfile({ ...profile, email: e.target.value }); setProfileErrors({ ...profileErrors, email: "" }); }}
                />
                {profileErrors.email && <span style={{ color: "var(--danger)", fontSize: "12px" }}>⚠ {profileErrors.email}</span>}
              </div>

              {/* Cân nặng + Chiều cao trên cùng 1 hàng */}
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontWeight: "600", color: "#94a3b8" }}>Cân nặng (kg) <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    type="number"
                    value={profile.weight}
                    placeholder="Ví dụ: 55"
                    min="1" max="300" step="0.1"
                    style={{ padding: "10px", borderRadius: "6px", border: `1px solid ${profileErrors.weight ? "var(--danger)" : "#334155"}`, background: "#1e293b", color: "#fff" }}
                    onChange={(e) => { setProfile({ ...profile, weight: e.target.value }); setProfileErrors({ ...profileErrors, weight: "" }); }}
                  />
                  {profileErrors.weight && <span style={{ color: "var(--danger)", fontSize: "12px" }}>⚠ {profileErrors.weight}</span>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontWeight: "600", color: "#94a3b8" }}>Chiều cao (cm)</label>
                  <input
                    type="number"
                    value={profile.height}
                    placeholder="Ví dụ: 170"
                    min="1" max="250" step="0.1"
                    style={{ padding: "10px", borderRadius: "6px", border: `1px solid ${profileErrors.height ? "var(--danger)" : "#334155"}`, background: "#1e293b", color: "#fff" }}
                    onChange={(e) => { setProfile({ ...profile, height: e.target.value }); setProfileErrors({ ...profileErrors, height: "" }); }}
                  />
                  {profileErrors.height && <span style={{ color: "var(--danger)", fontSize: "12px" }}>⚠ {profileErrors.height}</span>}
                </div>
              </div>

              {/* Số năm kinh nghiệm */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontWeight: "600", color: "#94a3b8" }}>Số năm kinh nghiệm thi đấu <span style={{ color: "var(--danger)" }}>*</span></label>
                <input
                  type="number"
                  value={profile.experience_years}
                  placeholder="Ví dụ: 5"
                  min="0" max="50"
                  style={{ padding: "10px", borderRadius: "6px", border: `1px solid ${profileErrors.experience_years ? "var(--danger)" : "#334155"}`, background: "#1e293b", color: "#fff" }}
                  onChange={(e) => { setProfile({ ...profile, experience_years: e.target.value }); setProfileErrors({ ...profileErrors, experience_years: "" }); }}
                />
                {profileErrors.experience_years && <span style={{ color: "var(--danger)", fontSize: "12px" }}>⚠ {profileErrors.experience_years}</span>}
              </div>

              {/* Giới thiệu bản thân */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontWeight: "600", color: "#94a3b8" }}>Giới thiệu bản thân</label>
                <textarea
                  rows="4"
                  value={profile.bio}
                  placeholder="Mô tả ngắn về bản thân, thành tích nổi bật, phong cách thi đấu..."
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #334155", background: "#1e293b", color: "#fff", resize: "vertical", fontFamily: "inherit" }}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                />
              </div>

              {/* Nút lưu */}
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: "12px", fontSize: "14px", fontWeight: "600", marginTop: "4px", opacity: savingProfile ? 0.7 : 1, cursor: savingProfile ? "not-allowed" : "pointer" }}
                disabled={savingProfile}
              >
                {savingProfile ? "⏳ Đang lưu..." : "💾 Lưu thay đổi hồ sơ"}
              </button>

              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                <span style={{ color: "var(--danger)" }}>*</span> Trường bắt buộc
              </p>
            </form>
          )}
        </div>
      )}

      {/* TAB: Xem giải thưởng (Jockey) */}
      {activeTab === "jockey-rewards" && (
        <div style={styles.tabContent}>
          <h2>🏆 Giải thưởng & Thành tích thi đấu</h2>

          {/* Bộ lọc theo giải đấu */}
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <label style={{ color: "#94a3b8", fontWeight: "600" }}>Lọc theo giải đấu:</label>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #334155", background: "#1e293b", color: "#fff", minWidth: "220px" }}
            >
              <option value="all">Tất cả giải đấu</option>
              {tournaments.map(t => (
                <option key={t.id} value={String(t.id)}>{t.name}</option>
              ))}
            </select>
          </div>

          {rankingsLoading ? (
            <div style={styles.loading}>Đang tải dữ liệu giải thưởng...</div>
          ) : (() => {
            // Lọc chỉ lấy ranking của Jockey hiện tại
            const myRankings = rankings.filter(r =>
              r.entity_type === "JOCKEY" &&
              r.entity_name === user?.full_name &&
              (selectedTournament === "all" || String(r.tournament_id) === selectedTournament)
            );

            // Thống kê tổng hợp
            const totalPoints = myRankings.reduce((sum, r) => sum + (r.points || 0), 0);
            const bestRank = myRankings.length > 0 ? Math.min(...myRankings.map(r => r.rank)) : null;

            return (
              <>
                {/* Thẻ thống kê tổng quan */}
                <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "140px", background: "linear-gradient(135deg, #1e3a5f, #0f2040)", borderRadius: "12px", padding: "16px 20px", border: "1px solid #334155" }}>
                    <div style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "6px" }}>TỔNG ĐIỂM</div>
                    <div style={{ color: "var(--primary)", fontSize: "28px", fontWeight: "800" }}>{totalPoints}</div>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>điểm tích lũy</div>
                  </div>
                  <div style={{ flex: 1, minWidth: "140px", background: "linear-gradient(135deg, #3b1f1f, #200f0f)", borderRadius: "12px", padding: "16px 20px", border: "1px solid #334155" }}>
                    <div style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "6px" }}>HẠNG CAO NHẤT</div>
                    <div style={{ color: "#f59e0b", fontSize: "28px", fontWeight: "800" }}>
                      {bestRank ? `#${bestRank}` : "—"}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>trong các giải</div>
                  </div>
                  <div style={{ flex: 1, minWidth: "140px", background: "linear-gradient(135deg, #1a3320, #0d1f14)", borderRadius: "12px", padding: "16px 20px", border: "1px solid #334155" }}>
                    <div style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "6px" }}>SỐ GIẢI ĐÃ THAM GIA</div>
                    <div style={{ color: "#22c55e", fontSize: "28px", fontWeight: "800" }}>{myRankings.length}</div>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>giải đấu</div>
                  </div>
                </div>

                {/* Bảng chi tiết giải thưởng */}
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th>Giải đấu</th>
                        <th>Hạng</th>
                        <th>Điểm</th>
                        <th>Cập nhật lúc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myRankings.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: "center", color: "#64748b", padding: "32px" }}>
                            {selectedTournament === "all"
                              ? "Chưa có thành tích nào được ghi nhận"
                              : "Không có thành tích trong giải đấu này"}
                          </td>
                        </tr>
                      ) : (
                        myRankings
                          .sort((a, b) => a.rank - b.rank)
                          .map((r, i) => (
                            <tr key={r.id || i}>
                              <td style={{ fontWeight: "600" }}>
                                {tournaments.find(t => t.id === r.tournament_id)?.name || `Giải đấu #${r.tournament_id || "—"}`}
                              </td>
                              <td>
                                <span style={{
                                  fontWeight: "800", fontSize: "16px",
                                  color: r.rank === 1 ? "#f59e0b" : r.rank === 2 ? "#94a3b8" : r.rank === 3 ? "#cd7f32" : "var(--primary)"
                                }}>
                                  {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                                </span>
                              </td>
                              <td style={{ color: "var(--primary)", fontWeight: "700" }}>{r.points} điểm</td>
                              <td style={{ color: "#64748b", fontSize: "13px" }}>
                                {r.updated_at ? new Date(r.updated_at).toLocaleDateString("vi-VN") : "—"}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </>
  );
}