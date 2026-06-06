"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "./api";

export default function Home() {
  const [rankings, setRankings] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState({
    tournamentsCount: 0,
    racesCount: 0,
    horsesCount: 0,
    jockeysCount: 0
  });

  useEffect(() => {
    // Fetch stats and rankings
    const fetchLandingData = async () => {
      try {
        const ranks = await api.get("/results/rankings");
        setRankings(ranks.slice(0, 5)); // top 5
        
        const tours = await api.get("/tournaments");
        setTournaments(tours);
        
        const horses = await api.get("/horses");
        const jockeys = await api.get("/jockeys");
        const races = await api.get("/races");

        setStats({
          tournamentsCount: tours.length,
          racesCount: races.length,
          horsesCount: horses.length,
          jockeysCount: jockeys.length
        });
      } catch (err) {
        console.error("Error loading landing page data:", err);
      }
    };
    fetchLandingData();
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header} className="glass">
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🏇</span>
          <span style={styles.logoText}>HORSE <span style={{ color: "var(--primary)" }}>RACING</span></span>
        </div>
        <div style={styles.navButtons}>
          <Link href="/login" className="btn-secondary" style={{ padding: "8px 16px", fontSize: "14px" }}>
            Đăng nhập
          </Link>
          <Link href="/register" className="btn-primary" style={{ padding: "8px 16px", fontSize: "14px" }}>
            Đăng ký
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>
          HỆ THỐNG QUẢN LÝ <br/>
          <span style={styles.gradientText} className="text-glow-primary">GIẢI ĐẤU ĐUA NGỰA</span>
        </h1>
        <p style={styles.heroSubtitle}>
          Nền tảng chuyên nghiệp dành cho Ban tổ chức, Chủ ngựa, Jockey, Trọng tài và Khán giả. Lập lịch đua, quản lý kết quả và xếp hạng thời gian thực.
        </p>
        <div style={styles.heroCTA}>
          <Link href="/login" className="btn-primary" style={{ padding: "14px 28px", fontSize: "16px" }}>
            Vào bảng điều khiển ➜
          </Link>
          <Link href="/register" className="btn-secondary" style={{ padding: "14px 28px", fontSize: "16px" }}>
            Tạo tài khoản mới
          </Link>
        </div>
      </section>

      {/* Stats Cards */}
      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard} className="glass-interactive">
            <span style={styles.statIcon}>🏆</span>
            <div style={styles.statValue}>{stats.tournamentsCount}</div>
            <div style={styles.statLabel}>Giải đấu</div>
          </div>
          <div style={styles.statCard} className="glass-interactive">
            <span style={styles.statIcon}>🏁</span>
            <div style={styles.statValue}>{stats.racesCount}</div>
            <div style={styles.statLabel}>Trận đua</div>
          </div>
          <div style={styles.statCard} className="glass-interactive">
            <span style={styles.statIcon}>🐎</span>
            <div style={styles.statValue}>{stats.horsesCount}</div>
            <div style={styles.statLabel}>Ngựa đua</div>
          </div>
          <div style={styles.statCard} className="glass-interactive">
            <span style={styles.statIcon}>👤</span>
            <div style={styles.statValue}>{stats.jockeysCount}</div>
            <div style={styles.statLabel}>Jockeys</div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section style={styles.mainContent}>
        <div style={styles.gridTwoCols}>
          {/* Active Tournaments */}
          <div style={styles.card} className="glass">
            <h2 style={styles.cardTitle}>📅 Giải đấu đang diễn ra</h2>
            <div style={styles.listContainer}>
              {tournaments.length === 0 ? (
                <div style={styles.empty}>Chưa có giải đấu nào được lên lịch</div>
              ) : (
                tournaments.map((t) => (
                  <div key={t.id} style={styles.listItem}>
                    <div>
                      <div style={styles.itemHeader}>{t.name}</div>
                      <div style={styles.itemSub}>{t.location} • {t.start_date} đến {t.end_date}</div>
                    </div>
                    <span className={`badge ${t.status === "ACTIVE" ? "badge-approved" : "badge-pending"}`}>
                      {t.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Rankings Leaderboard */}
          <div style={styles.card} className="glass">
            <h2 style={styles.cardTitle}>⭐ Top Bảng Xếp Hạng</h2>
            <div style={styles.listContainer}>
              {rankings.length === 0 ? (
                <div style={styles.empty}>Bảng xếp hạng đang cập nhật...</div>
              ) : (
                rankings.map((r, i) => (
                  <div key={r.id} style={styles.listItem}>
                    <div style={styles.rankInfo}>
                      <span style={{
                        ...styles.rankNum,
                        color: i === 0 ? "#f59e0b" : i === 1 ? "#cbd5e1" : i === 2 ? "#b45309" : "#64748b"
                      }}>
                        #{i + 1}
                      </span>
                      <div>
                        <div style={styles.itemHeader}>{r.entity_name}</div>
                        <div style={styles.itemSub}>{r.entity_type}</div>
                      </div>
                    </div>
                    <div style={styles.pointsText}>{r.points} Điểm</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2026 Horse Racing Tournament Management System. Thiết kế cao cấp & trực quan.</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px 5% 80px 5%",
    maxWidth: "1400px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "48px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    borderRadius: "16px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoIcon: {
    fontSize: "28px",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "1.5px",
  },
  navButtons: {
    display: "flex",
    gap: "16px",
  },
  hero: {
    textAlign: "center",
    padding: "60px 0 20px 0",
    maxWidth: "800px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  heroTitle: {
    fontSize: "48px",
    fontWeight: "900",
    lineHeight: "1.2",
    letterSpacing: "-1px",
  },
  gradientText: {
    background: "linear-gradient(135deg, var(--primary) 0%, #ea580c 50%, var(--accent) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSubtitle: {
    fontSize: "18px",
    color: "#94a3b8",
    lineHeight: "1.6",
  },
  heroCTA: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    marginTop: "12px",
  },
  statsSection: {
    marginTop: "-12px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "24px",
  },
  statCard: {
    padding: "24px",
    borderRadius: "16px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  statIcon: {
    fontSize: "36px",
    marginBottom: "4px",
  },
  statValue: {
    fontSize: "32px",
    fontWeight: "800",
    color: "var(--foreground)",
  },
  statLabel: {
    fontSize: "14px",
    color: "#94a3b8",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  mainContent: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  gridTwoCols: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
    gap: "32px",
  },
  card: {
    padding: "32px",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  cardTitle: {
    fontSize: "22px",
    fontWeight: "800",
    color: "var(--foreground)",
    borderBottom: "1px solid var(--card-border)",
    paddingBottom: "16px",
  },
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: "12px",
    transition: "background 0.2s ease",
  },
  itemHeader: {
    fontSize: "16px",
    fontWeight: "700",
  },
  itemSub: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "4px",
  },
  rankInfo: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  rankNum: {
    fontSize: "20px",
    fontWeight: "900",
    width: "36px",
    textAlign: "center",
  },
  pointsText: {
    fontSize: "16px",
    fontWeight: "700",
    color: "var(--primary)",
  },
  empty: {
    textAlign: "center",
    color: "#64748b",
    padding: "40px 0",
  },
  footer: {
    textAlign: "center",
    color: "#475569",
    fontSize: "14px",
    marginTop: "24px",
  }
};
