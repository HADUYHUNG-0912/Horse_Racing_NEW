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

const DEFAULT_TAB_BY_ROLE = {
  ADMIN: "tournaments",
  OWNER: "my-horses",
  JOCKEY: "invitations",
  REFEREE: "assigned-races",
  SPECTATOR: "predictions",
};

function getDefaultTab(roleName) {
  return DEFAULT_TAB_BY_ROLE[roleName] || "leaderboard";
}

function getInitials(name) {
  if (!name) return "?";

  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function formatShortDate(value) {
  if (!value) return "Chưa có";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function AdminProfilePanel({ user }) {
  const displayName = user?.full_name || user?.username || "Admin";

  return (
    <div style={styles.tabContent}>
      <h2>👤 Hồ sơ cá nhân Quản trị viên</h2>
      <div style={styles.splitLayout}>
        <section style={styles.adminProfileHero} className="glass">
          <div style={styles.adminProfileAvatar}>
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" style={styles.adminProfileAvatarImage} />
            ) : (
              <span style={styles.adminProfileAvatarFallback}>{getInitials(displayName)}</span>
            )}
          </div>
          <strong style={{ fontSize: "20px" }}>{displayName}</strong>
          <span className="badge badge-info">{user?.role_name || "ADMIN"}</span>
        </section>

        <section style={styles.formPanel} className="glass">
          <h3>Thông tin tài khoản hiện tại</h3>
          <div style={styles.infoList}>
            <div><strong>Username:</strong> {user?.username || "—"}</div>
            <div><strong>Họ tên:</strong> {displayName}</div>
            <div><strong>Email:</strong> {user?.email || "—"}</div>
            <div><strong>Số điện thoại:</strong> {user?.phone_number || "Chưa có"}</div>
            <div><strong>Vai trò:</strong> {user?.role_name || "ADMIN"}</div>
            <div><strong>Ngày tạo:</strong> {formatShortDate(user?.created_at)}</div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [isProfileHover, setIsProfileHover] = useState(false);
  const router = useRouter();

  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const mergeUserWithDetail = (baseUser, detail) => {
    if (!detail) return baseUser;

    return {
      ...baseUser,
      ...detail,
      avatar: detail.avatar ?? baseUser.avatar ?? null,
      phone_number: detail.phone_number ?? baseUser.phone_number ?? null,
      profile: detail.profile ?? baseUser.profile ?? null,
    };
  };

  const refreshCurrentUser = async (userId) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    try {
      const userDetail = await api.get(`/auth/users/${targetUserId}`);
      setUser((previousUser) => (
        previousUser ? mergeUserWithDetail(previousUser, userDetail) : userDetail
      ));
    } catch (error) {
      console.error("Unable to refresh current user detail:", error);
    }
  };

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const authUser = await api.getMe();
        let hydratedUser = authUser;

        try {
          const userDetail = await api.get(`/auth/users/${authUser.id}`);
          hydratedUser = mergeUserWithDetail(authUser, userDetail);
        } catch (detailError) {
          console.error("Unable to hydrate current user detail:", detailError);
        }

        setUser(hydratedUser);
        setActiveTab(getDefaultTab(hydratedUser.role_name));
        setLoading(false);
      } catch (err) {
        console.error("Auth failed:", err);
        router.push("/login");
      }
    };

    checkAuthAndLoad();
  }, [router]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user?.avatar]);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleLogout = () => {
    api.logout();
    router.push("/");
  };

  const handleOpenProfile = () => {
    setActiveTab("profile");
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      showMsg("Vui lòng điền đầy đủ thông tin!", "error");
      return;
    }

    if (pwdForm.newPassword.length < 8) {
      showMsg("Mật khẩu mới phải có ít nhất 8 ký tự!", "error");
      return;
    }

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      showMsg("Xác nhận mật khẩu mới không khớp!", "error");
      return;
    }

    try {
      setPwdLoading(true);
      await api.put("/auth/change-password", {
        old_password: pwdForm.oldPassword,
        new_password: pwdForm.newPassword,
      });
      showMsg("✅ Đổi mật khẩu thành công!");
      setPwdForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setShowPwdModal(false);
    } catch (error) {
      const serverError = error?.response?.data?.detail || error?.message || "Mật khẩu cũ không đúng!";
      showMsg(`❌ ${serverError}`, "error");
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Đang tải trang điều khiển...</div>;
  }

  const displayName = user?.full_name || user?.username || "User";
  const profileTriggerStyle = {
    ...styles.profileTrigger,
    ...(isProfileHover ? styles.profileTriggerHover : {}),
  };

  return (
    <div style={styles.container}>
      <header style={styles.header} className="glass">
        <div style={styles.brand}>
          <span style={{ fontSize: "24px" }}>🏇</span>
          <span style={styles.brandText}>DASHBOARD</span>
        </div>

        <div style={styles.userProfile}>
          <button
            type="button"
            aria-label="Xem hồ sơ cá nhân"
            style={profileTriggerStyle}
            onClick={handleOpenProfile}
            onMouseEnter={() => setIsProfileHover(true)}
            onMouseLeave={() => setIsProfileHover(false)}
          >
            <span style={styles.avatarFrame}>
              {user?.avatar && !avatarLoadFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt=""
                  style={styles.avatarImage}
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                <span style={styles.avatarFallback}>{getInitials(displayName)}</span>
              )}
            </span>

            <span style={styles.userInfo}>
              <span style={styles.userName}>{displayName}</span>
              <span className="badge badge-info" style={{ fontSize: "10px" }}>{user?.role_name}</span>
            </span>
          </button>

          {user?.role_name === "SPECTATOR" && user?.spectator_profile && (
            <div style={styles.rewardPill}>
              <span style={{ fontSize: "14px" }}>🏆</span>
              <span style={styles.rewardPillText}>
                {user.spectator_profile.reward_points ?? 0} pts
              </span>
            </div>
          )}

          <button onClick={handleLogout} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "13px" }}>
            Đăng xuất
          </button>
        </div>
      </header>

      {message.text && (
        <div
          style={{
            ...styles.banner,
            backgroundColor: message.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
            borderColor: message.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)",
            color: message.type === "error" ? "var(--danger)" : "var(--success)",
          }}
        >
          {message.text}
        </div>
      )}

      <div style={styles.mainGrid}>
        <nav style={styles.sidebar} className="glass">
          {user?.role_name === "ADMIN" && (
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

          {user?.role_name === "OWNER" && (
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
              <button style={activeTab === "upcoming-races" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("upcoming-races")}>
                📅 Lịch thi đấu của Ngựa
              </button>
              <button style={activeTab === "results" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("results")}>
                🏆 Kết quả thi đấu
              </button>
              <button style={activeTab === "owner-awards" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("owner-awards")}>
                🏆 Cúp & Giải thưởng
              </button>
            </>
          )}

          {user?.role_name === "JOCKEY" && (
            <>
              <button style={activeTab === "invitations" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("invitations")}>
                ✉️ Lời mời Nhận được
              </button>
              <button style={activeTab === "jockey-races" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("jockey-races")}>
                🏁 Lịch trình Đua
              </button>
              <button style={activeTab === "jockey-rewards" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("jockey-rewards")}>
                🏆 Giải thưởng đạt được
              </button>
            </>
          )}

          {user?.role_name === "REFEREE" && (
            <>
              <button style={activeTab === "assigned-races" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("assigned-races")}>
                🏁 Trận đua phân công
              </button>
            </>
          )}

          {user?.role_name === "SPECTATOR" && (
            <>
              <button style={activeTab === "predictions" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("predictions")}>
                🔮 Dự đoán Trận đua
              </button>
              <button style={activeTab === "schedules" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("schedules")}>
                📅 Lịch & Kết quả
              </button>
            </>
          )}

          <div style={{ borderTop: "1px solid var(--card-border)", margin: "10px 0", paddingTop: "10px" }} />

          <button style={activeTab === "leaderboard" ? styles.activeTabBtn : styles.tabBtn} onClick={() => setActiveTab("leaderboard")}>
            ⭐ Bảng Xếp Hạng
          </button>
          <button
            style={{ ...styles.tabBtn, marginTop: "10px", color: "#fcd34d", border: "1px dashed rgba(252,211,77,0.3)" }}
            onClick={() => setShowPwdModal(true)}
          >
            🔐 Đổi mật khẩu
          </button>
        </nav>

        <main style={styles.workspace} className="glass">
          {activeTab === "leaderboard" ? (
            <Leaderboard />
          ) : (
            <>
              {user?.role_name === "ADMIN" && (
                activeTab === "profile" ? (
                  <AdminProfilePanel user={user} />
                ) : activeTab === "prizes" || activeTab === "awards" ? (
                  <PrizesPanel activeTab={activeTab} showMsg={showMsg} />
                ) : (
                  <AdminPanel user={user} activeTab={activeTab} showMsg={showMsg} />
                )
              )}
              {user?.role_name === "OWNER" && (
                <OwnerPanel user={user} activeTab={activeTab} showMsg={showMsg} onUserRefresh={refreshCurrentUser} />
              )}
              {user?.role_name === "JOCKEY" && (
                <JockeyPanel user={user} activeTab={activeTab} showMsg={showMsg} onUserRefresh={refreshCurrentUser} />
              )}
              {user?.role_name === "REFEREE" && (
                <RefereePanel user={user} activeTab={activeTab} showMsg={showMsg} onUserRefresh={refreshCurrentUser} />
              )}
              {user?.role_name === "SPECTATOR" && (
                <SpectatorPanel user={user} activeTab={activeTab} showMsg={showMsg} onUserRefresh={refreshCurrentUser} />
              )}
            </>
          )}
        </main>
      </div>

      {showPwdModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.8)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "400px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#fff" }}>🔐 Đổi mật khẩu cá nhân</h3>
            <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Mật khẩu hiện tại</label>
                <div style={{ position: "relative" }}>
                  <input type={showOldPwd ? "text" : "password"} style={{ width: "100%", padding: "10px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", boxSizing: "border-box" }} value={pwdForm.oldPassword} onChange={(e) => setPwdForm({ ...pwdForm, oldPassword: e.target.value })} />
                  <button type="button" onClick={() => setShowOldPwd(!showOldPwd)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>{showOldPwd ? "👁️" : "🙈"}</button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Mật khẩu mới</label>
                <div style={{ position: "relative" }}>
                  <input type={showNewPwd ? "text" : "password"} style={{ width: "100%", padding: "10px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", boxSizing: "border-box" }} value={pwdForm.newPassword} onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })} />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>{showNewPwd ? "👁️" : "🙈"}</button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Xác nhận mật khẩu mới</label>
                <input type="password" style={{ width: "100%", padding: "10px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", boxSizing: "border-box" }} value={pwdForm.confirmPassword} onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} />
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
