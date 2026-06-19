"use client";

import { useEffect, useState } from "react";
import { api } from "../../api";
import { styles } from "./styles";

export default function SpectatorPanel({ user, activeTab, showMsg }) {
  const [predictions, setPredictions] = useState([]);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [predictionForm, setPredictionForm] = useState({ race_id: "", horse_id: "", predicted_rank: "1" });

  const loadData = async () => {
    try {
      const preds = await api.get("/spectators/predictions");
      setPredictions(preds);

      const allRaces = await api.get("/races");
      setRaces(allRaces);
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
      await api.post("/spectators/predictions", {
        race_id: parseInt(predictionForm.race_id),
        horse_id: parseInt(predictionForm.horse_id),
        predicted_rank: parseInt(predictionForm.predicted_rank)
      });
      showMsg("Dự đoán thành công!");
      setPredictionForm({ race_id: "", horse_id: "", predicted_rank: "1" });
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  if (loading) {
    return <div style={styles.loading}>Đang tải dữ liệu Spectator...</div>;
  }

  return (
    <>
      {/* TAB: Dự đoán Trận đua (Spectator) */}
      {activeTab === "predictions" && (
        <div style={styles.tabContent}>
          <h2>🔮 Dự đoán thứ hạng trận đua dành cho khán giả</h2>
          <div style={styles.splitLayout}>
            {/* Make prediction */}
            <form onSubmit={makePrediction} style={styles.formPanel} className="glass">
              <h3>Tạo dự đoán mới</h3>
              <div className="form-group">
                <label>Chọn Trận đua</label>
                <select className="input-field" required
                  value={predictionForm.race_id} 
                  onChange={(e) => setPredictionForm({ ...predictionForm, race_id: e.target.value, horse_id: "" })}>
                  <option value="">-- Chọn trận đua --</option>
                  {races.filter(rc => rc.status === "SCHEDULED" || rc.status === "PENDING").map(rc => (
                    <option key={rc.id} value={rc.id}>{rc.name} ({rc.track_condition} - {rc.distance}m)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Chọn Ngựa đua</label>
                <select className="input-field" required
                  value={predictionForm.horse_id} 
                  disabled={!predictionForm.race_id}
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
                  value={predictionForm.predicted_rank} onChange={(e) => setPredictionForm({ ...predictionForm, predicted_rank: e.target.value })}>
                  <option value="1">Hạng 1 (Về nhất)</option>
                  <option value="2">Hạng 2 (Về nhì)</option>
                  <option value="3">Hạng 3 (Về ba)</option>
                  <option value="4">Hạng 4</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Gửi dự đoán</button>
            </form>

            {/* Predictions History */}
            <div style={{ flex: 1.3 }}>
              <h3>Lịch sử dự đoán của bạn</h3>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Trận đua</th>
                      <th>Ngựa đua</th>
                      <th>Hạng dự đoán</th>
                      <th>Kết quả</th>
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
                            <span className={`badge ${p.status === "CORRECT" ? "badge-approved" : p.status === "INCORRECT" ? "badge-rejected" : "badge-pending"}`}>
                              {p.status}
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
    </>
  );
}
