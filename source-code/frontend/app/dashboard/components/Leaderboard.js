"use client";

import { useEffect, useState } from "react";
import { api } from "../../api";
import { styles } from "./styles";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("horse_jockey"); // "horse_jockey" | "spectators"
  const [rankings, setRankings] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("all");
  const [spectatorRankings, setSpectatorRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rankingsLoading, setRankingsLoading] = useState(false);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const tourData = await api.get("/tournaments");
        setTournaments(Array.isArray(tourData) ? tourData : []);

        // Spectator rankings gọi riêng, không crash trang nếu API chưa tồn tại
        try {
          const specData = await api.get("/spectators/rankings");
          setSpectatorRankings(Array.isArray(specData) ? specData : []);
        } catch {
          setSpectatorRankings([]);
        }
      } catch (err) {
        setError(err.message || "Không thể tải giải đấu");
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, []);

  useEffect(() => {
    const loadRankings = async () => {
      try {
        setRankingsLoading(true);
        const url = selectedTournament === "all"
          ? "/results/rankings"
          : `/results/rankings?tournament_id=${selectedTournament}`;
        const rankData = await api.get(url);
        setRankings(Array.isArray(rankData) ? rankData : []);
      } catch (err) {
        setError(err.message || "Không thể tải xếp hạng");
      } finally {
        setRankingsLoading(false);
      }
    };

    loadRankings();
  }, [selectedTournament]);

  if (loading) {
    return <div style={styles.loading}>Đang tải bảng xếp hạng...</div>;
  }

  if (error) {
    return <div style={{ color: "var(--danger)", padding: "24px" }}>Lỗi: {error}</div>;
  }

  const horseRankings = rankings.filter(r => r.entity_type === "HORSE");
  const jockeyRankings = rankings.filter(r => r.entity_type === "JOCKEY");

  return (
    <div style={styles.tabContent}>
      <h2>⭐ Bảng xếp hạng thi đấu chính thức</h2>

      {/* Tab switcher: Ngựa/Jockey vs Spectator */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("horse_jockey")}
          style={{
            padding: "8px 20px", borderRadius: "20px", border: "none", cursor: "pointer",
            fontWeight: "600", fontSize: "13px",
            background: activeTab === "horse_jockey" ? "var(--primary)" : "#1e293b",
            color: activeTab === "horse_jockey" ? "#fff" : "#94a3b8",
          }}
        >
          🐴🏇 Ngựa & Jockey
        </button>
        <button
          onClick={() => setActiveTab("spectators")}
          style={{
            padding: "8px 20px", borderRadius: "20px", border: "none", cursor: "pointer",
            fontWeight: "600", fontSize: "13px",
            background: activeTab === "spectators" ? "var(--primary)" : "#1e293b",
            color: activeTab === "spectators" ? "#fff" : "#94a3b8",
          }}
        >
          👥 Khán giả xuất sắc
        </button>
      </div>

      {/* TAB: Ngựa & Jockey */}
      {activeTab === "horse_jockey" && (
        <>
          {/* Bộ lọc giải đấu */}
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <label style={{ color: "#94a3b8", fontWeight: "600", whiteSpace: "nowrap" }}>🏆 Lọc theo giải đấu:</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => setSelectedTournament("all")}
                style={{
                  padding: "7px 16px", borderRadius: "20px", border: "none", cursor: "pointer",
                  fontWeight: "600", fontSize: "13px",
                  background: selectedTournament === "all" ? "var(--primary)" : "#1e293b",
                  color: selectedTournament === "all" ? "#fff" : "#94a3b8",
                }}
              >
                Tất cả
              </button>
              {tournaments.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTournament(String(t.id))}
                  style={{
                    padding: "7px 16px", borderRadius: "20px", border: "none", cursor: "pointer",
                    fontWeight: "600", fontSize: "13px",
                    background: selectedTournament === String(t.id) ? "var(--primary)" : "#1e293b",
                    color: selectedTournament === String(t.id) ? "#fff" : "#94a3b8",
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Banner giải đấu đang xem */}
          {selectedTournament !== "all" && (
            <div style={{ marginBottom: "16px", padding: "10px 16px", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155", color: "#94a3b8", fontSize: "13px" }}>
              📋 Đang xem: <strong style={{ color: "#fff" }}>{tournaments.find(t => String(t.id) === selectedTournament)?.name}</strong>
              {rankingsLoading ? (
                <span style={{ marginLeft: "12px", color: "var(--primary)" }}>— Đang tải dữ liệu...</span>
              ) : (
                rankings.length === 0 && <span style={{ marginLeft: "12px", color: "#64748b" }}>— Chưa có dữ liệu xếp hạng</span>
              )}
            </div>
          )}

          <div style={styles.splitLayout}>
            {/* Horse standings */}
            <div style={{ flex: 1 }}>
              <h3>🐴 Xếp hạng Ngựa đua</h3>
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
                    {horseRankings.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: "center", color: "#64748b", padding: "24px" }}>Chưa có dữ liệu</td></tr>
                    ) : (
                      horseRankings.map((r, i) => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: "800", color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7f32" : "var(--primary)" }}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                          </td>
                          <td style={{ fontWeight: "700" }}>{r.entity_name}</td>
                          <td>{r.points} điểm</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Jockey standings */}
            <div style={{ flex: 1 }}>
              <h3>🏇 Xếp hạng Jockey</h3>
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
                    {jockeyRankings.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: "center", color: "#64748b", padding: "24px" }}>Chưa có dữ liệu</td></tr>
                    ) : (
                      jockeyRankings.map((r, i) => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: "800", color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7f32" : "var(--secondary)" }}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                          </td>
                          <td style={{ fontWeight: "700" }}>{r.entity_name}</td>
                          <td>{r.points} điểm</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB: Khán giả xuất sắc */}
      {activeTab === "spectators" && (
        <div>
          <h3>🏆 Top 10 Khán giả có điểm dự đoán cao nhất</h3>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Khán giả</th>
                  <th>Giống ngựa yêu thích</th>
                  <th>Điểm tích lũy</th>
                </tr>
              </thead>
              <tbody>
                {spectatorRankings.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: "center", color: "#64748b", padding: "24px" }}>Chưa có dữ liệu</td></tr>
                ) : (
                  spectatorRankings.slice(0, 10).map((s, i) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: "800", color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7f32" : "var(--foreground)" }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </td>
                      <td style={{ fontWeight: "700" }}>{s.full_name || s.username}</td>
                      <td style={{ color: "#64748b" }}>{s.favorite_horse_breed || "—"}</td>
                      <td style={{ fontWeight: "800", color: "#f59e0b" }}>{s.reward_points} điểm</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}