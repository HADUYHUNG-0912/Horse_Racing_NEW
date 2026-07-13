"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../api";
import { styles } from "./components/styles";
import dashboardStyles from "./dashboard.module.css";
import AdminPanel from "./components/AdminPanel";
import OwnerPanel from "./components/OwnerPanel";
import JockeyPanel from "./components/JockeyPanel";
import RefereePanel from "./components/RefereePanel";
import SpectatorPanel from "./components/SpectatorPanel";
import Leaderboard from "./components/Leaderboard";
import PrizesPanel from "./components/PrizesPanel";
import {
  DashboardIcon,
  TrophyIcon,
  ListIcon,
  FlagIcon,
  StarIcon,
  AwardIcon,
  UsersIcon,
  LockIcon,
  LogoutIcon,
  UserIcon,
  MenuIcon,
  CloseIcon,
  KeyIcon,
  HorseIcon,
  MailIcon,
  CalendarIcon
} from "./components/Icons";

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
    <div className={dashboardStyles.tabContent}>
      <h2 className={dashboardStyles.heading}>👤 Hồ sơ cá nhân Quản trị viên</h2>
      <div className={dashboardStyles.splitLayout}>
        <section className={dashboardStyles.adminProfileHero}>
          <div className={dashboardStyles.adminProfileAvatar}>
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" className={dashboardStyles.adminProfileAvatarImage} />
            ) : (
              <span className={dashboardStyles.adminProfileAvatarFallback}>{getInitials(displayName)}</span>
            )}
          </div>
          <strong style={{ fontSize: "20px" }}>{displayName}</strong>
          <span className={`${dashboardStyles.badge} ${dashboardStyles.badgeInfo}`}>{user?.role_name || "ADMIN"}</span>
        </section>

        <section className={dashboardStyles.formPanel}>
          <h3 className={dashboardStyles.subHeading}>Thông tin tài khoản hiện tại</h3>
          <div className={dashboardStyles.infoList}>
            <div className={dashboardStyles.infoListItem}>
              <label>Username</label>
              <span>{user?.username || "—"}</span>
            </div>
            <div className={dashboardStyles.infoListItem}>
              <label>Họ tên</label>
              <span>{displayName}</span>
            </div>
            <div className={dashboardStyles.infoListItem}>
              <label>Email</label>
              <span>{user?.email || "—"}</span>
            </div>
            <div className={dashboardStyles.infoListItem}>
              <label>Số điện thoại</label>
              <span>{user?.phone_number || "Chưa có"}</span>
            </div>
            <div className={dashboardStyles.infoListItem}>
              <label>Vai trò</label>
              <span>{user?.role_name || "ADMIN"}</span>
            </div>
            <div className={dashboardStyles.infoListItem}>
              <label>Ngày tạo</label>
              <span>{formatShortDate(user?.created_at)}</span>
            </div>
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminProfileMenuOpen, setIsAdminProfileMenuOpen] = useState(false);
  const [adminPeriod, setAdminPeriod] = useState("month");
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
        setIsSidebarOpen(window.matchMedia("(min-width: 1025px)").matches);
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
    return <div className={dashboardStyles.loading}>Đang tải trang điều khiển...</div>;
  }

  const displayName = user?.full_name || user?.username || "User";
  const isAdmin = user?.role_name === "ADMIN";

  return (
    <div className={`${dashboardStyles.container} ${isAdmin ? dashboardStyles.adminContainer : ""}`}>
      {isSidebarOpen && (
        <div
          className={dashboardStyles.sidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <header className={`${dashboardStyles.header} ${isAdmin ? dashboardStyles.adminHeader : ""}`}>
        <div className={dashboardStyles.brand}>
          <button
            type="button"
            className={dashboardStyles.menuToggle}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle sidebar"
            aria-expanded={isSidebarOpen}
            aria-controls="dashboard-sidebar"
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {isSidebarOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
          </button>
          <FlagIcon size={24} style={{ color: isAdmin ? "var(--color-forest)" : "var(--color-cream)" }} />
          <span className={`${dashboardStyles.brandText} ${isAdmin ? dashboardStyles.adminBrandText : ""}`}>
            {isAdmin ? "Dashboard" : "DASHBOARD"}
          </span>
        </div>

        <div className={dashboardStyles.userProfile}>
          {isAdmin ? (
            <label className={dashboardStyles.adminPeriodSelect}>
              <CalendarIcon size={17} />
              <select value={adminPeriod} onChange={(event) => setAdminPeriod(event.target.value)} aria-label="Chọn khoảng thời gian thống kê">
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="quarter">Quý này</option>
                <option value="year">Năm nay</option>
              </select>
            </label>
          ) : (
            <>
              <button
                type="button"
                aria-label="Xem hồ sơ cá nhân"
                className={dashboardStyles.profileTrigger}
                onClick={handleOpenProfile}
                style={{ display: "flex", alignItems: "center" }}
              >
                <span className={dashboardStyles.avatarFrame}>
                  {user?.avatar && !avatarLoadFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar}
                      alt=""
                      className={dashboardStyles.avatarImage}
                      onError={() => setAvatarLoadFailed(true)}
                    />
                  ) : (
                    <span className={dashboardStyles.avatarFallback}>{getInitials(displayName)}</span>
                  )}
                </span>

                <span className={dashboardStyles.userInfo}>
                  <span className={dashboardStyles.userName}>{displayName}</span>
                  <span className={dashboardStyles.roleBadge}>{user?.role_name}</span>
                </span>
              </button>

              {user?.role_name === "SPECTATOR" && user?.spectator_profile && (
                <div className={dashboardStyles.rewardPill}>
                  <TrophyIcon size={14} style={{ marginRight: "4px" }} />
                  <span className={dashboardStyles.rewardPillText}>
                    {user.spectator_profile.reward_points ?? 0} pts
                  </span>
                </div>
              )}

              <button onClick={handleLogout} className={dashboardStyles.logoutBtn} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <LogoutIcon size={16} /> Đăng xuất
              </button>
            </>
          )}
        </div>
      </header>

      {message.text && (
        <div
          className={`${dashboardStyles.banner} ${
            message.type === "error" ? dashboardStyles.bannerError : dashboardStyles.bannerSuccess
          }`}
        >
          {message.text}
        </div>
      )}

      <div className={`${dashboardStyles.mainGrid} ${isSidebarOpen ? dashboardStyles.mainGridSidebarOpen : ""}`}>
        <nav
          id="dashboard-sidebar"
          className={`${dashboardStyles.sidebar} ${isAdmin ? dashboardStyles.adminSidebar : ""} ${isSidebarOpen ? dashboardStyles.sidebarActive : ""}`}
          aria-label="Điều hướng Dashboard"
        >
          {user?.role_name === "ADMIN" && (
            <>
              <button className={activeTab === "overview" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("overview"); setIsSidebarOpen(false); }}>
                <DashboardIcon size={18} style={{ marginRight: "10px" }} /> Tổng quan hệ thống
              </button>
              <button className={activeTab === "tournaments" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("tournaments"); setIsSidebarOpen(false); }}>
                <TrophyIcon size={18} style={{ marginRight: "10px" }} /> Quản lý Giải đấu
              </button>
              <button className={activeTab === "registrations" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("registrations"); setIsSidebarOpen(false); }}>
                <ListIcon size={18} style={{ marginRight: "10px" }} /> Xét duyệt Đăng ký
              </button>
              <button className={activeTab === "races" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("races"); setIsSidebarOpen(false); }}>
                <FlagIcon size={18} style={{ marginRight: "10px" }} /> Lập lịch Trận đua
              </button>
              <button className={activeTab === "users" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("users"); setIsSidebarOpen(false); }}>
                <UsersIcon size={18} style={{ marginRight: "10px" }} /> Quản lý Người dùng
              </button>
              <button className={activeTab === "prizes" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("prizes"); setIsSidebarOpen(false); }}>
                <AwardIcon size={18} style={{ marginRight: "10px" }} /> Quản lý Giải thưởng
              </button>
              <button className={activeTab === "awards" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("awards"); setIsSidebarOpen(false); }}>
                <TrophyIcon size={18} style={{ marginRight: "10px" }} /> Xem Awards
              </button>
            </>
          )}

          {user?.role_name === "OWNER" && (
            <>
              <button className={activeTab === "my-horses" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("my-horses"); setIsSidebarOpen(false); }}>
                <HorseIcon size={18} style={{ marginRight: "10px" }} /> Quản lý Ngựa
              </button>
              <button className={activeTab === "invite-jockey" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("invite-jockey"); setIsSidebarOpen(false); }}>
                <MailIcon size={18} style={{ marginRight: "10px" }} /> Mời Jockey
              </button>
              <button className={activeTab === "register-tournament" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("register-tournament"); setIsSidebarOpen(false); }}>
                <TrophyIcon size={18} style={{ marginRight: "10px" }} /> Đăng ký Giải đấu
              </button>
              <button className={activeTab === "my-registrations" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("my-registrations"); setIsSidebarOpen(false); }}>
                <ListIcon size={18} style={{ marginRight: "10px" }} /> Giải đấu đã đăng ký
              </button>
              <button className={activeTab === "upcoming-races" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("upcoming-races"); setIsSidebarOpen(false); }}>
                <CalendarIcon size={18} style={{ marginRight: "10px" }} /> Lịch thi đấu của Ngựa
              </button>
              <button className={activeTab === "results" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("results"); setIsSidebarOpen(false); }}>
                <TrophyIcon size={18} style={{ marginRight: "10px" }} /> Kết quả thi đấu
              </button>
              <button className={activeTab === "owner-awards" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("owner-awards"); setIsSidebarOpen(false); }}>
                <AwardIcon size={18} style={{ marginRight: "10px" }} /> Cúp & Giải thưởng
              </button>
            </>
          )}

          {user?.role_name === "JOCKEY" && (
            <>
              <button className={activeTab === "invitations" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("invitations"); setIsSidebarOpen(false); }}>
                <MailIcon size={18} style={{ marginRight: "10px" }} /> Lời mời Nhận được
              </button>
              <button className={activeTab === "jockey-races" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("jockey-races"); setIsSidebarOpen(false); }}>
                <FlagIcon size={18} style={{ marginRight: "10px" }} /> Lịch trình Đua
              </button>
              <button className={activeTab === "jockey-rewards" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("jockey-rewards"); setIsSidebarOpen(false); }}>
                <AwardIcon size={18} style={{ marginRight: "10px" }} /> Giải thưởng đạt được
              </button>
            </>
          )}

          {user?.role_name === "REFEREE" && (
            <>
              <button className={activeTab === "assigned-races" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("assigned-races"); setIsSidebarOpen(false); }}>
                <FlagIcon size={18} style={{ marginRight: "10px" }} /> Trận đua phân công
              </button>
            </>
          )}

          {user?.role_name === "SPECTATOR" && (
            <>
              <button className={activeTab === "predictions" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("predictions"); setIsSidebarOpen(false); }}>
                <StarIcon size={18} style={{ marginRight: "10px" }} /> Dự đoán Trận đua
              </button>
              <button className={activeTab === "schedules" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("schedules"); setIsSidebarOpen(false); }}>
                <CalendarIcon size={18} style={{ marginRight: "10px" }} /> Lịch & Kết quả
              </button>
            </>
          )}

          <div style={{ borderTop: "1px solid var(--color-border)", margin: "10px 0", paddingTop: "10px" }} />

          <button className={activeTab === "leaderboard" ? dashboardStyles.activeTabBtn : dashboardStyles.tabBtn} onClick={() => { setActiveTab("leaderboard"); setIsSidebarOpen(false); }}>
            <StarIcon size={18} style={{ marginRight: "10px" }} /> Bảng Xếp Hạng
          </button>
          <button
            className={`${dashboardStyles.tabBtn} ${dashboardStyles.sidebarPasswordBtn}`}
            onClick={() => { setShowPwdModal(true); setIsSidebarOpen(false); }}
          >
            <KeyIcon size={16} style={{ marginRight: "8px" }} /> Đổi mật khẩu
          </button>

          {isAdmin && (
            <div className={`${dashboardStyles.adminSidebarProfile} ${isAdminProfileMenuOpen ? dashboardStyles.adminSidebarProfileOpen : ""}`}>
              {isAdminProfileMenuOpen && (
                <div className={dashboardStyles.adminProfileMenu}>
                  <button type="button" onClick={() => { handleOpenProfile(); setIsAdminProfileMenuOpen(false); }}>
                    <UserIcon size={15} /> Hồ sơ cá nhân
                  </button>
                  <button type="button" onClick={handleLogout}>
                    <LogoutIcon size={15} /> Đăng xuất
                  </button>
                </div>
              )}
              <button
                type="button"
                className={dashboardStyles.adminProfileToggle}
                onClick={() => setIsAdminProfileMenuOpen((isOpen) => !isOpen)}
                aria-expanded={isAdminProfileMenuOpen}
              >
                <span className={dashboardStyles.adminSidebarProfileAvatar}>
                  {user?.avatar && !avatarLoadFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt="" onError={() => setAvatarLoadFailed(true)} />
                  ) : (
                    getInitials(displayName)
                  )}
                </span>
                <span className={dashboardStyles.adminProfileIdentity}>
                  <strong>{displayName}</strong>
                  <small>Quản trị viên</small>
                </span>
                <span className={`${dashboardStyles.adminProfileChevron} ${isAdminProfileMenuOpen ? dashboardStyles.adminProfileChevronOpen : ""}`}>⌄</span>
              </button>
            </div>
          )}
        </nav>

        <main className={`${dashboardStyles.workspace} ${isAdmin && activeTab === "overview" ? dashboardStyles.adminOverviewWorkspace : ""}`}>
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
        <div className={dashboardStyles.modalBackdrop}>
          <div className={dashboardStyles.modalContent}>
            <h3 className={dashboardStyles.modalTitle}>
              <KeyIcon size={20} style={{ marginRight: "8px", verticalAlign: "middle" }} /> Đổi mật khẩu cá nhân
            </h3>
            <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className={dashboardStyles.formGroup} style={{ marginBottom: "8px" }}>
                <label>Mật khẩu hiện tại</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showOldPwd ? "text" : "password"}
                    className={dashboardStyles.inputField}
                    value={pwdForm.oldPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, oldPassword: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowOldPwd(!showOldPwd)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>{showOldPwd ? "👁️" : "🙈"}</button>
                </div>
              </div>
              <div className={dashboardStyles.formGroup} style={{ marginBottom: "8px" }}>
                <label>Mật khẩu mới</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNewPwd ? "text" : "password"}
                    className={dashboardStyles.inputField}
                    value={pwdForm.newPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>{showNewPwd ? "👁️" : "🙈"}</button>
                </div>
              </div>
              <div className={dashboardStyles.formGroup} style={{ marginBottom: "12px" }}>
                <label>Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  className={dashboardStyles.inputField}
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button type="submit" className={dashboardStyles.btnPrimary} style={{ flex: 1 }} disabled={pwdLoading}>
                  {pwdLoading ? "🔄 Đang lưu..." : "Cập nhật"}
                </button>
                <button
                  type="button"
                  className={dashboardStyles.btnSecondary}
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowPwdModal(false);
                    setPwdForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
                  }}
                >
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
