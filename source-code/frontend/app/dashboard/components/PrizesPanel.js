"use client";

import { useEffect, useState } from "react";
import { api } from "../../api";
import { styles } from "./styles";

export default function PrizesPanel({ activeTab, showMsg }) {
  const [tournaments, setTournaments] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [awards, setAwards] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [loading, setLoading] = useState(false);

  // Form state
  const [newPrize, setNewPrize] = useState({ position: "", title: "", prize_value: "", description: "" });

  useEffect(() => {
    loadTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadPrizes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournament]);

  const loadTournaments = async () => {
    try {
      const tours = await api.get("/tournaments?limit=100");
      setTournaments(tours);
    } catch (err) {
      console.error("Lỗi tải giải đấu:", err);
    }
  };

  const loadPrizes = async () => {
    if (!selectedTournament) return;
    try {
      setLoading(true);
      const data = await api.get(`/tournaments/${selectedTournament}/prizes`);
      setPrizes(data);
    } catch (err) {
      console.error("Lỗi tải giải thưởng:", err);
    } finally {
      setLoading(false);
    }
  };

  const createPrize = async (e) => {
    e.preventDefault();
    if (!selectedTournament || !newPrize.position || !newPrize.title) {
      showMsg("Vui lòng điền đầy đủ thông tin", "error");
      return;
    }
    try {
      await api.post(`/tournaments/${selectedTournament}/prizes`, {
        position: parseInt(newPrize.position),
        title: newPrize.title,
        prize_value: parseFloat(newPrize.prize_value) || 0,
        description: newPrize.description,
      });
      showMsg("Tạo giải thưởng thành công!");
      setNewPrize({ position: "", title: "", prize_value: "", description: "" });
      loadPrizes();
    } catch (err) {
      showMsg(err.message || "Lỗi tạo giải thưởng", "error");
    }
  };

  const deletePrize = async (prizeId) => {
    if (!window.confirm("Xác nhận xóa giải thưởng?")) return;
    try {
      await api.delete(`/tournaments/${selectedTournament}/prizes/${prizeId}`);
      showMsg("Xóa giải thưởng thành công!");
      loadPrizes();
    } catch (err) {
      showMsg(err.message || "Lỗi xóa giải thưởng", "error");
    }
  };

  return (
    <div style={styles.tabContent}>
      {activeTab === "prizes" && (
        <div>
          <h2>🏅 Quản lý Giải thưởng</h2>
          
          {/* Select Tournament */}
          <div style={{ marginBottom: "24px" }}>
            <label>Chọn giải đấu:</label>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              style={{ ...styles.input, marginTop: "8px" }}
            >
              <option value="" style={{ backgroundColor: "#1e293b", color: "#ffffff" }}>
                -- Chọn giải đấu --
              </option>
              {tournaments.map((t) => (
                <option 
                  key={t.id} 
                  value={t.id} 
                  style={{ backgroundColor: "#1e293b", color: "#ffffff" }}
                >
                  {t.name} ({t.status})
                </option>
              ))}
            </select>
          </div>

          {selectedTournament && (
            <>
              {/* Create Prize Form */}
              <div style={{
                ...styles.formCard,
                marginBottom: "24px",
                padding: "16px",
                background: "rgba(59,130,246,0.08)",
                borderLeft: "4px solid var(--primary)",
                borderRadius: "8px"
              }}>
                <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Thêm Giải Thưởng</h3>
                <form onSubmit={createPrize} style={{ display: "grid", gap: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label>Hạng (Position) *</label>
                      <input
                        type="number"
                        min="1"
                        value={newPrize.position}
                        onChange={(e) => setNewPrize({ ...newPrize, position: e.target.value })}
                        placeholder="1"
                        style={styles.input}
                        required
                      />
                    </div>
                    <div>
                      <label>Tên giải *</label>
                      <input
                        type="text"
                        value={newPrize.title}
                        onChange={(e) => setNewPrize({ ...newPrize, title: e.target.value })}
                        placeholder="Giải Nhất"
                        style={styles.input}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label>Giá trị giải (VNĐ)</label>
                      <input
                        type="number"
                        min="0"
                        value={newPrize.prize_value}
                        onChange={(e) => setNewPrize({ ...newPrize, prize_value: e.target.value })}
                        placeholder="1000000"
                        style={styles.input}
                      />
                    </div>
                    <div>
                      <label>Mô tả</label>
                      <input
                        type="text"
                        value={newPrize.description}
                        onChange={(e) => setNewPrize({ ...newPrize, description: e.target.value })}
                        placeholder="Mô tả giải thưởng"
                        style={styles.input}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: "8px" }}>
                    Thêm Giải Thưởng
                  </button>
                </form>
              </div>

              {/* Prizes List */}
              <div style={styles.tableWrapper}>
                <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Danh sách giải thưởng</h3>
                {loading ? (
                  <p style={{ textAlign: "center", color: "#64748b" }}>Đang tải...</p>
                ) : prizes.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#64748b" }}>Chưa có giải thưởng nào</p>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th>Hạng</th>
                        <th>Tên giải</th>
                        <th>Giá trị (VNĐ)</th>
                        <th>Mô tả</th>
                        <th>Đã trao cho</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prizes.map((prize) => (
                        <tr key={prize.id}>
                          <td>#{prize.position}</td>
                          <td style={{ fontWeight: "600" }}>{prize.title}</td>
                          <td>{prize.prize_value?.toLocaleString() || "0"}</td>
                          <td>{prize.description || "-"}</td>
                          <td>
                            {prize.awarded_to_horse ? (
                              <span style={{ color: "var(--success)", fontWeight: "600" }}>
                                {prize.awarded_to_horse} ({prize.awarded_to_jockey})
                              </span>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>Chưa trao</span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => deletePrize(prize.id)}
                              style={{
                                ...styles.btnSmall,
                                background: "rgba(239,68,68,0.1)",
                                color: "var(--danger)",
                                border: "1px solid rgba(239,68,68,0.3)"
                              }}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "awards" && (
        <div>
          <h2>🏆 Xem Awards (Bản ghi trao giải)</h2>
          <p style={{ color: "#64748b", marginBottom: "24px" }}>
            Hiển thị tất cả các giải thưởng đã trao cho các đội trong các giải đấu đã hoàn thành.
          </p>
          
          <div style={{
            background: "rgba(59,130,246,0.08)",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "center",
            color: "#64748b"
          }}>
            <p>Awards sẽ tự động tạo khi tournament chuyển sang status COMPLETED.</p>
            <p>Hiện tại chưa có awards nào hoặc feature này còn đang phát triển.</p>
          </div>
        </div>
      )}
    </div>
  );
}
