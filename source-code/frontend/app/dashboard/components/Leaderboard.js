"use client";

import { useEffect, useState } from "react";
import { api } from "../../api";
import { styles } from "./styles";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("horse_jockey"); // horse_jockey | spectators
  const [rankings, setRankings] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("all");
  const [spectatorRankings, setSpectatorRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRankings = async (tournamentId = "") => {
    try {
      const url = tournamentId ? `/results/rankings?tournament_id=${tournamentId}` : "/results/rankings";
      const data = await api.get(url);
      setRankings(data);
    } catch (err) {
      setError(err.message || "Không thể tải bảng xếp hạng");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [rankData, specData, tourData] = await Promise.all([
        api.get("/results/rankings"),
        api.get("/spectators/rankings"),
        api.get("/tournaments")
      ]);
      setRankings(rankData);
      setSpectatorRankings(specData);
      setTournaments(tourData);
    } catch (err) {
      setError(err.message || "Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rankData, tourData] = await Promise.all([
          api.get("/results/rankings"),
          api.get("/tournaments"),
        ]);
        setRankings(Array.isArray(rankData) ? rankData : []);
        setTournaments(Array.isArray(tourData) ? tourData : []);
      } catch (err) {
        setError(err.message || "Không thể tải bảng xếp hạng");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Lọc ranking theo giải đấu được chọn
  const filteredRankings = selectedTournament === "all"
    ? rankings
    : rankings.filter(r => String(r.tournament_id) === selectedTournament);
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

const horseRankings = filteredRankings.filter(r => r.entity_type === "HORSE");
const jockeyRankings = filteredRankings.filter(r => r.entity_type === "JOCKEY");

return (
  <div style={styles.tabContent}>
    <h2>⭐ Bảng xếp hạng thi đấu chính thức</h2>

    {/* Bộ lọc giải đấu - phối hợp với Spectator */}
    <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <label style={{ color: "#94a3b8", fontWeight: "600", whiteSpace: "nowrap" }}>🏆 Lọc theo giải đấu:</label>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          onClick={() => setSelectedTournament("all")}
          style={{
            padding: "7px 16px", borderRadius: "20px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px",
            background: selectedTournament === "all" ? "var(--primary)" : "#1e293b",
            color: selectedTournament === "all" ? "#fff" : "#94a3b8",
            transition: "all 0.2s"
          }}
        >
          Tất cả
        </button>
        {tournaments.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTournament(String(t.id))}
            style={{
              padding: "7px 16px", borderRadius: "20px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px",
              background: selectedTournament === String(t.id) ? "var(--primary)" : "#1e293b",
              color: selectedTournament === String(t.id) ? "#fff" : "#94a3b8",
              transition: "all 0.2s"
            }}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>

    {/* Hiển thị giải đấu đang xem */}
    {
      selectedTournament !== "all" && (
        <div style={{ marginBottom: "16px", padding: "10px 16px", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155", color: "#94a3b8", fontSize: "13px" }}>
          📋 Đang xem: <strong style={{ color: "#fff" }}>{tournaments.find(t => String(t.id) === selectedTournament)?.name}</strong>
          {filteredRankings.length === 0 && <span style={{ marginLeft: "12px", color: "#64748b" }}>— Chưa có dữ liệu xếp hạng</span>}
        </div>
      )
    }

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

    {activeTab === "horse_jockey" && (
      <>
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
                <th>Khán giả</th>
                <th>Giống ngựa yêu thích</th>
                <th>Điểm tích lũy</th>
              </tr>
            </thead>
            <tbody>
              {spectatorRankings.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: "800", color: i < 3 ? "var(--primary)" : "var(--foreground)" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </td>
                  <td style={{ fontWeight: "700" }}>
                    {s.full_name || s.username}
                  </td>
                  <td style={{ color: "#64748b" }}>{s.favorite_horse_breed || "—"}</td>
                  <td style={{ fontWeight: "800", color: "#f59e0b" }}>{s.reward_points} điểm</td>
                </tr>
              ))}
              {spectatorRankings.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: "center", color: "#64748b" }}>Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);
}