"use client";

import { useEffect, useState } from "react";
import { api } from "../../api";
import { styles } from "./styles";

export default function SpectatorPanel({ user, activeTab, showMsg }) {
  const [predictions, setPredictions] = useState([]);
  const [races, setRaces] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState("");

  // Form states
  const [predictionForm, setPredictionForm] = useState({ tournament_id: "", race_id: "", horse_id: "", predicted_rank: "1", tournament_type: "" });
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

      const allRaces = await api.get("/races");
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
      setPredictionForm({ tournament_id: "", race_id: "", horse_id: "", predicted_rank: "1", tournament_type: "" });
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
      predicted_rank: pred.predicted_rank || "1",
      tournament_type: ""
    });
    // Scroll to form or focus
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingPredictionId(null);
    setPredictionForm({ tournament_id: "", race_id: "", horse_id: "", predicted_rank: "1", tournament_type: "" });
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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
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
    return <div style={styles.loading}>Đang tải dữ liệu Spectator...</div>;
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

  const upcomingRaces = filteredRaces.filter(rc => rc.status === "SCHEDULED" || rc.status === "PENDING");
  const completedRaces = filteredRaces.filter(rc => rc.status === "COMPLETED");

  const selectedRaceObj = races.find(rc => rc.id === parseInt(predictionForm.race_id));
  const isLocked = selectedRaceObj ? new Date() > new Date(selectedRaceObj.race_time) : false;

  return (
    <>
      {/* TAB: Dự đoán Trận đua (Spectator) */}
      {activeTab === "predictions" && (
        <div style={styles.tabContent}>
          <h2>🔮 Dự đoán thứ hạng trận đua dành cho khán giả</h2>
          <div style={styles.splitLayout}>
            {/* Make prediction */}
            <form onSubmit={makePrediction} style={styles.formPanel} className="glass">
              <h3>{editingPredictionId ? "Sửa dự đoán" : "Tạo dự đoán mới"}</h3>
              {isLocked && (
                <div style={{
                  padding: "10px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  fontSize: "13px"
                }}>
                  ⚠️ Trận đấu đã quá giờ, không thể dự đoán.
                </div>
              )}
              <div className="form-group">
                <label>Chọn Mùa giải</label>
                <select className="input-field"
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
              <div className="form-group">
                <label>Chọn Giải đấu</label>
                <select className="input-field"
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
              <div className="form-group">
                <label>Loại giải đấu</label>
                <select className="input-field"
                  value={predictionForm.tournament_type || ""} 
                  onChange={(e) => setPredictionForm({ ...predictionForm, tournament_type: e.target.value })}>
                  <option value="">-- Chọn loại giải đấu --</option>
                  <option value="championship">Giải Vô Địch</option>
                  <option value="friendly">Giải Giao Hữu</option>
                  <option value="open">Giải Mở Rộng</option>
                  <option value="charity">Giải Từ Thiện</option>
                </select>
              </div>
              <div className="form-group">
                <label>Chọn Trận đua</label>
                <select className="input-field" required
                  value={predictionForm.race_id} 
                  onChange={(e) => setPredictionForm({ ...predictionForm, race_id: e.target.value, horse_id: "" })}>
                  <option value="">-- Chọn trận đua --</option>
                  {races.filter(rc => (rc.status === "SCHEDULED" || rc.status === "PENDING") && (!predictionForm.tournament_id || rc.tournament_id === parseInt(predictionForm.tournament_id))).map(rc => (
                    <option key={rc.id} value={rc.id}>{rc.name} ({rc.track_condition} - {rc.distance}m)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Chọn Ngựa đua</label>
                <select className="input-field" required
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
              <div className="form-group">
                <label>Dự đoán thứ hạng về đích</label>
                <select className="input-field"
                  disabled={isLocked}
                  value={predictionForm.predicted_rank} onChange={(e) => setPredictionForm({ ...predictionForm, predicted_rank: e.target.value })}>
                  <option value="1">Hạng 1 (Về nhất)</option>
                  <option value="2">Hạng 2 (Về nhì)</option>
                  <option value="3">Hạng 3 (Về ba)</option>
                  <option value="4">Hạng 4</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isLocked || !predictionForm.race_id || !predictionForm.horse_id}>
                  {editingPredictionId ? "Cập nhật" : "Gửi dự đoán"}
                </button>
                {editingPredictionId && (
                  <button type="button" onClick={cancelEdit} className="btn-secondary" style={{ flex: 1, background: "#334155", color: "#fff" }}>
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
                marginBottom: "12px"
              }}>
                <h3 style={{ margin: 0 }}>Lịch sử dự đoán của bạn</h3>
                <div style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  borderRadius: "12px",
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 2px 8px rgba(245,158,11,0.3)"
                }}>
                  <span style={{ fontSize: "18px" }}>⭐</span>
                  <span style={{ color: "#fff", fontWeight: "700", fontSize: "14px" }}>
                    Điểm thưởng tích lũy: {user?.spectator_profile?.reward_points ?? 0} điểm
                  </span>
                </div>
              </div>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Trận đua</th>
                      <th>Ngựa đua</th>
                      <th>Hạng dự đoán</th>
                      <th>Kết quả</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: "center", color: "#64748b" }}>Chưa có dự đoán nào</td></tr>
                    ) : (
                      predictions.map(p => (
                        <tr key={p.id}>
                          <td>{p.race_name || `Làn ${p.race_participant_id}`}</td>
                          <td style={{ fontWeight: "700" }}>{p.horse_name}</td>
                          <td>Hạng {p.predicted_rank}</td>
                          <td>
                            <span className={`badge ${
                              p.status === "Won" ? "badge-approved" 
                              : p.status === "Lost" ? "badge-rejected" 
                              : "badge-pending"
                            }`}>
                              {p.status === "Won" ? "✅ Đúng" : p.status === "Lost" ? "❌ Sai" : "⏳ Chờ kết quả"}
                            </span>
                          </td>
                          <td>
                            {p.status !== "Won" && p.status !== "Lost" ? (
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button onClick={() => handleEditClick(p)} style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Sửa</button>
                                <button onClick={() => deletePrediction(p.id)} style={{ background: "#ef4444", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Xóa</button>
                              </div>
                            ) : (
                              <span style={{ color: "#64748b", fontSize: "12px" }}>Đã khóa</span>
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
        <div style={styles.tabContent}>
          {/* --- Section 1: Lịch thi đấu sắp diễn ra --- */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>📅 Lịch thi đấu sắp diễn ra</h2>
              <select className="input-field" style={{ width: "200px" }}
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
                color: "#64748b",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "12px",
                border: "1px dashed rgba(255,255,255,0.1)"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📭</div>
                <p style={{ fontSize: "15px" }}>Chưa có trận đấu nào sắp diễn ra</p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "16px"
              }}>
                {upcomingRaces.map(race => (
                  <div key={race.id} className="glass-interactive" style={{
                    padding: "20px",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}>
                    {/* Race header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "16px", color: "var(--foreground)" }}>{race.name}</h3>
                        {race.referee_name && (
                          <span style={{ fontSize: "12px", color: "#64748b" }}>Trọng tài: {race.referee_name}</span>
                        )}
                      </div>
                      <span className="badge badge-pending" style={{ fontSize: "10px" }}>{race.status}</span>
                    </div>

                    {/* Race details */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                      fontSize: "13px",
                      color: "#94a3b8"
                    }}>
                      <div>🕐 <strong style={{ color: "#cbd5e1" }}>{formatDateTime(race.race_time)}</strong></div>
                      <div>📏 <strong style={{ color: "#cbd5e1" }}>{race.distance}m</strong></div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        🏟️ Đường đua: <strong style={{ color: "#cbd5e1" }}>{race.track_condition || "—"}</strong>
                      </div>
                    </div>

                    {/* Participants */}
                    {race.participants && race.participants.length > 0 && (
                      <div style={{
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        paddingTop: "10px"
                      }}>
                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", fontWeight: "600" }}>
                          Danh sách tham gia ({race.participants.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {race.participants.map(p => (
                            <div key={p.id} style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "13px",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              background: "rgba(255,255,255,0.02)"
                            }}>
                              <span>
                                🐎 <strong style={{ color: "var(--primary)" }}>{p.horse_name}</strong>
                              </span>
                              <span style={{ color: "#94a3b8", fontSize: "12px" }}>
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
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "8px 0" }} />

          {/* --- Section 2: Kết quả các trận đã kết thúc --- */}
          <div>
            <h2 style={{ marginBottom: "20px" }}>🏁 Kết quả các trận đã kết thúc</h2>
            {completedRaces.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "48px 24px",
                color: "#64748b",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "12px",
                border: "1px dashed rgba(255,255,255,0.1)"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>🏁</div>
                <p style={{ fontSize: "15px" }}>Chưa có trận đấu nào hoàn thành</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {completedRaces.map(race => (
                  <div key={race.id} className="glass" style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    transition: "all 0.3s ease"
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
                        background: expandedRace === race.id ? "rgba(249,115,22,0.05)" : "transparent"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = expandedRace === race.id ? "rgba(249,115,22,0.05)" : "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{
                          fontSize: "20px",
                          transition: "transform 0.3s ease",
                          transform: expandedRace === race.id ? "rotate(90deg)" : "rotate(0deg)",
                          display: "inline-block"
                        }}>▶</span>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "15px" }}>{race.name}</h3>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>
                            {formatDateTime(race.race_time)} · {race.distance}m · {race.track_condition || "—"}
                          </span>
                        </div>
                      </div>
                      <span className="badge badge-approved" style={{ fontSize: "10px" }}>HOÀN THÀNH</span>
                    </div>

                    {/* Expandable results */}
                    {expandedRace === race.id && (
                      <div style={{
                        padding: "0 20px 16px 20px",
                        borderTop: "1px solid rgba(255,255,255,0.06)"
                      }}>
                        {loadingResults[race.id] ? (
                          <div style={{
                            textAlign: "center",
                            padding: "24px",
                            color: "var(--primary)",
                            fontSize: "14px"
                          }}>
                            ⏳ Đang tải kết quả...
                          </div>
                        ) : raceResults[race.id] && raceResults[race.id].length > 0 ? (
                          <table style={{ ...styles.table, marginTop: "12px" }}>
                            <thead>
                              <tr>
                                <th style={{ width: "60px" }}>Hạng</th>
                                <th>Ngựa đua</th>
                                <th>Jockey</th>
                                <th style={{ width: "80px" }}>Điểm</th>
                                <th>Ghi chú</th>
                              </tr>
                            </thead>
                            <tbody>
                              {raceResults[race.id].map(r => (
                                <tr key={r.id}>
                                  <td style={{ fontSize: "18px", textAlign: "center" }}>
                                    {getRankBadge(r.rank)}
                                  </td>
                                  <td style={{
                                    fontWeight: "700",
                                    color: r.rank === 1 ? "var(--primary)" : "var(--foreground)"
                                  }}>
                                    {r.horse_name}
                                  </td>
                                  <td>{r.jockey_name}</td>
                                  <td style={{
                                    fontWeight: "700",
                                    color: "var(--secondary)"
                                  }}>
                                    {r.points}
                                  </td>
                                  <td style={{ color: "#64748b", fontSize: "13px" }}>
                                    {r.notes || "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{
                            textAlign: "center",
                            padding: "20px",
                            color: "#64748b",
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
        <div style={styles.tabContent}>
          <h2 style={{ marginBottom: "20px" }}>👤 Hồ sơ cá nhân</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", alignItems: "start" }}>
            <form onSubmit={updateProfile} style={{ ...styles.formPanel, margin: 0, maxWidth: "none" }} className="glass">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div className="form-group">
                  <label>Họ và Tên</label>
                  <input
                    type="text"
                    className="input-field"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    placeholder="Nhập họ và tên..."
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    className="input-field"
                    value={profileForm.phone_number}
                    onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                    placeholder="Nhập số điện thoại..."
                  />
                </div>
                <div className="form-group">
                  <label>URL Ảnh đại diện</label>
                  <input
                    type="text"
                    className="input-field"
                    value={profileForm.avatar}
                    onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <div className="form-group">
                  <label>Giống ngựa yêu thích</label>
                  <input
                    type="text"
                    className="input-field"
                    value={profileForm.favorite_horse_breed}
                    onChange={(e) => setProfileForm({ ...profileForm, favorite_horse_breed: e.target.value })}
                    placeholder="Ví dụ: Arabian..."
                  />
                </div>
                <div className="form-group">
                  <label>Nài ngựa yêu thích</label>
                  <input
                    type="text"
                    className="input-field"
                    value={profileForm.favorite_jockey}
                    onChange={(e) => setProfileForm({ ...profileForm, favorite_jockey: e.target.value })}
                    placeholder="Tên nài ngựa..."
                  />
                </div>
                <div className="form-group">
                  <label>Giới tính</label>
                  <select
                    className="input-field"
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
              <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "15px" }}>
                Cập nhật thông tin
              </button>
            </form>

            <div className="glass" style={{ padding: "20px", borderRadius: "12px", border: "1px solid #334155" }}>
              <h3 style={{ marginBottom: "15px", fontSize: "18px", color: "#f97316" }}>Thống kê & Thành tích</h3>
              <div style={{ marginBottom: "10px" }}>
                <span style={{ color: "#94a3b8" }}>Thứ hạng hiện tại:</span>
                <strong style={{ display: "block", fontSize: "20px" }}>{profileStats.current_rank || "Chưa xếp hạng"}</strong>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <span style={{ color: "#94a3b8" }}>Tổng số trận dự đoán:</span>
                <strong style={{ display: "block", fontSize: "20px" }}>{profileStats.total_predictions}</strong>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <span style={{ color: "#94a3b8" }}>Tỷ lệ chính xác:</span>
                <strong style={{ display: "block", fontSize: "20px" }}>{profileStats.accuracy_rate}%</strong>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>Điểm thưởng:</span>
                <strong style={{ display: "block", fontSize: "20px" }}>{profileStats.reward_points}</strong>
              </div>
            </div>
          </div>

          <div className="glass" style={{ marginTop: "20px", padding: "20px", borderRadius: "12px", border: "1px solid #334155", overflowX: "auto" }}>
            <h3 style={{ marginBottom: "15px", fontSize: "18px", color: "#f97316" }}>Lịch sử dự đoán gần đây</h3>
            {predictions.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                    <th style={{ padding: "12px 8px" }}>Tên trận đua</th>
                    <th style={{ padding: "12px 8px" }}>Ngựa đã chọn</th>
                    <th style={{ padding: "12px 8px" }}>Thời gian</th>
                    <th style={{ padding: "12px 8px" }}>Trạng thái</th>
                    <th style={{ padding: "12px 8px" }}>Điểm thưởng</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map(pred => {
                    let statusColor = "#94a3b8";
                    let statusText = "Đang chờ";
                    if (pred.is_correct === true) { statusColor = "#22c55e"; statusText = "Thắng"; }
                    if (pred.is_correct === false) { statusColor = "#ef4444"; statusText = "Thua"; }

                    return (
                      <tr key={pred.id} style={{ borderBottom: "1px solid #1e293b" }}>
                        <td style={{ padding: "12px 8px" }}>{pred.race?.name || `Trận #${pred.race_id}`}</td>
                        <td style={{ padding: "12px 8px" }}>{pred.horse?.name || `Ngựa #${pred.horse_id}`}</td>
                        <td style={{ padding: "12px 8px" }}>{new Date(pred.created_at).toLocaleString()}</td>
                        <td style={{ padding: "12px 8px", color: statusColor, fontWeight: "600" }}>{statusText}</td>
                        <td style={{ padding: "12px 8px" }}>{pred.points_awarded > 0 ? `+${pred.points_awarded}` : "0"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>Chưa có dự đoán nào.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
