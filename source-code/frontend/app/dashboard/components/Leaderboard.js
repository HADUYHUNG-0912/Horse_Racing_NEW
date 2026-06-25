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
      <h2>⭐ Bảng xếp hạng thi đấu chính thức</h2>
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
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
      );
}
