"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../api";
import { styles } from "./components/styles";
import AdminPanel from "./components/AdminPanel";
import OwnerPanel from "./components/OwnerPanel";
import JockeyPanel from "./components/JockeyPanel";
import RefereePanel from "./components/RefereePanel";
import SpectatorPanel from "./components/SpectatorPanel";
import Leaderboard from "./components/Leaderboard";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const u = await api.getMe();
        setUser(u);
        setLoading(false);
        
        // Determine default tab based on role
        if (u.role_name === "ADMIN") setActiveTab("tournaments");
        else if (u.role_name === "OWNER") setActiveTab("my-horses");
        else if (u.role_name === "JOCKEY") setActiveTab("invitations");
        else if (u.role_name === "REFEREE") setActiveTab("assigned-races");
        else if (u.role_name === "SPECTATOR") setActiveTab("predictions");
      } catch (err) {
        console.error("Auth failed:", err);
        router.push("/login");
      }
    };
    checkAuthAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleLogout = () => {
    api.logout();
    router.push("/");
  };

  if (loading) {
    return <div style={styles.loading}>Đang tải trang điều khiển...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Top Navbar */}
      <header style={styles.header} className="glass">
        <div style={styles.brand}>
          <span style={{ fontSize: "24px" }}>🏇</span>
          <span style={styles.brandText}>DASHBOARD</span>
        </div>
        <div style={styles.userProfile}>
          <span style={styles.userInfo}>
            <span style={styles.userName}>{user.full_name}</span>
            <span className="badge badge-info" style={{ fontSize: "10px" }}>{user.role_name}</span>
          </span>
          {user.role_name === "SPECTATOR" && user.spectator_profile && (
            <div style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              borderRadius: "20px",
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 10px rgba(245,158,11,0.35)",
              animation: "fadeIn 0.5s ease"
            }}>
              <span style={{ fontSize: "14px" }}>🏆</span>
              <span style={{ color: "#fff", fontWeight: "700", fontSize: "13px", whiteSpace: "nowrap" }}>
                {user.spectator_profile.reward_points ?? 0} pts
              </span>
            </div>
          )}
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "13px" }}>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Action Banner */}
      {message.text && (
        <div style={{
          ...styles.banner,
          backgroundColor: message.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
          borderColor: message.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)",
          color: message.type === "error" ? "var(--danger)" : "var(--success)"
        }}>
          {message.text}
        </div>
      )}

      {/* Main Grid: Sidebar + Workspace */}
      <div style={styles.mainGrid}>
        
        {/* Sidebar Nav */}
        <nav style={styles.sidebar} className="glass">
          {/* Admin Tabs */}
          {user.role_name === "ADMIN" && (
            <>
              <button style={activeTab === "tournaments" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("tournaments")}>
                🏆 Quản lý Giải đấu
              </button>
              <button style={activeTab === "registrations" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("registrations")}>
                📋 Xét duyệt Đăng ký
              </button>
              <button style={activeTab === "races" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("races")}>
                🏁 Lập lịch Trận đua
              </button>
              <button style={activeTab === "users" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("users")}>
                  Quản lý Người dùng
              </button>              
            </>
          )}

          {/* Owner Tabs */}
          {user.role_name === "OWNER" && (
            <>
              <button style={activeTab === "my-horses" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("my-horses")}>
                🐎 Quản lý Ngựa
              </button>
              <button style={activeTab === "invite-jockey" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("invite-jockey")}>
                ✉️ Mời Jockey
              </button>
              <button style={activeTab === "register-tournament" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("register-tournament")}>
                🏆 Đăng ký Giải đấu
              </button>
              <button style={activeTab === "my-registrations" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("my-registrations")}>
                📋 Giải đấu đã đăng ký
              </button>
              <button style={activeTab === "upcoming-races" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("upcoming-races") }>
                📅 Lịch thi đấu của Ngựa
              </button>
              <button style={activeTab === "results" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("results") }>
                🏆 Kết quả thi đấu
              </button>
              <button style={activeTab === "profile" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("profile") }>
                👤 Hồ sơ cá nhân
              </button>
            </>
          )}

          {/* Jockey Tabs */}
          {user.role_name === "JOCKEY" && (
            <>
              <button style={activeTab === "invitations" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("invitations")}>
                ✉️ Lời mời Nhận được
              </button>
              <button style={activeTab === "jockey-races" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("jockey-races")}>
                🏁 Lịch trình Đua
              </button>
              <button style={activeTab === "profile" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("profile")}>
  👤 Hồ sơ cá nhân
</button>
            </>
          )}

          {/* Referee Tabs */}
          {user.role_name === "REFEREE" && (
            <>
              <button style={activeTab === "assigned-races" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("assigned-races")}>
                🏁 Trận đua phân công
              </button>
            </>
          )}

          {/* Spectator Tabs */}
          {user.role_name === "SPECTATOR" && (
            <>
              <button style={activeTab === "predictions" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("predictions")}>
                🔮 Dự đoán Trận đua
              </button>
              <button style={activeTab === "schedules" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("schedules")}>
                📅 Lịch & Kết quả
              </button>
              <button style={activeTab === "profile" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("profile")}>
                👤 Hồ sơ cá nhân
              </button>
            </>
          )}

          {/* Common Leaderboard tab */}
          <div style={{ borderTop: "1px solid var(--card-border)", margin: "10px 0", paddingTop: "10px" }} />
          <button style={activeTab === "leaderboard" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("leaderboard")}>
            ⭐ Bảng Xếp Hạng
          </button>
        </nav>

        {/* Work Area */}
        <main style={styles.workspace} className="glass">
          {activeTab === "leaderboard" ? (
            <Leaderboard/>  
          ) : (
            <>
          
          {user.role_name === "ADMIN" && <AdminPanel user={user} activeTab={activeTab} showMsg={showMsg} />}
          {user.role_name === "OWNER" && <OwnerPanel user={user} activeTab={activeTab} showMsg={showMsg} />}
          {user.role_name === "JOCKEY" && <JockeyPanel user={user} activeTab={activeTab} showMsg={showMsg} />}
          {user.role_name === "REFEREE" && <RefereePanel user={user} activeTab={activeTab} showMsg={showMsg} />}
          {user.role_name === "SPECTATOR" && <SpectatorPanel user={user} activeTab={activeTab} showMsg={showMsg} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
