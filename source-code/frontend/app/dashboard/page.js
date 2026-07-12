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
import PrizesPanel from "./components/PrizesPanel";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const router = useRouter();
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  

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
  
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      showMsg("Please fill in all the information!", "error");
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      showMsg("The new password must contain at least 8 characters!", "error");
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      showMsg("Confirming the new password does not match!", "error");
      return;
    }

    try {
      setPwdLoading(true);
      await api.put("/auth/change-password", {
        old_password: pwdForm.oldPassword,
        new_password: pwdForm.newPassword
      });
      showMsg("Password changed successfully!");
      setPwdForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setShowPwdModal(false);
    } catch (error) {
      const serverError = error?.response?.data?.detail || "The old password is incorrect!";
      showMsg(`❌ ${serverError}`, "error");
    } finally {
      setPwdLoading(false);
    }
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
              <button style={activeTab === "overview" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("overview")}>
                📊 Tổng quan hệ thống
              </button>
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
                👥 Quản lý Người dùng
              </button>
              <button style={activeTab === "prizes" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("prizes")}>
                🏅 Quản lý Giải thưởng
              </button>
              <button style={activeTab === "awards" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("awards")}>
                🏆 Xem Awards
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
              <button style={activeTab === "jockey-rewards" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("jockey-rewards")}>
                🏆 Giải thưởng đạt được
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
          <button 
            style={{ ...styles.tabBtn, marginTop: "10px", color: "#fcd34d", border: "1px dashed rgba(252, 211, 77, 0.3)" }} 
            onClick={() => setShowPwdModal(true)}
          >
            🔐 Đổi mật khẩu của tôi
          </button>
        </nav>

        {/* Work Area */}
        <main style={styles.workspace} className="glass">
          {activeTab === "leaderboard" ? (
            <Leaderboard/>  
          ) : (
            <>
          
          {user.role_name === "ADMIN" && (activeTab === "prizes" || activeTab === "awards" ? <PrizesPanel activeTab={activeTab} showMsg={showMsg} /> : <AdminPanel user={user} activeTab={activeTab} showMsg={showMsg} />)}
          {user.role_name === "OWNER" && <OwnerPanel user={user} activeTab={activeTab} showMsg={showMsg} />}
          {user.role_name === "JOCKEY" && <JockeyPanel user={user} activeTab={activeTab} showMsg={showMsg} />}
          {user.role_name === "REFEREE" && <RefereePanel user={user} activeTab={activeTab} showMsg={showMsg} />}
          {user.role_name === "SPECTATOR" && <SpectatorPanel user={user} activeTab={activeTab} showMsg={showMsg} />}
            </>
          )}
        </main>
      </div>
      {/* ================= MODAL HIỂN THỊ ĐỔI MẬT KHẨU ================= */}
      {showPwdModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "400px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#fff" }}>🔐 Đổi mật khẩu cá nhân</h3>
            {message.text && (
              <div style={{
                padding: "10px 12px",
                marginBottom: "16px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "500",
                textAlign: "center",
                backgroundColor: message.type === "error" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                border: `1px solid ${message.type === "error" ? "#f87171" : "#34d399"}`,
                color: message.type === "error" ? "#f87171" : "#34d399",
                animation: "fadeIn 0.3s ease"
              }}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Mật khẩu hiện tại</label>
                <div style={{ position: "relative" }}>
                  <input type={showOldPwd ? "text" : "password"} style={{ width: "100%", padding: "10px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff" }} value={pwdForm.oldPassword} onChange={e => setPwdForm({ ...pwdForm, oldPassword: e.target.value })} />
                  <button type="button" onClick={() => setShowOldPwd(!showOldPwd)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>{showOldPwd ? "👁️" : "🙈"}</button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Mật khẩu mới</label>
                <div style={{ position: "relative" }}>
                  <input type={showNewPwd ? "text" : "password"} style={{ width: "100%", padding: "10px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff" }} value={pwdForm.newPassword} onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })} />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>{showNewPwd ? "👁️" : "🙈"}</button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Xác nhận mật khẩu mới</label>
                <input type="password" style={{ width: "100%", padding: "10px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff" }} value={pwdForm.confirmPassword} onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button type="submit" style={{ flex: 1, padding: "10px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }} disabled={pwdLoading}>
                  {pwdLoading ? "🔄 Đang lưu..." : "Cập nhật"}
                </button>
                <button type="button" style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }} onClick={() => { setShowPwdModal(false); setPwdForm({ oldPassword: "", newPassword: "", confirmPassword: "" }); }}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}      
    </div>
  );
}
