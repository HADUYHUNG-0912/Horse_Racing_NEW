"use client";

import { useEffect, useState } from "react";
import { api } from "../../api";
import dashboardStyles from "../dashboard.module.css";
import {
  FlagIcon,
  CalendarIcon,
  ResultIcon,
  UserIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
  AwardIcon,
} from "./Icons";

export default function RefereePanel({ user, activeTab, showMsg, onUserRefresh }) {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRace, setSelectedRace] = useState(null);
  const [resultsForm, setResultsForm] = useState([]); // Array of { race_participant_id, rank, points, notes }
  const [violationForm, setViolationForm] = useState({ race_participant_id: "", description: "", penalty: "Cảnh cáo", fine_amount: "0" });
  const [fineAmountError, setFineAmountError] = useState("");
  const [expandedRaceId, setExpandedRaceId] = useState(null);

  const [selectedRaceForInspection, setSelectedRaceForInspection] = useState(null);
  const [inspectionForm, setInspectionForm] = useState({ weather: "", track_condition: "", horse_health: "" });

  // Profile states
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    certification_level: ""
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  const loadData = async () => {
    try {
      const assignedRaces = await api.get("/races/assigned-to-me");
      setRaces(assignedRaces);
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const data = await api.get("/referees/profile");
      setProfile({
        full_name: data?.full_name ?? user?.full_name ?? "",
        email: data?.email ?? user?.email ?? "",
        certification_level: data?.certification_level ?? ""
      });
    } catch (err) {
      showMsg(err?.message || "Không thể tải hồ sơ cá nhân!", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "profile") {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const validateProfile = () => {
    const errors = {};
    if (!profile.full_name?.trim()) errors.full_name = "Họ tên không được để trống";
    if (!profile.email?.trim()) errors.email = "Email không được để trống";
    return errors;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
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
        email: profile.email.trim(),
        certification_level: profile.certification_level?.trim() || null
      };
      const updated = await api.put("/referees/profile", payload);
      setProfile({
        full_name: updated?.full_name ?? profile.full_name,
        email: updated?.email ?? profile.email,
        certification_level: updated?.certification_level ?? ""
      });
      setProfileErrors({});
      await onUserRefresh?.(user?.id);
      showMsg("Cập nhật thông tin hồ sơ Referee thành công!");
    } catch (err) {
      showMsg(err?.message || "Không thể lưu hồ sơ. Vui lòng thử lại!", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const initResultsForm = (race) => {
    setSelectedRace(race);
    setSelectedRaceForInspection(null);
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
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const handleConfirmResults = async (raceId) => {
    if (!confirm("Bạn có chắc chắn muốn xác nhận kết quả chính thức cho trận đấu này? Trạng thái sẽ chuyển thành COMPLETED và bảng xếp hạng sẽ được cập nhật.")) {
      return;
    }
    try {
      await api.post(`/results/${raceId}/results/confirm`);
      showMsg("Xác nhận kết quả chính thức thành công!");
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const initInspectionForm = (race) => {
    setSelectedRaceForInspection(race);
    setSelectedRace(null);
    setInspectionForm({
      weather: "Sunny",
      track_condition: race.track_condition || "Good",
      horse_health: "All horses are healthy and fit to race."
    });
  };

  const submitInspection = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/races/${selectedRaceForInspection.id}/inspection`, {
        weather: inspectionForm.weather,
        track_condition: inspectionForm.track_condition,
        horse_health: inspectionForm.horse_health
      });
      showMsg("Ghi nhận kiểm tra đường đua thành công!");
      setSelectedRaceForInspection(null);
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const submitViolation = async (e) => {
    e.preventDefault();
    try {
      const fineAmount = Math.max(0, parseInt(violationForm.fine_amount) || 0);
      await api.post(`/results/${selectedRace.id}/violations`, {
        race_participant_id: parseInt(violationForm.race_participant_id),
        description: violationForm.description,
        penalty: violationForm.penalty,
        fine_amount: fineAmount
      });
      showMsg("Báo cáo vi phạm thành công!");
      setViolationForm({ race_participant_id: "", description: "", penalty: "Cảnh cáo", fine_amount: "0" });
    } catch (err) {
      showMsg(err.message, "error");
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
        Đang tải dữ liệu Referee...
      </div>
    );
  }

  return (
    <>
      {/* TAB: Trận đua phân công (Referee) */}
      {activeTab === "assigned-races" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FlagIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Các trận đua được phân công giám sát
          </h2>
          <div className={dashboardStyles.tableWrapper}>
            <table className={dashboardStyles.table}>
              <thead>
                <tr>
                  <th className={dashboardStyles.th}>Tên trận đua</th>
                  <th className={dashboardStyles.th}>Thời gian</th>
                  <th className={dashboardStyles.th}>Khoảng cách</th>
                  <th className={dashboardStyles.th}>Điều kiện chạy</th>
                  <th className={dashboardStyles.th}>Số ngựa tham gia</th>
                  <th className={dashboardStyles.th}>Trạng thái</th>
                  <th className={dashboardStyles.th}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {races.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "24px" }} className={dashboardStyles.td}>Chưa được phân công trận đua nào</td></tr>
                ) : (
                  races.map(rc => (
                    <>
                      <tr key={rc.id} className={dashboardStyles.rowHover}>
                        <td
                          style={{ fontWeight: "700", cursor: "pointer", userSelect: "none" }}
                          className={dashboardStyles.td}
                          onClick={() => setExpandedRaceId(expandedRaceId === rc.id ? null : rc.id)}
                          title="Click để xem danh sách ngựa tham gia"
                        >
                          <span style={{ marginRight: "6px", color: "var(--color-burgundy)" }}>
                            {expandedRaceId === rc.id ? "▼" : "▶"}
                          </span>
                          {rc.name}
                        </td>
                        <td className={dashboardStyles.td}>{formatDateTime(rc.race_time)}</td>
                        <td className={dashboardStyles.td}>{rc.distance}m</td>
                        <td className={dashboardStyles.td}>{rc.track_condition}</td>
                        <td className={dashboardStyles.td}>{rc.participants.length}</td>
                        <td className={dashboardStyles.td}>
                          <span className={`${dashboardStyles.badge} ${rc.status === "COMPLETED" ? dashboardStyles.badgeApproved : rc.status === "RESULTS_ENTERED" ? dashboardStyles.badgeInfo : dashboardStyles.badgePending}`}>
                            {rc.status}
                          </span>
                        </td>
                        <td className={dashboardStyles.td}>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {rc.status === "SCHEDULED" && (
                              <button className={dashboardStyles.btnPrimary} style={{ padding: "6px 12px", fontSize: "12px", background: "#3b82f6" }}
                                onClick={() => initInspectionForm(rc)}>
                                Kiểm tra đường đua
                              </button>
                            )}
                            <button className={dashboardStyles.btnPrimary} style={{ padding: "6px 12px", fontSize: "12px" }}
                              onClick={() => initResultsForm(rc)}>
                              {rc.status === "COMPLETED" ? "Sửa kết quả" : "Nhập kết quả"}
                            </button>
                            {rc.status === "RESULTS_ENTERED" && (
                              <button className={dashboardStyles.btnPrimary} style={{ padding: "6px 12px", fontSize: "12px", background: "var(--color-forest)" }}
                                onClick={() => handleConfirmResults(rc.id)}>
                                Xác nhận kết quả chính thức
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded participant detail */}
                      {expandedRaceId === rc.id && (
                        <tr key={`detail-${rc.id}`}>
                          <td colSpan="7" style={{ padding: "0", background: "rgba(224, 218, 205, 0.15)" }}>
                            <div style={{ padding: "16px 24px" }}>
                              <p style={{ fontWeight: "700", marginBottom: "10px", color: "var(--color-burgundy)", fontSize: "14px" }}>
                                🐎 Danh sách ngựa tham gia — {rc.name}
                              </p>
                              {rc.participants.length === 0 ? (
                                <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>Chưa có ngựa tham gia.</p>
                              ) : (
                                <div className={dashboardStyles.tableWrapper} style={{ background: "#ffffff" }}>
                                  <table className={dashboardStyles.table}>
                                    <thead>
                                      <tr>
                                        <th className={dashboardStyles.th} style={{ padding: "8px 12px", textAlign: "center" }}>Làn số</th>
                                        <th className={dashboardStyles.th} style={{ padding: "8px 12px", textAlign: "left" }}>Tên ngựa</th>
                                        <th className={dashboardStyles.th} style={{ padding: "8px 12px", textAlign: "left" }}>Tên Jockey</th>
                                        <th className={dashboardStyles.th} style={{ padding: "8px 12px", textAlign: "left" }}>Trạng thái</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {[...rc.participants]
                                        .sort((a, b) => a.lane_number - b.lane_number)
                                        .map(p => (
                                          <tr key={p.id} className={dashboardStyles.rowHover}>
                                            <td className={dashboardStyles.td} style={{ padding: "8px 12px", fontWeight: "700", textAlign: "center" }}>{p.lane_number}</td>
                                            <td className={dashboardStyles.td} style={{ padding: "8px 12px" }}>{p.horse_name}</td>
                                            <td className={dashboardStyles.td} style={{ padding: "8px 12px" }}>{p.jockey_name}</td>
                                            <td className={dashboardStyles.td} style={{ padding: "8px 12px" }}>
                                              <span className={`${dashboardStyles.badge} ${
                                                p.status === "FINISHED" ? dashboardStyles.badgeApproved :
                                                p.status === "DISQUALIFIED" ? dashboardStyles.badgeRejected :
                                                p.status === "DNF" ? dashboardStyles.badgePending : dashboardStyles.badgeInfo
                                              }`}>{p.status}</span>
                                            </td>
                                          </tr>
                                        ))
                                      }
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Enter Results Overlay Panel */}
          {selectedRace && (
            <div style={{ marginTop: "32px", borderTop: "1px solid var(--color-border)", paddingTop: "24px" }}>
              <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <ResultIcon size={22} style={{ color: "var(--color-burgundy)" }} /> Nhập kết quả & Vi phạm: <span style={{ color: "var(--color-burgundy)" }}>{selectedRace.name}</span>
              </h2>

              <div className={dashboardStyles.splitLayout}>
                {/* Results Form */}
                <form onSubmit={submitResults} className={dashboardStyles.formPanel} style={{ flex: 1.5 }}>
                  <h3 className={dashboardStyles.subHeading}>Xếp hạng và Điểm số</h3>
                  {resultsForm.map((field, idx) => (
                    <div key={field.race_participant_id} style={{
                      display: "flex", gap: "16px", background: "rgba(224, 218, 205, 0.2)",
                      padding: "12px", borderRadius: "8px", marginBottom: "8px", alignItems: "center", flexWrap: "wrap"
                    }}>
                      <span style={{ fontWeight: "700", width: "120px" }}>🏇 {field.horse_name}</span>
                      <div className={dashboardStyles.formGroup} style={{ margin: 0, flex: 1, minWidth: "80px" }}>
                        <label>Hạng về đích</label>
                        <input type="number" min="1" className={dashboardStyles.inputField} required
                          style={{ padding: "8px 12px" }}
                          value={field.rank} onChange={(e) => {
                            const copy = [...resultsForm];
                            copy[idx].rank = e.target.value;
                            setResultsForm(copy);
                          }} />
                      </div>
                      <div className={dashboardStyles.formGroup} style={{ margin: 0, flex: 1, minWidth: "80px" }}>
                        <label>Điểm cộng/trừ</label>
                        <input type="number" className={dashboardStyles.inputField} required
                          style={{ padding: "8px 12px" }}
                          value={field.points} onChange={(e) => {
                            const copy = [...resultsForm];
                            copy[idx].points = e.target.value;
                            setResultsForm(copy);
                          }} />
                      </div>
                      <div className={dashboardStyles.formGroup} style={{ margin: 0, flex: 1.5, minWidth: "120px" }}>
                        <label>Ghi chú</label>
                        <input type="text" className={dashboardStyles.inputField} placeholder="Ghi chú đua..."
                          style={{ padding: "8px 12px" }}
                          value={field.notes} onChange={(e) => {
                            const copy = [...resultsForm];
                            copy[idx].notes = e.target.value;
                            setResultsForm(copy);
                          }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button type="submit" className={dashboardStyles.btnPrimary}>Lưu kết quả cuộc đua</button>
                    <button type="button" onClick={() => setSelectedRace(null)} className={dashboardStyles.btnSecondary}>Hủy</button>
                  </div>
                </form>

                {/* Violations Form */}
                <form onSubmit={submitViolation} className={dashboardStyles.formPanel} style={{ flex: 1 }}>
                  <h3 className={dashboardStyles.subHeading} style={{ color: "var(--danger)" }}>Báo Cáo Vi Phạm</h3>
                  <div className={dashboardStyles.formGroup}>
                    <label>Chọn ngựa vi phạm</label>
                    <select className={dashboardStyles.inputField} required
                      value={violationForm.race_participant_id} onChange={(e) => setViolationForm({ ...violationForm, race_participant_id: e.target.value })}>
                      <option value="">-- Chọn ngựa đua --</option>
                      {selectedRace.participants.map(p => <option key={p.id} value={p.id}>{p.horse_name}</option>)}
                    </select>
                  </div>
                  <div className={dashboardStyles.formGroup}>
                    <label>Mô tả vi phạm</label>
                    <textarea className={dashboardStyles.inputField} placeholder="Ví dụ: Chạy lấn làn của ngựa khác..." required
                      style={{ height: "80px", resize: "vertical" }}
                      value={violationForm.description} onChange={(e) => setViolationForm({ ...violationForm, description: e.target.value })} />
                  </div>
                  <div className={dashboardStyles.formGroup}>
                    <label>Hình thức phạt</label>
                    <select className={dashboardStyles.inputField} required
                      value={violationForm.penalty} onChange={(e) => setViolationForm({ ...violationForm, penalty: e.target.value })}>
                      <option value="Cảnh cáo">Cảnh cáo</option>
                      <option value="Huỷ kết quả">Huỷ kết quả</option>
                      <option value="Cấm thi đấu 1 trận">Cấm thi đấu 1 trận</option>
                      <option value="Cấm thi đấu vĩnh viễn">Cấm thi đấu vĩnh viễn</option>
                      <option value="Phạt tiền">Phạt tiền</option>
                    </select>
                  </div>
                  <div className={dashboardStyles.formGroup}>
                    <label>Số tiền phạt (VND)</label>
                    <input type="number" min="0" max="99999999" step="1" className={dashboardStyles.inputField} required
                      value={violationForm.fine_amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = parseInt(val);
                        if (val !== "" && num < 0) {
                          setViolationForm({ ...violationForm, fine_amount: "0" });
                          setFineAmountError("Số tiền phạt không được âm.");
                        } else if (val !== "" && num > 99999999) {
                          setViolationForm({ ...violationForm, fine_amount: "99999999" });
                          setFineAmountError("Số tiền phạt không được vượt quá 99.999.999.");
                        } else {
                          setViolationForm({ ...violationForm, fine_amount: val });
                          setFineAmountError("");
                        }
                      }} />
                    {fineAmountError && (
                      <span style={{ color: "var(--danger)", fontSize: "12px", marginTop: "4px", display: "block" }}>
                        ⚠️ {fineAmountError}
                      </span>
                    )}
                  </div>
                  <button type="submit" className={dashboardStyles.btnPrimary} style={{ backgroundColor: "var(--danger)", borderColor: "var(--danger)", color: "#fff" }}>Báo cáo vi phạm</button>
                </form>
              </div>
            </div>
          )}

          {selectedRaceForInspection && (
            <div style={{ marginTop: "32px", borderTop: "1px solid var(--color-border)", paddingTop: "24px" }}>
              <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <EditIcon size={22} style={{ color: "var(--color-burgundy)" }} /> Kiểm tra trước trận đấu: <span style={{ color: "var(--color-burgundy)" }}>{selectedRaceForInspection.name}</span>
              </h2>

              <form onSubmit={submitInspection} className={dashboardStyles.formPanel} style={{ maxWidth: "600px" }}>
                <div className={dashboardStyles.formGroup}>
                  <label>Thời tiết</label>
                  <input type="text" className={dashboardStyles.inputField} required placeholder="Ví dụ: Sunny, Rainy, Cloudy..."
                    value={inspectionForm.weather} onChange={(e) => setInspectionForm({ ...inspectionForm, weather: e.target.value })} />
                </div>
                <div className={dashboardStyles.formGroup}>
                  <label>Tình trạng đường chạy</label>
                  <input type="text" className={dashboardStyles.inputField} required placeholder="Ví dụ: Dry, Good, Wet, Muddy..."
                    value={inspectionForm.track_condition} onChange={(e) => setInspectionForm({ ...inspectionForm, track_condition: e.target.value })} />
                </div>
                <div className={dashboardStyles.formGroup}>
                  <label>Đánh giá sức khỏe ngựa</label>
                  <textarea className={dashboardStyles.inputField} required placeholder="Ví dụ: Tất cả ngựa tham gia đều đủ điều kiện sức khỏe..."
                    style={{ height: "100px", resize: "vertical" }}
                    value={inspectionForm.horse_health} onChange={(e) => setInspectionForm({ ...inspectionForm, horse_health: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button type="submit" className={dashboardStyles.btnPrimary}>Gửi báo cáo kiểm tra</button>
                  <button type="button" onClick={() => setSelectedRaceForInspection(null)} className={dashboardStyles.btnSecondary}>Hủy</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB CẬP NHẬT HỒ SƠ CÁ NHÂN (Referee) */}
      {activeTab === "profile" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <UserIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Hồ sơ cá nhân Trọng tài: {user?.full_name}
          </h2>
          {profileLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", color: "var(--color-burgundy)", fontWeight: "600" }}>
              Đang tải hồ sơ...
            </div>
          ) : (
            <div className={dashboardStyles.splitLayout}>
              <form onSubmit={handleSaveProfile} className={dashboardStyles.formPanel}>
                <h3 className={dashboardStyles.subHeading}>Chỉnh sửa thông tin</h3>

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

                {/* Cấp chứng chỉ */}
                <div className={dashboardStyles.formGroup}>
                  <label>Cấp chứng chỉ (Certification Level)</label>
                  <input
                    type="text"
                    value={profile.certification_level}
                    placeholder="Ví dụ: Cấp Quốc gia, Cấp Quốc tế..."
                    className={dashboardStyles.inputField}
                    onChange={(e) => setProfile({ ...profile, certification_level: e.target.value })}
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
                    <div className={dashboardStyles.infoListItem}><label>Cấp chứng chỉ:</label><span style={{ fontWeight: "600", color: "var(--color-burgundy)" }}>{profile.certification_level || "Chưa cập nhật"}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
