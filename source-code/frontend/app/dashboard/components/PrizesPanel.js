"use client";

import { useEffect, useState } from "react";
import { api } from "../../api";
import { styles } from "./styles";
import dashboardStyles from "../dashboard.module.css";
import { AwardIcon, TrashIcon, TrophyIcon } from "./Icons";

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
      console.error("Tournament loading error:", err);
    }
  };

  const loadPrizes = async () => {
    if (!selectedTournament) return;
    try {
      setLoading(true);
      const data = await api.get(`/tournaments/${selectedTournament}/prizes`);
      setPrizes(data);
    } catch (err) {
      console.error("Prize loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  const createPrize = async (e) => {
    e.preventDefault();
    if (!selectedTournament || !newPrize.position || !newPrize.title) {
      showMsg("Please fill in all the information", "error");
      return;
    }
    try {
      await api.post(`/tournaments/${selectedTournament}/prizes`, {
        position: parseInt(newPrize.position),
        title: newPrize.title,
        prize_value: parseFloat(newPrize.prize_value) || 0,
        description: newPrize.description,
      });
      showMsg("Create a successful award!");
      setNewPrize({ position: "", title: "", prize_value: "", description: "" });
      loadPrizes();
    } catch (err) {
      showMsg(err.message || "Award creation error", "error");
    }
  };

  const deletePrize = async (prizeId) => {
    if (!window.confirm("Confirmation of prize cancellation?")) return;
    try {
      await api.delete(`/tournaments/${selectedTournament}/prizes/${prizeId}`);
      showMsg("Prize removed successfully!");
      loadPrizes();
    } catch (err) {
      showMsg(err.message || "Error deleting prize", "error");
    }
  };

  return (
    <div className={dashboardStyles.tabContent}>
      {activeTab === "prizes" && (
        <div>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AwardIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Quản lý Giải thưởng
          </h2>
          
          {/* Select Tournament */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontWeight: "600" }}>Chọn giải đấu:</label>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className={dashboardStyles.inputField}
              style={{ marginTop: "8px" }}
            >
              <option value="">
                -- Chọn giải đấu --
              </option>
              {tournaments.map((t) => (
                <option 
                  key={t.id} 
                  value={t.id} 
                >
                  {t.name} ({t.status})
                </option>
              ))}
            </select>
          </div>

          {selectedTournament && (
            <>
              {/* Create Prize Form */}
              <div 
                className={dashboardStyles.card} 
                style={{
                  marginBottom: "24px",
                  borderLeft: "4px solid var(--color-burgundy)"
                }}
              >
                <h3 className={dashboardStyles.subHeading} style={{ marginTop: 0, marginBottom: "12px" }}>Thêm Giải Thưởng</h3>
                <form onSubmit={createPrize} style={{ display: "grid", gap: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className={dashboardStyles.formGroup} style={{ margin: 0 }}>
                      <label>Hạng (Position) *</label>
                      <input
                        type="number"
                        min="1"
                        value={newPrize.position}
                        onChange={(e) => setNewPrize({ ...newPrize, position: e.target.value })}
                        placeholder="1"
                        className={dashboardStyles.inputField}
                        required
                      />
                    </div>
                    <div className={dashboardStyles.formGroup} style={{ margin: 0 }}>
                      <label>Tên giải *</label>
                      <input
                        type="text"
                        value={newPrize.title}
                        onChange={(e) => setNewPrize({ ...newPrize, title: e.target.value })}
                        placeholder="Giải Nhất"
                        className={dashboardStyles.inputField}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className={dashboardStyles.formGroup} style={{ margin: 0 }}>
                      <label>Giá trị giải (VNĐ)</label>
                      <input
                        type="number"
                        min="0"
                        value={newPrize.prize_value}
                        onChange={(e) => setNewPrize({ ...newPrize, prize_value: e.target.value })}
                        placeholder="1000000"
                        className={dashboardStyles.inputField}
                      />
                    </div>
                    <div className={dashboardStyles.formGroup} style={{ margin: 0 }}>
                      <label>Mô tả</label>
                      <input
                        type="text"
                        value={newPrize.description}
                        onChange={(e) => setNewPrize({ ...newPrize, description: e.target.value })}
                        placeholder="Mô tả giải thưởng"
                        className={dashboardStyles.inputField}
                      />
                    </div>
                  </div>
                  <button type="submit" className={dashboardStyles.btnPrimary} style={{ marginTop: "8px" }}>
                    Thêm Giải Thưởng
                  </button>
                </form>
              </div>

              {/* Prizes List */}
              <div className={dashboardStyles.tableWrapper}>
                <h3 className={dashboardStyles.subHeading} style={{ margin: "16px" }}>Danh sách giải thưởng</h3>
                {loading ? (
                  <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "20px" }}>Đang tải...</p>
                ) : prizes.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "20px" }}>Chưa có giải thưởng nào</p>
                ) : (
                  <table className={dashboardStyles.table}>
                    <thead>
                      <tr>
                        <th className={dashboardStyles.th}>Hạng</th>
                        <th className={dashboardStyles.th}>Tên giải</th>
                        <th className={dashboardStyles.th}>Giá trị (VNĐ)</th>
                        <th className={dashboardStyles.th}>Mô tả</th>
                        <th className={dashboardStyles.th}>Đã trao cho</th>
                        <th className={dashboardStyles.th}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prizes.map((prize) => (
                        <tr key={prize.id} className={dashboardStyles.rowHover}>
                          <td className={dashboardStyles.td}>#{prize.position}</td>
                          <td className={dashboardStyles.td} style={{ fontWeight: "600" }}>{prize.title}</td>
                          <td className={dashboardStyles.td}>{prize.prize_value?.toLocaleString() || "0"}</td>
                          <td className={dashboardStyles.td}>{prize.description || "-"}</td>
                          <td className={dashboardStyles.td}>
                            {prize.awarded_to_horse ? (
                              <span style={{ color: "var(--color-burgundy)", fontWeight: "600" }}>
                                {prize.awarded_to_horse} ({prize.awarded_to_jockey})
                              </span>
                            ) : (
                              <span style={{ color: "var(--color-text-muted)" }}>Chưa trao</span>
                            )}
                          </td>
                          <td className={dashboardStyles.td}>
                            <button
                              onClick={() => deletePrize(prize.id)}
                              className={dashboardStyles.btnSecondary}
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                color: "var(--danger)",
                                borderColor: "rgba(239, 68, 68, 0.3)",
                                background: "rgba(239, 68, 68, 0.05)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <TrashIcon size={12} /> Xóa
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
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <TrophyIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Xem Awards (Bản ghi trao giải)
          </h2>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "24px" }}>
            Hiển thị tất cả các giải thưởng đã trao cho các đội trong các giải đấu đã hoàn thành.
          </p>
          
          <div 
            className={dashboardStyles.card} 
            style={{
              padding: "24px",
              textAlign: "center",
              borderLeft: "4px solid var(--color-burgundy)",
              color: "var(--color-text-muted)"
            }}
          >
            <p style={{ fontWeight: "600", marginBottom: "8px", color: "var(--color-text-dark)" }}>
              Awards will be automatically generated when the tournament status changes to COMPLETED.
            </p>
            <p>Currently, there are no awards for this feature, or it is still under development.</p>
          </div>
        </div>
      )}
    </div>
  );
}
