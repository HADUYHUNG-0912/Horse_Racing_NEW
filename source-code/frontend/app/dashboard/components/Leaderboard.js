"use client";

import { useEffect, useState } from "react";
import { api } from "../../api";
import { styles } from "./styles";

export default function Leaderboard() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const data = await api.get("/results/rankings");
        setRankings(data);
      } catch (err) {
        setError(err.message || "Không thể tải bảng xếp hạng");
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

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
      </div>
    </div>
  );
}
