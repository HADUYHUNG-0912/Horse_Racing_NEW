"use client";

import { useEffect, useState } from "react";
import { api } from "../../api";
import dashboardStyles from "../dashboard.module.css";
import {
  TrophyIcon,
  AwardIcon,
  CalendarIcon,
  UserIcon,
  TrashIcon,
  EditIcon,
  PlusIcon,
  ResultIcon,
  CloseIcon,
  FlagIcon,
  StarIcon,
} from "./Icons";

export default function SpectatorPanel({ user, activeTab, showMsg, onUserRefresh }) {
  const [predictions, setPredictions] = useState([]);
  const [races, setRaces] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState("");

  // Form states
  const [predictionForm, setPredictionForm] = useState({ tournament_id: "", race_id: "", horse_id: "", predicted_rank: "1" });
  const [editingPredictionId, setEditingPredictionId] = useState(null);

  // Schedules tab states
  const [raceResults, setRaceResults] = useState({});
  const [expandedRace, setExpandedRace] = useState(null);
  const [loadingResults, setLoadingResults] = useState({});

  // Profile state
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone_number: "",
    avatar: "",
    favorite_horse_breed: "",
    email: "",
    favorite_jockey: "",
    gender: ""
  });

  const [profileStats, setProfileStats] = useState({
    current_rank: null,
    total_predictions: 0,
    accuracy_rate: 0,
    reward_points: 0
  });

  const loadData = async () => {
    try {
      const preds = await api.get("/spectators/predictions");
      setPredictions(preds);

      const allRaces = await api.get("/races?limit=100");
      setRaces(allRaces);

      const allTournaments = await api.get("/tournaments");
      setTournaments(allTournaments);

      const profile = await api.get("/spectators/profile");
      setProfileForm({
        full_name: profile.full_name || "",
        phone_number: profile.phone_number || "",
        avatar: profile.avatar || "",
        favorite_horse_breed: profile.favorite_horse_breed || "",
        email: profile.email || "",
        favorite_jockey: profile.favorite_jockey || "",
        gender: profile.gender || ""
      });
      setProfileStats({
        current_rank: profile.current_rank || "Chưa xếp hạng",
        total_predictions: profile.total_predictions || 0,
        accuracy_rate: profile.accuracy_rate || 0,
        reward_points: profile.reward_points || 0
      });
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

  const makePrediction = async (e) => {
    e.preventDefault();
    try {
      if (editingPredictionId) {
        await api.put(`/spectators/predictions/${editingPredictionId}`, {
          race_id: parseInt(predictionForm.race_id),
          horse_id: parseInt(predictionForm.horse_id),
          predicted_rank: parseInt(predictionForm.predicted_rank)
        });
        showMsg("Cập nhật dự đoán thành công!");
      } else {
        await api.post("/spectators/predictions", {
          race_id: parseInt(predictionForm.race_id),
          horse_id: parseInt(predictionForm.horse_id),
          predicted_rank: parseInt(predictionForm.predicted_rank)
        });
        showMsg("Dự đoán thành công!");
      }
      setPredictionForm({ tournament_id: "", race_id: "", horse_id: "", predicted_rank: "1" });
      setEditingPredictionId(null);
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const handleEditClick = (pred) => {
    setEditingPredictionId(pred.id);
    setPredictionForm({
      tournament_id: pred.race?.tournament_id || "",
      race_id: pred.race_id || "",
      horse_id: pred.horse_id || "",
      predicted_rank: pred.predicted_rank || "1"
    });
    // Scroll to form or focus
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingPredictionId(null);
    setPredictionForm({ tournament_id: "", race_id: "", horse_id: "", predicted_rank: "1" });
  };

  const deletePrediction = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa dự đoán này không?")) return;
    try {
      await api.delete(`/spectators/predictions/${id}`);
      showMsg("Đã xóa dự đoán!");
      if (editingPredictionId === id) cancelEdit();
      loadData();
    } catch (err) {
      showMsg("Lỗi khi xóa: " + err.message, "error");
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put("/spectators/profile", profileForm);
      await onUserRefresh?.(user?.id);
      showMsg("Cập nhật hồ sơ thành công!");
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const toggleRaceResults = async (raceId) => {
    if (expandedRace === raceId) {
      setExpandedRace(null);
      return;
    }
    setExpandedRace(raceId);

    if (!raceResults[raceId]) {
      setLoadingResults(prev => ({ ...prev, [raceId]: true }));
      try {
        const results = await api.get(`/results/${raceId}/results`);
        setRaceResults(prev => ({ ...prev, [raceId]: results }));
      } catch (err) {
        showMsg("Không thể tải kết quả: " + err.message, "error");
      } finally {
        setLoadingResults(prev => ({ ...prev, [raceId]: false }));
      }
    }
  };

  // Hàm tiện ích parse giờ VN an toàn
  const parseVNTime = (dateStr) => {
    if (!dateStr) return new Date();
    // Nếu ngày chỉ là định dạng YYYY-MM-DD (length 10) thì giữ nguyên
    if (dateStr.length === 10) return new Date(dateStr);
    const tzStr = (dateStr.includes('Z') || dateStr.includes('+')) ? dateStr : `${dateStr}+07:00`;
    return new Date(tzStr);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = parseVNTime(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const getRankBadge = (rank) => {
    const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
    return medals[rank] || `#${rank}`;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", color: "var(--color-burgundy)", fontWeight: "600" }}>
        Đang tải dữ liệu Spectator...
      </div>
    );
  }

  const uniqueSeasons = Array.from(new Set(tournaments.map(t => {
    return t.start_date ? new Date(t.start_date).getFullYear().toString() : "";
  }).filter(s => s !== ""))).sort((a, b) => b - a);

  const filteredRaces = races.filter(rc => {
    if (!selectedSeason) return true;
    const tournament = tournaments.find(t => t.id === rc.tournament_id);
    if (!tournament || !tournament.start_date) return false;
    return new Date(tournament.start_date).getFullYear().toString() === selectedSeason;
  });

  const upcomingRaces = filteredRaces.filter(rc => rc.status === "SCHEDULED" || rc.status === "RUNNING");
  const completedRaces = filteredRaces.filter(rc => rc.status === "COMPLETED");

  const selectedRaceObj = races.find(rc => rc.id === parseInt(predictionForm.race_id));
  const isLocked = selectedRaceObj ? (parseVNTime(selectedRaceObj.race_time) - new Date()) < 15 * 60 * 1000 : false;

  return (
    <>
      {/* TAB: Dự đoán Trận đua (Spectator) */}
      {activeTab === "predictions" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <StarIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Dự đoán thứ hạng trận đua dành cho khán giả
          </h2>
          <div className={dashboardStyles.splitLayout}>
            {/* Make prediction */}
            <form onSubmit={makePrediction} className={dashboardStyles.formPanel}>
              <h3 className={dashboardStyles.subHeading}>{editingPredictionId ? "Sửa dự đoán" : "Tạo dự đoán mới"}</h3>
              {isLocked && (
                <div style={{
                  padding: "10px",
                  background: "rgba(239, 68, 68, 0.05)",
                  border: "1px solid rgba(239, 68, 68, 0.15)",
                  color: "var(--danger)",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  fontSize: "13px",
                  fontWeight: "600"
                }}>
                  ⚠️ Trận đấu đã quá giờ, không thể dự đoán.
                </div>
              )}
              <div className={dashboardStyles.formGroup}>
                <label>Chọn Mùa giải</label>
                <select className={dashboardStyles.inputField}
                  value={selectedSeason} 
                  onChange={(e) => {
                      setSelectedSeason(e.target.value);
                      setPredictionForm({ ...predictionForm, tournament_id: "", race_id: "", horse_id: "" });
                  }}>
                  <option value="">-- Tất cả mùa giải --</option>
                  {uniqueSeasons.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Chọn Giải đấu</label>
                <select className={dashboardStyles.inputField}
                  value={predictionForm.tournament_id || ""} 
                  onChange={(e) => setPredictionForm({ ...predictionForm, tournament_id: e.target.value, race_id: "", horse_id: "" })}>
                  <option value="">-- Tất cả giải đấu --</option>
                  {tournaments
                    .filter(t => !selectedSeason || (t.start_date && new Date(t.start_date).getFullYear().toString() === selectedSeason))
                    .map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className={dashboardStyles.formGroup}>
                <label>Chọn Trận đua</label>
                <select className={dashboardStyles.inputField} required
                  value={predictionForm.race_id} 
                  onChange={(e) => setPredictionForm({ ...predictionForm, race_id: e.target.value, horse_id: "" })}>
                  <option value="">-- Chọn trận đua --</option>
                  {races.filter(rc => (rc.status === "SCHEDULED" || rc.status === "RUNNING") && (!predictionForm.tournament_id || rc.tournament_id === parseInt(predictionForm.tournament_id))).map(rc => (
                    <option key={rc.id} value={rc.id}>{rc.name} ({rc.track_condition} - {rc.distance}m)</option>
                  ))}
                </select>
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Chọn Ngựa đua</label>
                <select className={dashboardStyles.inputField} required
                  value={predictionForm.horse_id} 
                  disabled={!predictionForm.race_id || isLocked}
                  onChange={(e) => setPredictionForm({ ...predictionForm, horse_id: e.target.value })}>
                  <option value="">-- Chọn ngựa đua --</option>
                  {(() => {
                    const selectedRace = races.find(rc => rc.id === parseInt(predictionForm.race_id));
                    if (!selectedRace) return null;
                    return selectedRace.participants.map(p => (
                      <option key={p.horse_id} value={p.horse_id}>{p.horse_name} (Làn {p.lane_number})</option>
                    ));
                  })()}
                </select>
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Dự đoán thứ hạng về đích</label>
                <select className={dashboardStyles.inputField}
                  disabled={isLocked}
                  value={predictionForm.predicted_rank} onChange={(e) => setPredictionForm({ ...predictionForm, predicted_rank: e.target.value })}>
                  <option value="1">Hạng 1 (Về nhất)</option>
                  <option value="2">Hạng 2 (Về nhì)</option>
                  <option value="3">Hạng 3 (Về ba)</option>
                  <option value="4">Hạng 4</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button type="submit" className={dashboardStyles.btnPrimary} style={{ flex: 1 }} disabled={isLocked || !predictionForm.race_id || !predictionForm.horse_id}>
                  {editingPredictionId ? "Cập nhật" : "Gửi dự đoán"}
                </button>
                {editingPredictionId && (
                  <button type="button" onClick={cancelEdit} className={dashboardStyles.btnSecondary} style={{ flex: 1 }}>
                    Hủy sửa
                  </button>
                )}
              </div>
            </form>

            {/* Predictions History */}
            <div style={{ flex: 1.3 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
                flexWrap: "wrap",
                gap: "12px"
              }}>
                <h3 className={dashboardStyles.subHeading} style={{ margin: 0 }}>Lịch sử dự đoán của bạn</h3>
                <div className={dashboardStyles.card} style={{
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  borderLeft: "4px solid var(--color-burgundy)"
                }}>
                  <StarIcon size={16} style={{ color: "var(--color-burgundy)" }} />
                  <span style={{ color: "var(--color-text-dark)", fontWeight: "700", fontSize: "14px" }}>
                    Điểm thưởng: {profileStats.reward_points ?? 0} điểm
                  </span>
                </div>
              </div>
              <div className={dashboardStyles.tableWrapper}>
                <table className={dashboardStyles.table}>
                  <thead>
                    <tr>
                      <th className={dashboardStyles.th}>Trận đua</th>
                      <th className={dashboardStyles.th}>Ngựa đua</th>
                      <th className={dashboardStyles.th}>Hạng dự đoán</th>
                      <th className={dashboardStyles.th}>Kết quả</th>
                      <th className={dashboardStyles.th}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "24px" }} className={dashboardStyles.td}>Chưa có dự đoán nào</td></tr>
                    ) : (
                      predictions.map(p => (
                        <tr key={p.id} className={dashboardStyles.rowHover}>
                          <td className={dashboardStyles.td}>{p.race_name || `Làn ${p.race_participant_id}`}</td>
                          <td style={{ fontWeight: "700" }} className={dashboardStyles.td}>{p.horse_name}</td>
                          <td className={dashboardStyles.td}>Hạng {p.predicted_rank}</td>
                          <td className={dashboardStyles.td}>
                            <span className={`${dashboardStyles.badge} ${
                              p.status === "Won" ? dashboardStyles.badgeApproved 
                              : p.status === "Lost" ? dashboardStyles.badgeRejected 
                              : dashboardStyles.badgePending
                            }`}>
                              {p.status === "Won" ? "✓ Đúng" : p.status === "Lost" ? "✗ Sai" : "⏳ Chờ kết quả"}
                            </span>
                          </td>
                          <td className={dashboardStyles.td}>
                            {p.status !== "Won" && p.status !== "Lost" ? (
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button onClick={() => handleEditClick(p)} className={dashboardStyles.btnPrimary} style={{ padding: "4px 8px", fontSize: "11px" }}>Sửa</button>
                                <button onClick={() => deletePrediction(p.id)} className={dashboardStyles.btnSecondary} style={{ padding: "4px 8px", fontSize: "11px", color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)" }}>Xóa</button>
                              </div>
                            ) : (
                              <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>Đã khóa</span>
                            )}
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

      {/* TAB: Lịch thi đấu & Kết quả */}
      {activeTab === "schedules" && (
        <div className={dashboardStyles.tabContent}>
          {/* --- Section 1: Lịch thi đấu sắp diễn ra --- */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                <CalendarIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Lịch thi đấu sắp diễn ra
              </h2>
              <select className={dashboardStyles.inputField} style={{ width: "200px" }}
                value={selectedSeason} 
                onChange={(e) => setSelectedSeason(e.target.value)}>
                <option value="">-- Tất cả mùa giải --</option>
                {uniqueSeasons.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {upcomingRaces.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "48px 24px",
                color: "var(--color-text-muted)",
                background: "rgba(224, 218, 205, 0.15)",
                borderRadius: "12px",
                border: "1px dashed var(--color-border)"
              }}>
                <CalendarIcon size={48} style={{ color: "var(--color-border)", marginBottom: "12px", opacity: 0.5 }} />
                <p style={{ fontSize: "15px", margin: 0, fontWeight: "600" }}>Chưa có trận đấu nào sắp diễn ra</p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "16px"
              }}>
                {upcomingRaces.map(race => (
                  <div key={race.id} className={dashboardStyles.card} style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    borderTop: "3px solid var(--color-burgundy)"
                  }}>
                    {/* Race header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "16px", color: "var(--color-text-dark)", fontFamily: "var(--font-bungee)" }}>{race.name}</h3>
                        {race.referee_name && (
                          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Trọng tài: {race.referee_name}</span>
                        )}
                      </div>
                      <span className={`${dashboardStyles.badge} ${dashboardStyles.badgePending}`} style={{ fontSize: "10px" }}>{race.status}</span>
                    </div>

                    {/* Race details */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                      fontSize: "13px",
                      color: "var(--color-text-muted)"
                    }}>
                      <div>🕐 <strong style={{ color: "var(--color-text-dark)" }}>{formatDateTime(race.race_time)}</strong></div>
                      <div>📏 <strong style={{ color: "var(--color-text-dark)" }}>{race.distance}m</strong></div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        🏟️ Đường đua: <strong style={{ color: "var(--color-text-dark)" }}>{race.track_condition || "—"}</strong>
                      </div>
                    </div>

                    {/* Participants */}
                    {race.participants && race.participants.length > 0 && (
                      <div style={{
                        borderTop: "1px solid var(--color-border)",
                        paddingTop: "10px"
                      }}>
                        <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", fontWeight: "600" }}>
                          Danh sách tham gia ({race.participants.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {race.participants.map(p => (
                            <div key={p.id} style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "13px",
                              padding: "6px 8px",
                              borderRadius: "6px",
                              background: "rgba(224, 218, 205, 0.2)"
                            }}>
                              <span>
                                🏇 <strong style={{ color: "var(--color-burgundy)" }}>{p.horse_name}</strong>
                              </span>
                              <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>
                                {p.jockey_name} · Làn {p.lane_number}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--color-border)", margin: "8px 0" }} />

          {/* --- Section 2: Kết quả các trận đã kết thúc --- */}
          <div>
            <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <FlagIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Kết quả các trận đã kết thúc
            </h2>
            {completedRaces.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "48px 24px",
                color: "var(--color-text-muted)",
                background: "rgba(224, 218, 205, 0.15)",
                borderRadius: "12px",
                border: "1px dashed var(--color-border)"
              }}>
                <FlagIcon size={48} style={{ color: "var(--color-border)", marginBottom: "12px", opacity: 0.5 }} />
                <p style={{ fontSize: "15px", margin: 0, fontWeight: "600" }}>Chưa có trận đấu nào hoàn thành</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {completedRaces.map(race => (
                  <div key={race.id} className={dashboardStyles.card} style={{
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    padding: 0
                  }}>
                    {/* Clickable race header */}
                    <div
                      onClick={() => toggleRaceResults(race.id)}
                      style={{
                        padding: "16px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        transition: "background 0.2s",
                        background: expandedRace === race.id ? "rgba(122, 31, 61, 0.04)" : "transparent"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{
                          fontSize: "14px",
                          transition: "transform 0.3s ease",
                          transform: expandedRace === race.id ? "rotate(90deg)" : "rotate(0deg)",
                          display: "inline-block",
                          color: "var(--color-burgundy)"
                        }}>▶</span>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "15px", color: "var(--color-text-dark)", fontWeight: "700" }}>{race.name}</h3>
                          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                            {formatDateTime(race.race_time)} · {race.distance}m · {race.track_condition || "—"}
                          </span>
                        </div>
                      </div>
                      <span className={`${dashboardStyles.badge} ${dashboardStyles.badgeApproved}`} style={{ fontSize: "10px" }}>HOÀN THÀNH</span>
                    </div>

                    {/* Expandable results */}
                    {expandedRace === race.id && (
                      <div style={{
                        padding: "0 20px 16px 20px",
                        borderTop: "1px solid var(--color-border)",
                        background: "rgba(245, 240, 230, 0.2)"
                      }}>
                        {loadingResults[race.id] ? (
                          <div style={{
                            textAlign: "center",
                            padding: "24px",
                            color: "var(--color-burgundy)",
                            fontSize: "14px",
                            fontWeight: "600"
                          }}>
                            ⏳ Đang tải kết quả...
                          </div>
                        ) : raceResults[race.id] && raceResults[race.id].length > 0 ? (
                          <div className={dashboardStyles.tableWrapper} style={{ marginTop: "12px" }}>
                            <table className={dashboardStyles.table}>
                              <thead>
                                <tr>
                                  <th className={dashboardStyles.th} style={{ width: "80px" }}>Hạng</th>
                                  <th className={dashboardStyles.th}>Ngựa đua</th>
                                  <th className={dashboardStyles.th}>Jockey</th>
                                  <th className={dashboardStyles.th} style={{ width: "80px" }}>Điểm</th>
                                  <th className={dashboardStyles.th}>Ghi chú</th>
                                </tr>
                              </thead>
                              <tbody>
                                {raceResults[race.id].map(r => (
                                  <tr key={r.id} className={dashboardStyles.rowHover}>
                                    <td className={dashboardStyles.td} style={{ fontSize: "16px", fontWeight: "800", color: "var(--color-text-dark)" }}>
                                      {getRankBadge(r.rank)}
                                    </td>
                                    <td className={dashboardStyles.td} style={{
                                      fontWeight: "700",
                                      color: r.rank === 1 ? "var(--color-burgundy)" : "var(--color-text-dark)"
                                    }}>
                                      {r.horse_name}
                                    </td>
                                    <td className={dashboardStyles.td}>{r.jockey_name}</td>
                                    <td className={dashboardStyles.td} style={{
                                      fontWeight: "700",
                                      color: "var(--color-forest)"
                                    }}>
                                      {r.points}
                                    </td>
                                    <td className={dashboardStyles.td} style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>
                                      {r.notes || "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{
                            textAlign: "center",
                            padding: "20px",
                            color: "var(--color-text-muted)",
                            fontSize: "13px"
                          }}>
                            Chưa có kết quả chi tiết cho trận đấu này
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Hồ sơ cá nhân */}
      {activeTab === "profile" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <UserIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Hồ sơ cá nhân khán giả
          </h2>
          
          <div className={dashboardStyles.splitLayout}>
            <form onSubmit={updateProfile} className={dashboardStyles.formPanel} style={{ margin: 0, flex: 1.5 }}>
              <h3 className={dashboardStyles.subHeading}>Chỉnh sửa thông tin</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
                <div className={dashboardStyles.formGroup}>
                  <label>Họ và Tên</label>
                  <input
                    type="text"
                    className={dashboardStyles.inputField}
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    placeholder="Nhập họ và tên..."
                  />
                </div>
                <div className={dashboardStyles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    className={dashboardStyles.inputField}
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className={dashboardStyles.formGroup}>
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    className={dashboardStyles.inputField}
                    value={profileForm.phone_number}
                    onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                    placeholder="Nhập số điện thoại..."
                  />
                </div>
                <div className={dashboardStyles.formGroup}>
                  <label>URL Ảnh đại diện</label>
                  <input
                    type="text"
                    className={dashboardStyles.inputField}
                    value={profileForm.avatar}
                    onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <div className={dashboardStyles.formGroup}>
                  <label>Giống ngựa yêu thích</label>
                  <input
                    type="text"
                    className={dashboardStyles.inputField}
                    value={profileForm.favorite_horse_breed}
                    onChange={(e) => setProfileForm({ ...profileForm, favorite_horse_breed: e.target.value })}
                    placeholder="Ví dụ: Arabian..."
                  />
                </div>
                <div className={dashboardStyles.formGroup}>
                  <label>Nài ngựa yêu thích</label>
                  <input
                    type="text"
                    className={dashboardStyles.inputField}
                    value={profileForm.favorite_jockey}
                    onChange={(e) => setProfileForm({ ...profileForm, favorite_jockey: e.target.value })}
                    placeholder="Tên nài ngựa..."
                  />
                </div>
                <div className={dashboardStyles.formGroup}>
                  <label>Giới tính</label>
                  <select
                    className={dashboardStyles.inputField}
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  >
                    <option value="">-- Chọn giới tính --</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>
              <button type="submit" className={dashboardStyles.btnPrimary} style={{ width: "100%", marginTop: "15px" }}>
                Cập nhật thông tin
              </button>
            </form>

            <div className={dashboardStyles.card} style={{ flex: 1, minWidth: "280px" }}>
              <h3 className={dashboardStyles.subHeading} style={{ color: "var(--color-burgundy)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                <StarIcon size={18} /> Thống kê & Thành tích
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {profileForm.avatar && (
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profileForm.avatar} alt="Avatar" width={80} height={80}
                      style={{ borderRadius: "50%", objectFit: "cover", border: "3px solid var(--color-burgundy)" }}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/fallback-avatar.png"; }} />
                  </div>
                )}
                <div className={dashboardStyles.infoListItem}>
                  <label>Thứ hạng hiện tại:</label>
                  <span style={{ fontWeight: "700" }}>{profileStats.current_rank || "Chưa xếp hạng"}</span>
                </div>
                <div className={dashboardStyles.infoListItem}>
                  <label>Tổng số dự đoán:</label>
                  <span>{profileStats.total_predictions} trận</span>
                </div>
                <div className={dashboardStyles.infoListItem}>
                  <label>Tỷ lệ chính xác:</label>
                  <span style={{ fontWeight: "700", color: "var(--color-forest)" }}>{profileStats.accuracy_rate}%</span>
                </div>
                <div className={dashboardStyles.infoListItem}>
                  <label>Điểm thưởng:</label>
                  <span style={{ fontWeight: "700", color: "var(--color-burgundy)" }}>{profileStats.reward_points} điểm</span>
                </div>
              </div>
            </div>
          </div>

          <div className={dashboardStyles.card} style={{ marginTop: "20px", padding: "24px" }}>
            <h3 className={dashboardStyles.subHeading} style={{ marginBottom: "16px", color: "var(--color-burgundy)", display: "flex", alignItems: "center", gap: "6px" }}>
              <TrophyIcon size={18} /> Lịch sử dự đoán gần đây
            </h3>
            {predictions.length > 0 ? (
              <div className={dashboardStyles.tableWrapper}>
                <table className={dashboardStyles.table}>
                  <thead>
                    <tr>
                      <th className={dashboardStyles.th}>Tên trận đua</th>
                      <th className={dashboardStyles.th}>Ngựa đã chọn</th>
                      <th className={dashboardStyles.th}>Thời gian</th>
                      <th className={dashboardStyles.th}>Trạng thái</th>
                      <th className={dashboardStyles.th}>Điểm thưởng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.slice(0, 10).map(pred => {
                      const isWon = pred.status === "Won";
                      const isLost = pred.status === "Lost";
                      return (
                        <tr key={pred.id} className={dashboardStyles.rowHover}>
                          <td className={dashboardStyles.td} style={{ fontWeight: "600" }}>{pred.race_name || `Trận #${pred.race_id}`}</td>
                          <td className={dashboardStyles.td} style={{ fontWeight: "700" }}>{pred.horse_name || `Ngựa #${pred.horse_id}`}</td>
                          <td className={dashboardStyles.td}>{pred.prediction_date ? formatDateTime(pred.prediction_date) : "—"}</td>
                          <td className={dashboardStyles.td}>
                            <span className={`${dashboardStyles.badge} ${isWon ? dashboardStyles.badgeApproved : isLost ? dashboardStyles.badgeRejected : dashboardStyles.badgePending}`}>
                              {isWon ? "Thắng" : isLost ? "Thua" : "Đang chờ"}
                            </span>
                          </td>
                          <td className={dashboardStyles.td} style={{ fontWeight: "700", color: isWon ? "var(--color-forest)" : "var(--color-text-muted)" }}>
                            {isWon ? "+10" : "0"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>Chưa có dự đoán nào.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
