"use client";

import { useEffect, useState } from "react";
import { api } from "../../api";
import { styles } from "./styles";

export default function RefereePanel({ user, activeTab, showMsg }) {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRace, setSelectedRace] = useState(null);
  const [resultsForm, setResultsForm] = useState([]); // Array of { race_participant_id, rank, points, notes }
  const [violationForm, setViolationForm] = useState({ race_participant_id: "", description: "", penalty: "Cảnh cáo", fine_amount: "0" });
  const [fineAmountError, setFineAmountError] = useState("");

  const [selectedRaceForInspection, setSelectedRaceForInspection] = useState(null);
  const [inspectionForm, setInspectionForm] = useState({ weather: "", track_condition: "", horse_health: "" });

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

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    return <div style={styles.loading}>Đang tải dữ liệu Referee...</div>;
  }

  return (
    <>
      {/* TAB: Trận đua phân công (Referee) */}
      {activeTab === "assigned-races" && (
        <div style={styles.tabContent}>
          <h2>🏁 Các trận đua được phân công giám sát</h2>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Tên trận đua</th>
                  <th>Thời gian</th>
                  <th>Khoảng cách</th>
                  <th>Điều kiện chạy</th>
                  <th>Số ngựa tham gia</th>
                  <th>Trạng thái</th>
                  <th>Ghi kết quả</th>
                </tr>
              </thead>
              <tbody>
                {races.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: "center", color: "#64748b" }}>Chưa được phân công trận đua nào</td></tr>
                ) : (
                  races.map(rc => (
                    <tr key={rc.id}>
                      <td style={{ fontWeight: "700" }}>{rc.name}</td>
                      <td>{formatDateTime(rc.race_time)}</td>
                      <td>{rc.distance}m</td>
                      <td>{rc.track_condition}</td>
                      <td>{rc.participants.length}</td>
                      <td>
                        <span className={`badge ${rc.status === "COMPLETED" ? "badge-approved" : rc.status === "RESULTS_ENTERED" ? "badge-info" : "badge-pending"}`}>
                          {rc.status}
                        </span>
                      </td>
                      <td>
                        {rc.status === "SCHEDULED" && (
                          <button className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px", marginRight: "8px", backgroundColor: "#3b82f6" }}
                            onClick={() => initInspectionForm(rc)}>
                            Kiểm tra đường đua
                          </button>
                        )}
                        <button className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px", marginRight: "8px" }}
                          onClick={() => initResultsForm(rc)}>
                          {rc.status === "COMPLETED" ? "Sửa kết quả" : "Nhập kết quả"}
                        </button>
                        {rc.status === "RESULTS_ENTERED" && (
                          <button className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px", backgroundColor: "var(--success)" }}
                            onClick={() => handleConfirmResults(rc.id)}>
                            Xác nhận kết quả chính thức
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Enter Results Overlay Panel */}
          {selectedRace && (
            <div style={{ marginTop: "32px", borderTop: "1px solid var(--card-border)", paddingTop: "24px" }}>
              <h2>📝 Nhập kết quả & Vi phạm cho trận: <span style={{ color: "var(--primary)" }}>{selectedRace.name}</span></h2>
              
              <div style={styles.splitLayout}>
                {/* Results Form */}
                <form onSubmit={submitResults} style={{ ...styles.formPanel, flex: 1.5 }} className="glass">
                  <h3>Xếp hạng và Điểm số</h3>
                  {resultsForm.map((field, idx) => (
                    <div key={field.race_participant_id} style={{
                      display: "flex", gap: "16px", background: "rgba(255,255,255,0.01)",
                      padding: "12px", borderRadius: "8px", marginBottom: "8px", alignItems: "center"
                    }}>
                      <span style={{ fontWeight: "700", width: "120px" }}>🐎 {field.horse_name}</span>
                      <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label>Hạng về đích</label>
                        <input type="number" min="1" className="input-field" required
                          value={field.rank} onChange={(e) => {
                            const copy = [...resultsForm];
                            copy[idx].rank = e.target.value;
                            setResultsForm(copy);
                          }} />
                      </div>
                      <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label>Điểm cộng/trừ</label>
                        <input type="number" className="input-field" required
                          value={field.points} onChange={(e) => {
                            const copy = [...resultsForm];
                            copy[idx].points = e.target.value;
                            setResultsForm(copy);
                          }} />
                      </div>
                      <div className="form-group" style={{ margin: 0, flex: 1.5 }}>
                        <label>Ghi chú</label>
                        <input type="text" className="input-field" placeholder="Ghi chú đua..."
                          value={field.notes} onChange={(e) => {
                            const copy = [...resultsForm];
                            copy[idx].notes = e.target.value;
                            setResultsForm(copy);
                          }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button type="submit" className="btn-primary">Lưu kết quả cuộc đua</button>
                    <button type="button" onClick={() => setSelectedRace(null)} className="btn-secondary">Hủy</button>
                  </div>
                </form>

                {/* Violations Form */}
                <form onSubmit={submitViolation} style={{ ...styles.formPanel, flex: 1 }} className="glass">
                  <h3>Báo Cáo Vi Phạm</h3>
                  <div className="form-group">
                    <label>Chọn ngựa vi phạm</label>
                    <select className="input-field" required
                      value={violationForm.race_participant_id} onChange={(e) => setViolationForm({ ...violationForm, race_participant_id: e.target.value })}>
                      <option value="">-- Chọn ngựa đua --</option>
                      {selectedRace.participants.map(p => <option key={p.id} value={p.id}>{p.horse_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Mô tả vi phạm</label>
                    <textarea className="input-field" placeholder="Ví dụ: Chạy lấn làn của ngựa khác..." required
                      value={violationForm.description} onChange={(e) => setViolationForm({ ...violationForm, description: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Hình thức phạt</label>
                    <select className="input-field" required
                      value={violationForm.penalty} onChange={(e) => setViolationForm({ ...violationForm, penalty: e.target.value })}>
                      <option value="Cảnh cáo">Cảnh cáo</option>
                      <option value="Huỷ kết quả">Huỷ kết quả</option>
                      <option value="Cấm thi đấu 1 trận">Cấm thi đấu 1 trận</option>
                      <option value="Cấm thi đấu vĩnh viễn">Cấm thi đấu vĩnh viễn</option>
                      <option value="Phạt tiền">Phạt tiền</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Số tiền phạt (VND)</label>
                    <input type="number" min="0" max="99999999" step="1" className="input-field" required
                      value={violationForm.fine_amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = parseInt(val);
                        // Không được âm
                        if (val !== "" && num < 0) {
                          setViolationForm({ ...violationForm, fine_amount: "0" });
                          setFineAmountError("Số tiền phạt không được âm.");
                        // Không quá 8 chữ số (max 99999999)
                        } else if (val !== "" && num > 99999999) {
                          setViolationForm({ ...violationForm, fine_amount: "99999999" });
                          setFineAmountError("Số tiền phạt không được vượt quá 99.999.999.");
                        } else {
                          setViolationForm({ ...violationForm, fine_amount: val });
                          setFineAmountError("");
                        }
                      }} />
                    {fineAmountError && (
                      <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                        ⚠️ {fineAmountError}
                      </span>
                    )}
                  </div>
                  <button type="submit" className="btn-primary" style={{ backgroundColor: "var(--danger)" }}>Báo cáo vi phạm</button>
                </form>
              </div>
            </div>
          )}

          {selectedRaceForInspection && (
            <div style={{ marginTop: "32px", borderTop: "1px solid var(--card-border)", paddingTop: "24px" }}>
              <h2>🔍 Kiểm tra trước trận đấu: <span style={{ color: "var(--primary)" }}>{selectedRaceForInspection.name}</span></h2>
              
              <form onSubmit={submitInspection} style={{ ...styles.formPanel, maxWidth: "600px" }} className="glass">
                <div className="form-group">
                  <label>Thời tiết</label>
                  <input type="text" className="input-field" required placeholder="Ví dụ: Sunny, Rainy, Cloudy..."
                    value={inspectionForm.weather} onChange={(e) => setInspectionForm({ ...inspectionForm, weather: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Tình trạng đường chạy</label>
                  <input type="text" className="input-field" required placeholder="Ví dụ: Dry, Good, Wet, Muddy..."
                    value={inspectionForm.track_condition} onChange={(e) => setInspectionForm({ ...inspectionForm, track_condition: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Đánh giá sức khỏe ngựa</label>
                  <textarea className="input-field" required placeholder="Ví dụ: Tất cả ngựa tham gia đều đủ điều kiện sức khỏe..."
                    value={inspectionForm.horse_health} onChange={(e) => setInspectionForm({ ...inspectionForm, horse_health: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button type="submit" className="btn-primary">Gửi báo cáo kiểm tra</button>
                  <button type="button" onClick={() => setSelectedRaceForInspection(null)} className="btn-secondary">Hủy</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
}
