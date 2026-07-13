"use client";

import { useEffect, useState } from "react";
import { api } from "../../api";
import { styles } from "./styles";
import dashboardStyles from "../dashboard.module.css";
import { StarIcon, TrophyIcon, UsersIcon } from "./Icons";

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
    return <div className={dashboardStyles.loading}>Đang tải bảng xếp hạng...</div>;
  }

  if (error) {
    return <div style={{ color: "var(--danger)", padding: "24px" }}>Lỗi: {error}</div>;
  }

  const horseRankings = rankings.filter(r => r.entity_type === "HORSE");
  const jockeyRankings = rankings.filter(r => r.entity_type === "JOCKEY");

  return (
    <div className={dashboardStyles.tabContent}>
      <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <StarIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Bảng xếp hạng thi đấu chính thức
      </h2>

      {/* Tab switcher: Ngựa/Jockey vs Spectator */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("horse_jockey")}
          style={{
            padding: "8px 20px", borderRadius: "20px", border: "none", cursor: "pointer",
            fontWeight: "600", fontSize: "13px",
            background: activeTab === "horse_jockey" ? "var(--color-burgundy)" : "#ffffff",
            color: activeTab === "horse_jockey" ? "#fff" : "var(--color-text-dark)",
            border: activeTab === "horse_jockey" ? "none" : "1px solid var(--color-border)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <TrophyIcon size={16} /> Ngựa & Jockey
        </button>
        <button
          onClick={() => setActiveTab("spectators")}
          style={{
            padding: "8px 20px", borderRadius: "20px", border: "none", cursor: "pointer",
            fontWeight: "600", fontSize: "13px",
            background: activeTab === "spectators" ? "var(--color-burgundy)" : "#ffffff",
            color: activeTab === "spectators" ? "#fff" : "var(--color-text-dark)",
            border: activeTab === "spectators" ? "none" : "1px solid var(--color-border)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <UsersIcon size={16} /> Khán giả xuất sắc
        </button>
      </div>

      {/* TAB: Ngựa & Jockey */}
      {activeTab === "horse_jockey" && (
        <>
          {/* Bộ lọc giải đấu */}
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <label style={{ color: "var(--color-text-muted)", fontWeight: "600", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <TrophyIcon size={16} style={{ color: "var(--color-burgundy)" }} /> Lọc theo giải đấu:
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => setSelectedTournament("all")}
                style={{
                  padding: "7px 16px", borderRadius: "20px", border: "none", cursor: "pointer",
                  fontWeight: "600", fontSize: "13px",
                  background: selectedTournament === "all" ? "var(--color-burgundy)" : "#ffffff",
                  color: selectedTournament === "all" ? "#fff" : "var(--color-text-dark)",
                  border: selectedTournament === "all" ? "none" : "1px solid var(--color-border)",
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
                    background: selectedTournament === String(t.id) ? "var(--color-burgundy)" : "#ffffff",
                    color: selectedTournament === String(t.id) ? "#fff" : "var(--color-text-dark)",
                    border: selectedTournament === String(t.id) ? "none" : "1px solid var(--color-border)",
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Banner giải đấu đang xem */}
          {selectedTournament !== "all" && (
            <div style={{ marginBottom: "16px", padding: "10px 16px", background: "var(--color-cream)", borderRadius: "8px", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "13px" }}>
              Đang xem: <strong style={{ color: "var(--color-text-dark)" }}>{tournaments.find(t => String(t.id) === selectedTournament)?.name}</strong>
              {rankingsLoading ? (
                <span style={{ marginLeft: "12px", color: "var(--color-burgundy)" }}>— Đang tải dữ liệu...</span>
              ) : (
                rankings.length === 0 && <span style={{ marginLeft: "12px", color: "var(--color-text-muted)" }}>— Chưa có dữ liệu xếp hạng</span>
              )}
            </div>
          )}

          <div className={dashboardStyles.splitLayout}>
            {/* Horse standings */}
            <div style={{ flex: 1 }}>
              <h3 className={dashboardStyles.subHeading}>Xếp hạng Ngựa đua</h3>
              <div className={dashboardStyles.tableWrapper}>
                <table className={dashboardStyles.table}>
                  <thead>
                    <tr>
                      <th className={dashboardStyles.th}>Hạng</th>
                      <th className={dashboardStyles.th}>Tên Ngựa</th>
                      <th className={dashboardStyles.th}>Điểm tích lũy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horseRankings.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "24px" }} className={dashboardStyles.td}>Chưa có dữ liệu</td></tr>
                    ) : (
                      horseRankings.map((r, i) => (
                        <tr key={r.id} className={dashboardStyles.rowHover}>
                          <td className={dashboardStyles.td} style={{ fontWeight: "800", color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7f32" : "var(--color-text-muted)" }}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                          </td>
                          <td style={{ fontWeight: "700" }} className={dashboardStyles.td}>{r.entity_name}</td>
                          <td className={dashboardStyles.td}>{r.points} điểm</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Jockey standings */}
            <div style={{ flex: 1 }}>
              <h3 className={dashboardStyles.subHeading}>Xếp hạng Jockey</h3>
              <div className={dashboardStyles.tableWrapper}>
                <table className={dashboardStyles.table}>
                  <thead>
                    <tr>
                      <th className={dashboardStyles.th}>Hạng</th>
                      <th className={dashboardStyles.th}>Tên Jockey</th>
                      <th className={dashboardStyles.th}>Điểm tích lũy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jockeyRankings.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "24px" }} className={dashboardStyles.td}>Chưa có dữ liệu</td></tr>
                    ) : (
                      jockeyRankings.map((r, i) => (
                        <tr key={r.id} className={dashboardStyles.rowHover}>
                          <td className={dashboardStyles.td} style={{ fontWeight: "800", color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7f32" : "var(--color-text-muted)" }}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                          </td>
                          <td style={{ fontWeight: "700" }} className={dashboardStyles.td}>{r.entity_name}</td>
                          <td className={dashboardStyles.td}>{r.points} điểm</td>
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
          <h3 className={dashboardStyles.subHeading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <UsersIcon size={20} /> Top 10 Khán giả có điểm dự đoán cao nhất
          </h3>
          <div className={dashboardStyles.tableWrapper}>
            <table className={dashboardStyles.table}>
              <thead>
                <tr>
                  <th className={dashboardStyles.th}>Hạng</th>
                  <th className={dashboardStyles.th}>Khán giả</th>
                  <th className={dashboardStyles.th}>Giống ngựa yêu thích</th>
                  <th className={dashboardStyles.th}>Điểm tích lũy</th>
                </tr>
              </thead>
              <tbody>
                {spectatorRankings.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "24px" }} className={dashboardStyles.td}>Chưa có dữ liệu</td></tr>
                ) : (
                  spectatorRankings.slice(0, 10).map((s, i) => (
                    <tr key={s.id} className={dashboardStyles.rowHover}>
                      <td className={dashboardStyles.td} style={{ fontWeight: "800", color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7f32" : "var(--color-text-muted)" }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </td>
                      <td style={{ fontWeight: "700" }} className={dashboardStyles.td}>{s.full_name || s.username}</td>
                      <td style={{ color: "var(--color-text-muted)" }} className={dashboardStyles.td}>{s.favorite_horse_breed || "—"}</td>
                      <td style={{ fontWeight: "800", color: "var(--color-burgundy)" }} className={dashboardStyles.td}>{s.reward_points} điểm</td>
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