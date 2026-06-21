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

  // FIX (Task 4): KHÔNG còn dùng localStorage. Hồ sơ được nạp từ API
  // (GET /jockeys/profile) khi component mount, và lưu xuống Database
  // qua API (PUT /jockeys/profile) khi submit form.
  // - Bỏ field "phone" vì cột này chưa tồn tại trong bảng JockeyProfiles.
  // - "experience" (text tự do) đổi thành "experience_years" (số nguyên)
  //   để khớp đúng cột experience_years (INT) trong Database.
  const [profile, setProfile] = useState({
    weight: "",
    experience_years: "",
    email: user?.email || "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

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
        weight: data?.weight ?? "",
        experience_years: data?.experience_years ?? "",
        email: data?.email ?? user?.email ?? "",
      });
    } catch (err) {
      showMsg(err?.message || "Không thể tải hồ sơ cá nhân!", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadProfile();
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
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        weight: profile.weight === "" ? null : Number(profile.weight),
        experience_years: profile.experience_years === "" ? null : Number(profile.experience_years),
        email: profile.email,
      };
      const updated = await api.put("/jockeys/profile", payload);
      setProfile({
        weight: updated?.weight ?? "",
        experience_years: updated?.experience_years ?? "",
        email: updated?.email ?? profile.email,
      });
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
    r.participants.some(p => p.jockey_name === user?.full_name)
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
                    const myParticipation = rc.participants.find(p => p.jockey_name === user?.full_name);
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
            <form onSubmit={handleSaveProfile} style={{ maxWidth: "500px", marginTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontWeight: "600", color: "#94a3b8" }}>Cân nặng (kg):</label>
                <input type="number" value={profile.weight} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
                  onChange={(e) => setProfile({ ...profile, weight: e.target.value })} required />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontWeight: "600", color: "#94a3b8" }}>Địa chỉ Email:</label>
                <input type="email" value={profile.email} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })} required />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontWeight: "600", color: "#94a3b8" }}>Số năm kinh nghiệm thi đấu:</label>
                <input type="number" min="0" value={profile.experience_years} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
                  onChange={(e) => setProfile({ ...profile, experience_years: e.target.value })} required />
              </div>

              <button type="submit" className="btn-primary" style={{ padding: "12px", fontSize: "14px", fontWeight: "600", marginTop: "10px" }} disabled={savingProfile}>
                {savingProfile ? "Đang lưu..." : "Lưu thay đổi hồ sơ"}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
