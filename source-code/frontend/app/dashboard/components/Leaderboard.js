"use client";

import { useEffect, useState } from "react";
import { api } from "../../api";
import { styles } from "./styles";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("horse_jockey"); // horse_jockey | spectators
  const [rankings, setRankings] = useState([]);
  const [spectatorRankings, setSpectatorRankings] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRankings = async (tournamentId = "") => {
    try {
      const url = tournamentId ? `/results/rankings?tournament_id=${tournamentId}` : "/results/rankings";
      const rankData = await api.get(url);
      setRankings(rankData);
    } catch (err) {
      setError(err.message || "Không thể tải bảng xếp hạng Ngựa & Jockey");
    }

    try {
      // Bảng Khán giả xuất sắc (LUÔN hiển thị Top Toàn cục hoặc theo giải đấu)
      const specUrl = tournamentId ? `/spectators/rankings?tournament_id=${tournamentId}` : "/spectators/rankings";
      const specData = await api.get(specUrl);
      setSpectatorRankings(specData);
    } catch (err) {
      console.error("Lỗi khi tải bảng khán giả xuất sắc:", err);
      // Không set `error` toàn cục để không làm crash cả component
      setSpectatorRankings([]); 
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const tourData = await api.get("/tournaments/");
      setTournaments(tourData);
      
      const rankData = await api.get("/results/rankings");
      setRankings(rankData);
    } catch (err) {
      setError(err.message || "Lỗi khi tải dữ liệu giải đấu/kết quả");
    }

    try {
      const specData = await api.get("/spectators/rankings");
      setSpectatorRankings(specData);
    } catch (err) {
      console.error("Lỗi khi tải bảng khán giả xuất sắc:", err);
      setSpectatorRankings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchRankings(selectedTournament);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournament]);

  if (loading) {
    return <div style={styles.loading}>Đang tải bảng xếp hạng...</div>;
  }

  if (error) {
    return <div style={{ color: "var(--danger)", padding: "24px" }}>Lỗi: {error}</div>;
  }

  return (
    <div style={styles.tabContent}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>⭐ Bảng xếp hạng thi đấu chính thức</h2>
        
        <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.05)", padding: "4px", borderRadius: "8px" }}>
          <button 
            className={activeTab === "horse_jockey" ? "btn-primary" : "btn-secondary"}
            onClick={() => setActiveTab("horse_jockey")}
            style={{ padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", transition: "0.2s" }}
          >
            Ngựa & Jockey
          </button>
          <button 
            className={activeTab === "spectators" ? "btn-primary" : "btn-secondary"}
            onClick={() => setActiveTab("spectators")}
            style={{ padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", transition: "0.2s" }}
          >
            Khán giả xuất sắc
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>Lọc theo Giải đấu:</label>
        <select 
          className="input-field" 
          style={{ width: "250px", display: "inline-block" }}
          value={selectedTournament} 
          onChange={(e) => setSelectedTournament(e.target.value)}
        >
          <option value="">Tất cả giải đấu (Toàn cục)</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {activeTab === "horse_jockey" && (
        <>
          <div style={styles.splitLayout}>
            {/* Horse standings */}
            <div style={{ flex: 1 }}>
              <h3>Xếp hạng Ngựa đua</h3>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Hạng</th>
                      <th>Tên Ngựa</th>
                      <th>Điểm tích lũy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.filter(r => r.entity_type === "HORSE").map((r, i) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: "800", color: "var(--primary)" }}>#{i + 1}</td>
                        <td style={{ fontWeight: "700" }}>{r.entity_name}</td>
                        <td>{r.points} điểm</td>
                      </tr>
                    ))}
                    {rankings.filter(r => r.entity_type === "HORSE").length === 0 && (
                      <tr><td colSpan="3" style={{ textAlign: "center", color: "#64748b" }}>Chưa có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Jockey standings */}
            <div style={{ flex: 1 }}>
              <h3>Xếp hạng Jockey</h3>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Hạng</th>
                      <th>Tên Jockey</th>
                      <th>Điểm tích lũy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.filter(r => r.entity_type === "JOCKEY").map((r, i) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: "800", color: "var(--secondary)" }}>#{i + 1}</td>
                        <td style={{ fontWeight: "700" }}>{r.entity_name}</td>
                        <td>{r.points} điểm</td>
                      </tr>
                    ))}
                    {rankings.filter(r => r.entity_type === "JOCKEY").length === 0 && (
                      <tr><td colSpan="3" style={{ textAlign: "center", color: "#64748b" }}>Chưa có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "spectators" && (
        <div>
          <h3>Top 10 Khán giả có điểm dự đoán cao nhất</h3>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Avatar</th>
                  <th>Khán giả</th>
                  <th>Điểm tích lũy</th>
                  <th>Đoán đúng</th>
                  <th>Tổng đoán</th>
                </tr>
              </thead>
              <tbody>
                {spectatorRankings.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: "800", color: i < 3 ? "var(--primary)" : "var(--foreground)" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </td>
                    <td>
                      {s.avatar ? (
                        <img src={s.avatar} alt="avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" }}>
                          {(s.full_name || s.username || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: "700" }}>
                      {s.full_name || s.username}
                    </td>
                    <td style={{ fontWeight: "800", color: "#f59e0b" }}>{s.reward_points} điểm</td>
                    <td style={{ color: "var(--success)", fontWeight: "600" }}>{s.correct_predictions || 0}</td>
                    <td style={{ color: "#64748b" }}>{s.total_predictions || 0}</td>
                  </tr>
                ))}
                {spectatorRankings.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: "center", color: "#64748b" }}>Chưa có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
