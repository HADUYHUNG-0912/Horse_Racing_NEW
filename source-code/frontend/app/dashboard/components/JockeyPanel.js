"use client";

import { useEffect, useState } from "react";
import { api } from "../../api";
import dashboardStyles from "../dashboard.module.css";
import {
  MailIcon,
  TrophyIcon,
  FlagIcon,
  UserIcon,
  AwardIcon,
  CalendarIcon,
  CloseIcon,
  ResultIcon,
  PlusIcon,
} from "./Icons";

// FIX: import { jockeyApi } từ "../../api" gây lỗi
// "Cannot read properties of undefined (reading 'respondToInvitation')"
// vì jockeyApi bị undefined hoặc không có method respondToInvitation.
// Thay vào đó, gọi trực tiếp qua "api" (object đã chắc chắn hoạt động vì
// api.get đang được dùng thành công ở loadData) để không bị crash.

export default function JockeyPanel({ user, activeTab, showMsg, onUserRefresh }) {
  const [invitations, setInvitations] = useState([]);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tính năng 3.2: Kết quả chi tiết trận đua
  const [raceResults, setRaceResults] = useState([]);
  const [resultModal, setResultModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  // Tab Giải thưởng
  const [rankings, setRankings] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("all");
  const [rankingsLoading, setRankingsLoading] = useState(true);

  // FIX (Task 4): KHÔNG còn dùng localStorage. Hồ sơ được nạp từ API
  // (GET /jockeys/profile) khi component mount, và lưu xuống Database
  // qua API (PUT /jockeys/profile) khi submit form.
  // - "experience" (text tự do) đổi thành "experience_years" (số nguyên)
  //   để khớp đúng cột experience_years (INT) trong Database.
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    weight: "",
    height: "",
    experience_years: "",
    email: user?.email || "",
    phone: "",
    gender: "",
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

  // Tính năng 3.2: Nạp toàn bộ lịch sử kết quả của Jockey từ backend
  const loadRaceResults = async () => {
    try {
      const data = await api.get("/jockeys/results");
      setRaceResults(Array.isArray(data) ? data : []);
    } catch (err) {
      // Không critical – im lặng nếu chưa có kết quả
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
        phone: data?.phone ?? "",
        gender: data?.gender ?? "",
        bio: data?.bio ?? "",
      });
    } catch (err) {
      showMsg(err?.message || "Không thể tải hồ sơ cá nhân!", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  // Chỉ fetch danh sách tournaments khi mount — rankings được load riêng theo selectedTournament
  const loadRankings = async () => {
    try {
      const tourData = await api.get("/tournaments");
      setTournaments(Array.isArray(tourData) ? tourData : []);
    } catch (err) {
      // tournaments không critical
    }
  };

  // FIX (Bug 2): Fetch rankings từ backend mỗi khi selectedTournament thay đổi
  // thay vì lọc client-side theo r.tournament_id (vốn luôn là null)
  useEffect(() => {
    const loadRankingsFiltered = async () => {
      try {
        setRankingsLoading(true);
        const url = selectedTournament === "all"
          ? "/results/rankings"
          : `/results/rankings?tournament_id=${selectedTournament}`;
        const rankData = await api.get(url);
        setRankings(Array.isArray(rankData) ? rankData : []);
      } catch (err) {
        // rankings không critical
      } finally {
        setRankingsLoading(false);
      }
    };
    loadRankingsFiltered();
  }, [selectedTournament]);

  useEffect(() => {
    loadData();
    loadProfile();
    loadRankings();
    loadRaceResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (profile.phone && profile.phone.trim()) {
      const phoneRegex = /^[0-9]{9,11}$/;
      if (!phoneRegex.test(profile.phone.trim().replace(/\s/g, ""))) {
        errors.phone = "Số điện thoại không hợp lệ (9-11 chữ số)";
      }
    }

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
        phone: profile.phone?.trim() || null,
        gender: profile.gender || null,
        bio: profile.bio?.trim() || null,
      };
      const updated = await api.put("/jockeys/profile", payload);
      setProfile({
        full_name: updated?.full_name ?? profile.full_name,
        weight: updated?.weight ?? "",
        height: updated?.height ?? "",
        experience_years: updated?.experience_years ?? "",
        email: updated?.email ?? profile.email,
        phone: updated?.phone ?? profile.phone,
        gender: updated?.gender ?? profile.gender,
        bio: updated?.bio ?? "",
      });
      setProfileErrors({});
      await onUserRefresh?.(user?.id);
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
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", color: "var(--color-burgundy)", fontWeight: "600" }}>
        Đang tải dữ liệu Jockey...
      </div>
    );
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
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MailIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Hộp thư lời mời nhận được từ các Chủ ngựa
          </h2>
          <div className={dashboardStyles.tableWrapper}>
            <table className={dashboardStyles.table}>
              <thead>
                <tr>
                  <th className={dashboardStyles.th}>Chủ ngựa</th>
                  <th className={dashboardStyles.th}>Ngựa đua</th>
                  <th className={dashboardStyles.th}>Giải đấu</th>
                  <th className={dashboardStyles.th}>Tin nhắn</th>
                  <th className={dashboardStyles.th}>Trạng thái</th>
                  <th className={dashboardStyles.th}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {invitations.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "24px" }} className={dashboardStyles.td}>Không tìm thấy lời mời nào</td></tr>
                ) : (
                  invitations.map(inv => (
                    <tr key={inv.id} className={dashboardStyles.rowHover}>
                      <td className={dashboardStyles.td}>{inv.owner_name || `Chủ ngựa #${inv.owner_id}`}</td>
                      <td style={{ fontWeight: "700" }} className={dashboardStyles.td}>{inv.horse_name || `Ngựa #${inv.horse_id}`}</td>
                      <td className={dashboardStyles.td}>{inv.tournament_name || `Giải đấu #${inv.tournament_id}`}</td>
                      <td className={dashboardStyles.td}>{inv.message || "-"}</td>
                      <td className={dashboardStyles.td}>
                        <span className={`${dashboardStyles.badge} ${inv.status === "ACCEPTED" ? dashboardStyles.badgeApproved : inv.status === "PENDING" ? dashboardStyles.badgePending : dashboardStyles.badgeRejected}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className={dashboardStyles.td}>
                        {inv.status === "PENDING" && (
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button className={dashboardStyles.btnPrimary} style={{ padding: "6px 12px", fontSize: "12px" }}
                              onClick={() => respondInvitation(inv.id, "ACCEPTED")}>Đồng ý</button>
                            <button className={dashboardStyles.btnSecondary} style={{ padding: "6px 12px", fontSize: "12px", color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)" }}
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
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FlagIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Lịch trình các trận đua đã đăng ký
          </h2>
          <div className={dashboardStyles.tableWrapper}>
            <table className={dashboardStyles.table}>
              <thead>
                <tr>
                  <th className={dashboardStyles.th}>Trận đua</th>
                  <th className={dashboardStyles.th}>Ngựa đua</th>
                  <th className={dashboardStyles.th}>Thời gian đua</th>
                  <th className={dashboardStyles.th}>Khoảng cách</th>
                  <th className={dashboardStyles.th}>Đường chạy</th>
                  <th className={dashboardStyles.th}>Trạng thái</th>
                  <th className={dashboardStyles.th}>Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {myRaces.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "24px" }} className={dashboardStyles.td}>Chưa có lịch thi đấu nào</td></tr>
                ) : (
                  myRaces.map(rc => {
                    const myParticipation = rc.participants.find(p => p.jockey_name === user?.full_name);
                    const myResult = raceResults.find(r => r.race_id === rc.id);
                    return (
                      <tr key={rc.id} className={dashboardStyles.rowHover}>
                        <td style={{ fontWeight: "700" }} className={dashboardStyles.td}>{rc.name}</td>
                        <td style={{ color: "var(--color-burgundy)", fontWeight: "600" }} className={dashboardStyles.td}>
                          {myParticipation?.horse_name || "Chưa rõ"}
                        </td>
                        <td className={dashboardStyles.td}>{formatDateTime(rc.race_time)}</td>
                        <td className={dashboardStyles.td}>{rc.distance}m</td>
                        <td className={dashboardStyles.td}>{rc.track_condition}</td>
                        <td className={dashboardStyles.td}>
                          <span className={`${dashboardStyles.badge} ${rc.status === "COMPLETED" ? dashboardStyles.badgeApproved : dashboardStyles.badgePending}`}>
                            {rc.status}
                          </span>
                        </td>
                        <td className={dashboardStyles.td}>
                          {rc.status === "COMPLETED" && myResult ? (
                            <button
                              id={`btn-result-${rc.id}`}
                              className={dashboardStyles.btnPrimary}
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                              onClick={() => { setSelectedResult(myResult); setResultModal(true); }}
                            >
                              <ResultIcon size={14} /> Xem kết quả
                            </button>
                          ) : rc.status === "COMPLETED" ? (
                            <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>Chưa có kết quả</span>
                          ) : null}
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

      {/* Tính năng 3.2: Modal kết quả chi tiết trận đua */}
      {resultModal && selectedResult && (
        <div
          id="result-modal-overlay"
          className={dashboardStyles.modalBackdrop}
          onClick={(e) => { if (e.target.id === "result-modal-overlay") setResultModal(false); }}
        >
          <div className={dashboardStyles.modalContent} style={{ maxWidth: "520px", width: "90%" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 className={dashboardStyles.modalTitle} style={{ margin: 0, fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <ResultIcon size={20} style={{ color: "var(--color-burgundy)" }} /> Kết quả trận đua
              </h3>
              <button
                id="btn-close-result-modal"
                onClick={() => setResultModal(false)}
                style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Race name */}
            <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginBottom: "20px" }}>
              Trận đua: <strong style={{ color: "var(--color-text-dark)" }}>{selectedResult.race_name}</strong>
            </p>

            {/* Stats cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              {/* Ngựa */}
              <div style={{ background: "rgba(224, 218, 205, 0.2)", borderRadius: "8px", padding: "12px 14px", border: "1px solid var(--color-border)" }}>
                <div style={{ color: "var(--color-text-muted)", fontSize: "11px", fontWeight: "600", marginBottom: "4px", textTransform: "uppercase" }}>Ngựa đồng hành</div>
                <div style={{ color: "var(--color-burgundy)", fontWeight: "700", fontSize: "15px" }}>{selectedResult.horse_name}</div>
              </div>
              {/* Xếp hạng */}
              <div style={{ background: "rgba(224, 218, 205, 0.2)", borderRadius: "8px", padding: "12px 14px", border: "1px solid var(--color-border)" }}>
                <div style={{ color: "var(--color-text-muted)", fontSize: "11px", fontWeight: "600", marginBottom: "4px", textTransform: "uppercase" }}>Xếp hạng</div>
                <div style={{
                  fontWeight: "800", fontSize: "20px",
                  color: selectedResult.rank === 1 ? "#f59e0b" : selectedResult.rank === 2 ? "#94a3b8" : selectedResult.rank === 3 ? "#cd7f32" : "var(--color-text-dark)"
                }}>
                  {selectedResult.rank === 1 ? "🥇 Hạng 1" : selectedResult.rank === 2 ? "🥈 Hạng 2" : selectedResult.rank === 3 ? "🥉 Hạng 3" : `Hạng ${selectedResult.rank}`}
                </div>
              </div>
              {/* Điểm */}
              <div style={{ background: "rgba(224, 218, 205, 0.2)", borderRadius: "8px", padding: "12px 14px", border: "1px solid var(--color-border)" }}>
                <div style={{ color: "var(--color-text-muted)", fontSize: "11px", fontWeight: "600", marginBottom: "4px", textTransform: "uppercase" }}>Điểm tích lũy</div>
                <div style={{ color: "var(--color-forest)", fontWeight: "700", fontSize: "16px" }}>+{selectedResult.points} điểm</div>
              </div>
              {/* Thời gian về đích */}
              <div style={{ background: "rgba(224, 218, 205, 0.2)", borderRadius: "8px", padding: "12px 14px", border: "1px solid var(--color-border)" }}>
                <div style={{ color: "var(--color-text-muted)", fontSize: "11px", fontWeight: "600", marginBottom: "4px", textTransform: "uppercase" }}>Thời gian về đích</div>
                <div style={{ color: "var(--color-text-dark)", fontWeight: "600", fontSize: "13px" }}>
                  {selectedResult.finish_time ? formatDateTime(selectedResult.finish_time) : "—"}
                </div>
              </div>
            </div>

            {/* Violations alert */}
            {selectedResult.violations && selectedResult.violations.length > 0 && (
              <div style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "8px",
              }}>
                <div style={{ color: "var(--danger)", fontWeight: "700", fontSize: "14px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  🚨 Vi phạm ghi nhận ({selectedResult.violations.length})
                </div>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--danger)", fontSize: "13px" }}>
                  {selectedResult.violations.map((v, idx) => (
                    <li key={v.id || idx} style={{ marginBottom: "4px" }}>
                      <strong>{v.description}</strong>
                      {v.penalty && <span style={{ color: "#b91c1c" }}> — Hình phạt: {v.penalty}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(!selectedResult.violations || selectedResult.violations.length === 0) && (
              <div style={{ color: "var(--color-forest)", fontSize: "13px", textAlign: "center", padding: "10px", background: "rgba(6,95,70,0.05)", borderRadius: "8px", border: "1px solid rgba(6,95,70,0.15)" }}>
                ✓ Không có vi phạm nào được ghi nhận
              </div>
            )}
          </div>
        </div>
      )}

      {/* TASK 4: TAB CẬP NHẬT HỒ SƠ CÁ NHÂN */}
      {activeTab === "profile" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <UserIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Hồ sơ cá nhân Jockey: {user?.full_name}
          </h2>
          {profileLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", color: "var(--color-burgundy)", fontWeight: "600" }}>
              Đang tải hồ sơ...
            </div>
          ) : (
            <div className={dashboardStyles.splitLayout}>
              <form onSubmit={handleSaveProfile} className={dashboardStyles.formPanel}>
                <h3 className={dashboardStyles.subHeading} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  Chỉnh sửa thông tin
                </h3>
                
                {/* Họ và tên */}
                <div className={dashboardStyles.formGroup}>
                  <label>Họ và tên <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    type="text"
                    value={profile.full_name}
                    placeholder="Nhập họ và tên đầy đủ"
                    className={dashboardStyles.inputField}
                    style={profileErrors.full_name ? { borderColor: "var(--danger)" } : {}}
                    onChange={(e) => { setProfile({ ...profile, full_name: e.target.value }); setProfileErrors({ ...profileErrors, full_name: "" }); }}
                  />
                  {profileErrors.full_name && <span style={{ color: "var(--danger)", fontSize: "12px", marginTop: "4px" }}>⚠ {profileErrors.full_name}</span>}
                </div>

                {/* Email */}
                <div className={dashboardStyles.formGroup}>
                  <label>Địa chỉ Email <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    type="email"
                    value={profile.email}
                    placeholder="example@email.com"
                    className={dashboardStyles.inputField}
                    style={profileErrors.email ? { borderColor: "var(--danger)" } : {}}
                    onChange={(e) => { setProfile({ ...profile, email: e.target.value }); setProfileErrors({ ...profileErrors, email: "" }); }}
                  />
                  {profileErrors.email && <span style={{ color: "var(--danger)", fontSize: "12px", marginTop: "4px" }}>⚠ {profileErrors.email}</span>}
                </div>

                {/* Số điện thoại */}
                <div className={dashboardStyles.formGroup}>
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    placeholder="Ví dụ: 0912345678"
                    className={dashboardStyles.inputField}
                    style={profileErrors.phone ? { borderColor: "var(--danger)" } : {}}
                    onChange={(e) => { setProfile({ ...profile, phone: e.target.value }); setProfileErrors({ ...profileErrors, phone: "" }); }}
                  />
                  {profileErrors.phone && <span style={{ color: "var(--danger)", fontSize: "12px", marginTop: "4px" }}>⚠ {profileErrors.phone}</span>}
                </div>

                {/* Giới tính */}
                <div className={dashboardStyles.formGroup}>
                  <label>Giới tính</label>
                  <select
                    value={profile.gender}
                    className={dashboardStyles.inputField}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  >
                    <option value="">-- Chọn giới tính --</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                {/* Cân nặng + Chiều cao trên cùng 1 hàng */}
                <div style={{ display: "flex", gap: "12px" }}>
                  <div className={dashboardStyles.formGroup} style={{ flex: 1 }}>
                    <label>Cân nặng (kg) <span style={{ color: "var(--danger)" }}>*</span></label>
                    <input
                      type="number"
                      value={profile.weight}
                      placeholder="Ví dụ: 55"
                      min="1" max="300" step="0.1"
                      className={dashboardStyles.inputField}
                      style={profileErrors.weight ? { borderColor: "var(--danger)" } : {}}
                      onChange={(e) => { setProfile({ ...profile, weight: e.target.value }); setProfileErrors({ ...profileErrors, weight: "" }); }}
                    />
                    {profileErrors.weight && <span style={{ color: "var(--danger)", fontSize: "12px", marginTop: "4px" }}>⚠ {profileErrors.weight}</span>}
                  </div>
                  <div className={dashboardStyles.formGroup} style={{ flex: 1 }}>
                    <label>Chiều cao (cm)</label>
                    <input
                      type="number"
                      value={profile.height}
                      placeholder="Ví dụ: 170"
                      min="1" max="250" step="0.1"
                      className={dashboardStyles.inputField}
                      style={profileErrors.height ? { borderColor: "var(--danger)" } : {}}
                      onChange={(e) => { setProfile({ ...profile, height: e.target.value }); setProfileErrors({ ...profileErrors, height: "" }); }}
                    />
                    {profileErrors.height && <span style={{ color: "var(--danger)", fontSize: "12px", marginTop: "4px" }}>⚠ {profileErrors.height}</span>}
                  </div>
                </div>

                {/* Số năm kinh nghiệm */}
                <div className={dashboardStyles.formGroup}>
                  <label>Số năm kinh nghiệm thi đấu <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    type="number"
                    value={profile.experience_years}
                    placeholder="Ví dụ: 5"
                    min="0" max="50"
                    className={dashboardStyles.inputField}
                    style={profileErrors.experience_years ? { borderColor: "var(--danger)" } : {}}
                    onChange={(e) => { setProfile({ ...profile, experience_years: e.target.value }); setProfileErrors({ ...profileErrors, experience_years: "" }); }}
                  />
                  {profileErrors.experience_years && <span style={{ color: "var(--danger)", fontSize: "12px", marginTop: "4px" }}>⚠ {profileErrors.experience_years}</span>}
                </div>

                {/* Giới thiệu bản thân */}
                <div className={dashboardStyles.formGroup}>
                  <label>Giới thiệu bản thân</label>
                  <textarea
                    rows="4"
                    value={profile.bio}
                    placeholder="Mô tả ngắn về bản thân, thành tích nổi bật, phong cách thi đấu..."
                    className={dashboardStyles.inputField}
                    style={{ resize: "vertical", height: "auto" }}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                </div>

                {/* Nút lưu */}
                <button
                  type="submit"
                  className={dashboardStyles.btnPrimary}
                  style={{ width: "100%", marginTop: "8px", opacity: savingProfile ? 0.7 : 1, cursor: savingProfile ? "not-allowed" : "pointer" }}
                  disabled={savingProfile}
                >
                  {savingProfile ? "⏳ Đang lưu..." : "💾 Lưu thay đổi hồ sơ"}
                </button>

                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0, textAlign: "center" }}>
                  <span style={{ color: "var(--danger)" }}>*</span> Trường bắt buộc
                </p>
              </form>

              <div style={{ flex: 1.2, minWidth: "280px" }}>
                <div className={dashboardStyles.card} style={{ padding: "24px" }}>
                  <h3 className={dashboardStyles.subHeading} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
                    <UserIcon size={18} /> Thông tin hiện tại
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div className={dashboardStyles.infoListItem}><label>Họ tên:</label><span style={{ fontWeight: "700" }}>{profile.full_name || "—"}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>Email:</label><span>{profile.email || "—"}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>Số điện thoại:</label><span>{profile.phone || "Chưa có"}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>Giới tính:</label><span>{profile.gender || "Chưa có"}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>Cân nặng:</label><span>{profile.weight ? `${profile.weight} kg` : "—"}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>Chiều cao:</label><span>{profile.height ? `${profile.height} cm` : "Chưa có"}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>Kinh nghiệm:</label><span>{profile.experience_years ? `${profile.experience_years} năm` : "—"}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>Tiểu sử:</label><span style={{ color: "var(--color-text-muted)" }}>{profile.bio || "Chưa có"}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Xem giải thưởng (Jockey) */}
      {activeTab === "jockey-rewards" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AwardIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Giải thưởng & Thành tích thi đấu
          </h2>

          {/* Bộ lọc theo giải đấu */}
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <label style={{ color: "var(--color-text-muted)", fontWeight: "600", fontSize: "14px" }}>Lọc theo giải đấu:</label>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className={dashboardStyles.inputField}
              style={{ width: "auto", minWidth: "220px", padding: "8px 14px" }}
            >
              <option value="all">Tất cả giải đấu</option>
              {tournaments.map(t => (
                <option key={t.id} value={String(t.id)}>{t.name}</option>
              ))}
            </select>
          </div>

          {rankingsLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", color: "var(--color-burgundy)", fontWeight: "600" }}>
              Đang tải dữ liệu giải thưởng...
            </div>
          ) : (() => {
            const myRankings = rankings
              .filter(r => r.entity_type === "JOCKEY" && r.entity_name === user?.full_name)
              .map(r => ({
                ...r,
                tournament_id: selectedTournament !== "all" ? Number(selectedTournament) : r.tournament_id
              }));

            const totalPoints = myRankings.reduce((sum, r) => sum + (r.points || 0), 0);
            const bestRank = myRankings.length > 0 ? Math.min(...myRankings.map(r => r.rank)) : null;

            return (
              <>
                {/* Thẻ thống kê tổng quan */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                  <div className={dashboardStyles.card} style={{ borderLeft: "4px solid var(--color-forest)", padding: "16px 20px" }}>
                    <div style={{ color: "var(--color-text-muted)", fontSize: "12px", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase" }}>Tổng điểm</div>
                    <div style={{ color: "var(--color-forest)", fontSize: "28px", fontWeight: "800", fontFamily: "var(--font-bungee)" }}>{totalPoints}</div>
                    <div style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>điểm tích lũy</div>
                  </div>
                  <div className={dashboardStyles.card} style={{ borderLeft: "4px solid var(--color-burgundy)", padding: "16px 20px" }}>
                    <div style={{ color: "var(--color-text-muted)", fontSize: "12px", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase" }}>Hạng cao nhất</div>
                    <div style={{ color: "var(--color-burgundy)", fontSize: "28px", fontWeight: "800", fontFamily: "var(--font-bungee)" }}>
                      {bestRank ? `#${bestRank}` : "—"}
                    </div>
                    <div style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>trong các giải</div>
                  </div>
                  <div className={dashboardStyles.card} style={{ borderLeft: "4px solid #3b82f6", padding: "16px 20px" }}>
                    <div style={{ color: "var(--color-text-muted)", fontSize: "12px", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase" }}>Giải đã tham gia</div>
                    <div style={{ color: "#2563eb", fontSize: "28px", fontWeight: "800", fontFamily: "var(--font-bungee)" }}>{myRankings.length}</div>
                    <div style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>giải đấu</div>
                  </div>
                </div>

                {/* Bảng chi tiết giải thưởng */}
                <div className={dashboardStyles.tableWrapper}>
                  <table className={dashboardStyles.table}>
                    <thead>
                      <tr>
                        <th className={dashboardStyles.th}>Giải đấu</th>
                        <th className={dashboardStyles.th}>Hạng</th>
                        <th className={dashboardStyles.th}>Điểm</th>
                        <th className={dashboardStyles.th}>Cập nhật lúc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myRankings.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "32px" }} className={dashboardStyles.td}>
                            {selectedTournament === "all"
                              ? "Chưa có thành tích nào được ghi nhận"
                              : "Không có thành tích trong giải đấu này"}
                          </td>
                        </tr>
                      ) : (
                        myRankings
                          .sort((a, b) => a.rank - b.rank)
                          .map((r, i) => (
                            <tr key={r.id || i} className={dashboardStyles.rowHover}>
                              <td style={{ fontWeight: "600" }} className={dashboardStyles.td}>
                                {tournaments.find(t => t.id === r.tournament_id)?.name || `Giải đấu #${r.tournament_id || "—"}`}
                              </td>
                              <td className={dashboardStyles.td}>
                                <span style={{
                                  fontWeight: "800", fontSize: "16px",
                                  color: r.rank === 1 ? "#f59e0b" : r.rank === 2 ? "#94a3b8" : r.rank === 3 ? "#cd7f32" : "var(--color-text-dark)"
                                }}>
                                  {r.rank === 1 ? "🥇 Hạng 1" : r.rank === 2 ? "🥈 Hạng 2" : r.rank === 3 ? "🥉 Hạng 3" : `#${r.rank}`}
                                </span>
                              </td>
                              <td style={{ color: "var(--color-burgundy)", fontWeight: "700" }} className={dashboardStyles.td}>+{r.points} điểm</td>
                              <td style={{ color: "var(--color-text-muted)", fontSize: "13px" }} className={dashboardStyles.td}>
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
