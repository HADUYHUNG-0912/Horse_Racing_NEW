"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../../api";
import dashboardStyles from "../dashboard.module.css";
import {
  HorseIcon,
  MailIcon,
  TrophyIcon,
  ListIcon,
  CalendarIcon,
  AwardIcon,
  UserIcon,
  TrashIcon,
  EditIcon,
  PlusIcon,
  ResultIcon,
} from "./Icons";

const emptyOwnerProfileForm = {
  full_name: "",
  email: "",
  phone_number: "",
  company_name: "",
  avatar: "",
  age: "",
  experience_years: "",
  occupation: "",
  address: "",
  nationality: "",
  social_link: "",
  bio: ""
};

export default function OwnerPanel({ user, activeTab, showMsg, onUserRefresh }) {
  const [horses, setHorses] = useState([]);
  const [jockeys, setJockeys] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [upcomingRaces, setUpcomingRaces] = useState([]);
  const [resultHistory, setResultHistory] = useState([]);
  const [awards, setAwards] = useState([]);
  const [awardsLoading, setAwardsLoading] = useState(false);
  const [awardsError, setAwardsError] = useState("");
  const [awardsRequestVersion, setAwardsRequestVersion] = useState(0);
  const [profileForm, setProfileForm] = useState(emptyOwnerProfileForm);
  const [loading, setLoading] = useState(true);
  const awardsRequestedRef = useRef(false);

  // Form states
  const [newHorse, setNewHorse] = useState({ name: "", age: "", breed: "", gender: "Stallion" });
  const [newInvitation, setNewInvitation] = useState({ jockey_id: "", horse_id: "", tournament_id: "", message: "" });
  const [editingHorse, setEditingHorse] = useState(null);
  const [editHorseForm, setEditHorseForm] = useState({ name: "", age: "", breed: "", gender: "Stallion" });

  const asArray = (data) => Array.isArray(data) ? data : data?.items || data?.data || [];
  const getOwnerProfileForm = (profile) => ({
    full_name: profile?.full_name || "",
    email: profile?.email || "",
    phone_number: profile?.phone_number || "",
    company_name: profile?.company_name || "",
    avatar: profile?.avatar || "",
    age: profile?.age != null ? String(profile.age) : "",
    experience_years: profile?.experience_years != null ? String(profile.experience_years) : "",
    occupation: profile?.occupation || "",
    address: profile?.address || "",
    nationality: profile?.nationality || "",
    social_link: profile?.social_link || "",
    bio: profile?.bio || ""
  });
  const getJockeyLabel = (jockey) => {
    const name = jockey.full_name || jockey.username || `Jockey #${jockey.id}`;
    const experience = Number.isFinite(Number(jockey.experience_years))
      ? ` - Kinh nghiệm: ${jockey.experience_years} năm`
      : "";
    return `${name}${experience}`;
  };

  const loadData = async () => {
    try {
      const myHorses = await api.get("/horses");
      setHorses(asArray(myHorses));

      const listJockeys = await api.get("/jockeys");
      setJockeys(asArray(listJockeys));

      const invites = await api.get("/jockeys/invitations");
      setInvitations(asArray(invites));

      const tours = await api.get("/tournaments");
      setTournaments(asArray(tours));

      const ownerProfileData = await api.get("/owners/profile");
      setOwnerProfile(ownerProfileData);
      setProfileForm(getOwnerProfileForm(ownerProfileData));

      const races = await api.get("/owners/upcoming-races");
      setUpcomingRaces(Array.isArray(races) ? races : []);

      const results = await api.get("/owners/results");
      setResultHistory(Array.isArray(results) ? results : []);

      // Fetch registrations for each tournament (Task 3 - Thuỳ Anh)
      const allRegistrations = [];
      for (const tournament of asArray(tours)) {
        try {
          const tournamentRegs = await api.get(`/tournaments/${tournament.id}/registrations`);
          const regsArray = Array.isArray(tournamentRegs) ? tournamentRegs : tournamentRegs?.items || tournamentRegs?.data || [];
          regsArray.forEach(reg => {
            allRegistrations.push({ ...reg, tournament_name: tournament.name });
          });
        } catch (e) {
          console.error("Không tải được danh sách đăng ký của giải", tournament.id, e);
        }
      }
      setRegistrations(allRegistrations);
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab !== "owner-awards" || awardsRequestedRef.current) return;

    awardsRequestedRef.current = true;
    const loadAwards = async () => {
      setAwardsLoading(true);
      setAwardsError("");
      try {
        const data = await api.get("/owners/awards");
        setAwards(Array.isArray(data) ? data : []);
      } catch (err) {
        const message = err?.message || "Không thể tải danh sách giải thưởng.";
        setAwards([]);
        setAwardsError(message);
        showMsg(message, "error");
      } finally {
        setAwardsLoading(false);
      }
    };

    loadAwards();
  }, [activeTab, awardsRequestVersion, showMsg]);

  const retryAwards = () => {
    awardsRequestedRef.current = false;
    setAwardsRequestVersion((version) => version + 1);
  };

  const saveOwnerProfile = async (e) => {
    e.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = profileForm.email.trim();
    const trimmedSocialLink = profileForm.social_link.trim();
    const age = profileForm.age === "" ? null : Number(profileForm.age);
    const experienceYears = profileForm.experience_years === "" ? null : Number(profileForm.experience_years);

    if (!emailPattern.test(trimmedEmail)) {
      showMsg("Email khong dung dinh dang!", "error");
      return;
    }
    if (age !== null && (!Number.isInteger(age) || age < 18 || age > 100)) {
      showMsg("Tuoi Owner phai la so nguyen tu 18 den 100!", "error");
      return;
    }
    if (experienceYears !== null && (!Number.isInteger(experienceYears) || experienceYears < 0)) {
      showMsg("Kinh nghiem phai la so nguyen khong am!", "error");
      return;
    }
    if (trimmedSocialLink && !/^https?:\/\/.+\..+/.test(trimmedSocialLink)) {
      showMsg("Website / mang xa hoi phai la URL bat dau bang http:// hoac https://", "error");
      return;
    }
    if (profileForm.bio.length > 300) {
      showMsg("Mo ta ngan khong duoc vuot qua 300 ky tu!", "error");
      return;
    }

    try {
      const updatedProfile = await api.put("/owners/profile", {
        full_name: profileForm.full_name.trim(),
        email: trimmedEmail,
        phone_number: profileForm.phone_number.trim() || null,
        company_name: profileForm.company_name.trim() || null,
        avatar: profileForm.avatar.trim() || null,
        age,
        experience_years: experienceYears,
        occupation: profileForm.occupation.trim() || null,
        address: profileForm.address.trim() || null,
        nationality: profileForm.nationality.trim() || null,
        social_link: trimmedSocialLink || null,
        bio: profileForm.bio.trim() || null
      });
      setOwnerProfile(updatedProfile);
      setProfileForm(getOwnerProfileForm(updatedProfile));
      await onUserRefresh?.(user?.id);
      showMsg("Cập nhật hồ sơ chủ sở hữu thành công!");
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const createHorse = async (e) => {
    e.preventDefault();
    if (parseInt(newHorse.age) < 2 || parseInt(newHorse.age) > 10) {
      showMsg("Tuổi ngựa phải từ 2 đến 10 năm!", "error");
      return;
    }
    try {
      await api.post("/horses/", {
        ...newHorse,
        age: parseInt(newHorse.age)
      });
      showMsg("Thêm ngựa thành công!");
      setNewHorse({ name: "", age: "", breed: "", gender: "Stallion" });
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const updateHorse = async (e) => {
    e.preventDefault();
    if (parseInt(editHorseForm.age) < 2 || parseInt(editHorseForm.age) > 10) {
      showMsg("Tuổi ngựa phải từ 2 đến 10 năm!", "error");
      return;
    }
    try {
      await api.put(`/horses/${editingHorse.id}`, {
        name: editHorseForm.name,
        age: parseInt(editHorseForm.age),
        breed: editHorseForm.breed,
        gender: editHorseForm.gender
      });
      showMsg("Cập nhật ngựa thành công!");
      setEditingHorse(null);
      setEditHorseForm({ name: "", age: "", breed: "", gender: "Stallion" });
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const deleteHorse = async (horseId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ngựa này?")) {
      return;
    }
    try {
      await api.delete(`/horses/${horseId}`);
      showMsg("Xóa ngựa thành công!");
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const startEditHorse = (horse) => {
    setEditingHorse(horse);
    setEditHorseForm({
      name: horse.name,
      age: horse.age.toString(),
      breed: horse.breed,
      gender: horse.gender
    });
  };

  const cancelEdit = () => {
    setEditingHorse(null);
    setEditHorseForm({ name: "", age: "", breed: "", gender: "Stallion" });
  };

  const sendJockeyInvitation = async (e) => {
    e.preventDefault();
    try {
      await api.post("/jockeys/invite", {
        jockey_id: parseInt(newInvitation.jockey_id),
        horse_id: parseInt(newInvitation.horse_id),
        tournament_id: parseInt(newInvitation.tournament_id),
        message: newInvitation.message
      });
      showMsg("Đã gửi lời mời tới Jockey!");
      setNewInvitation({ jockey_id: "", horse_id: "", tournament_id: "", message: "" });
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const registerForTournament = async (tournamentId, horseId, jockeyId) => {
    try {
      await api.post(`/tournaments/${tournamentId}/register`, {
        tournament_id: tournamentId,
        horse_id: horseId,
        jockey_id: jockeyId
      });
      showMsg("Đã gửi đơn đăng ký tham gia giải đấu!");
      loadData();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const formatAwardRank = (rank) => {
    const numericRank = Number(rank);
    if (!Number.isFinite(numericRank)) return "Chưa cập nhật hạng";
    if (numericRank === 1) return "🥇 Hạng 1";
    if (numericRank === 2) return "🥈 Hạng 2";
    if (numericRank === 3) return "🥉 Hạng 3";
    return `Hạng ${numericRank}`;
  };

  const formatPrizeValue = (prizeValue) => {
    if (prizeValue === null || prizeValue === undefined || prizeValue === "") {
      return "Chưa cập nhật";
    }
    const numericValue = Number(prizeValue);
    return Number.isFinite(numericValue)
      ? numericValue.toLocaleString("vi-VN")
      : "Chưa cập nhật";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", color: "var(--color-burgundy)", fontWeight: "600" }}>
        Đang tải dữ liệu Owner...
      </div>
    );
  }

  // eslint-disable-next-line no-unused-vars
  const horseMap = new Map(horses.map(h => [h.id, h.name]));
  // eslint-disable-next-line no-unused-vars
  const jockeyMap = new Map(jockeys.map(j => [j.id, j.full_name || j.username]));
  // eslint-disable-next-line no-unused-vars
  const tournamentMap = new Map(tournaments.map(t => [t.id, t.name]));
  const BREEDS = ["Thoroughbred","Arabian","Quarter Horse","Appaloosa","Morgan","Standardbred","Warmblood","Paint Horse"];

  return (
    <>
      {/* TAB: Quản lý Ngựa (Owner) */}
      {activeTab === "my-horses" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HorseIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Quản lý danh sách ngựa đua của bạn
          </h2>
          <div className={dashboardStyles.splitLayout}>
            {/* Edit or Create Horse */}
            <form onSubmit={editingHorse ? updateHorse : createHorse} className={dashboardStyles.formPanel}>
              <h3 className={dashboardStyles.subHeading} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {editingHorse ? <><EditIcon size={18} /> Chỉnh sửa Ngựa</> : <><PlusIcon size={18} /> Đăng Ký Ngựa Mới</>}
              </h3>
              <div className={dashboardStyles.formGroup}>
                <label>Tên ngựa đua</label>
                <input type="text" className={dashboardStyles.inputField} placeholder="Ví dụ: Thunderbolt II" required
                  value={editingHorse ? editHorseForm.name : newHorse.name}
                  onChange={(e) => editingHorse ? setEditHorseForm({ ...editHorseForm, name: e.target.value }) : setNewHorse({ ...newHorse, name: e.target.value })} />
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Tuổi (2-10 năm)</label>
                <input type="number" className={dashboardStyles.inputField} placeholder="Ví dụ: 4" required min="2" max="10"
                  value={editingHorse ? editHorseForm.age : newHorse.age}
                  onChange={(e) => editingHorse ? setEditHorseForm({ ...editHorseForm, age: e.target.value }) : setNewHorse({ ...newHorse, age: e.target.value })} />
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Giống ngựa</label>
                <select className={dashboardStyles.inputField} required
                  value={editingHorse ? editHorseForm.breed : newHorse.breed}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingHorse) { setEditHorseForm({ ...editHorseForm, breed: val }); }
                    else { setNewHorse({ ...newHorse, breed: val }); }
                  }}>
                  <option value="">-- Chọn giống ngựa --</option>
                  {BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                  <option value="__other__">Khác</option>
                </select>
                {(editingHorse ? editHorseForm.breed !== "" && !BREEDS.includes(editHorseForm.breed) : newHorse.breed !== "" && !BREEDS.includes(newHorse.breed)) && (
                  <>
                    <input type="text" className={dashboardStyles.inputField} placeholder="Nhập giống ngựa khác..." style={{ marginTop: "8px" }} required
                      value={editingHorse ? (editHorseForm.breed === "__other__" ? "" : editHorseForm.breed) : (newHorse.breed === "__other__" ? "" : newHorse.breed)}
                      onChange={(e) => editingHorse ? setEditHorseForm({ ...editHorseForm, breed: e.target.value }) : setNewHorse({ ...newHorse, breed: e.target.value })} />
                    <p style={{ color: "#d97706", fontSize: "12px", marginTop: "4px" }}>Giống ngựa này chưa có trong hệ thống, vui lòng kiểm tra lại.</p>
                  </>
                )}
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Giới tính</label>
                <select className={dashboardStyles.inputField}
                  value={editingHorse ? editHorseForm.gender : newHorse.gender}
                  onChange={(e) => editingHorse ? setEditHorseForm({ ...editHorseForm, gender: e.target.value }) : setNewHorse({ ...newHorse, gender: e.target.value })}>
                  <option value="Stallion">Stallion (Ngựa đực)</option>
                  <option value="Mare">Mare (Ngựa cái)</option>
                  <option value="Gelding">Gelding (Ngựa thiến)</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" className={dashboardStyles.btnPrimary} style={{ flex: 1 }}>
                  {editingHorse ? "Lưu Thay đổi" : "Đăng ký Ngựa"}
                </button>
                {editingHorse && (
                  <button type="button" className={dashboardStyles.btnSecondary} style={{ flex: 1 }} onClick={cancelEdit}>Hủy</button>
                )}
              </div>
            </form>

            {/* Horse List */}
            <div style={{ flex: 1.5 }}>
              <h3 className={dashboardStyles.subHeading}>Ngựa đua đã sở hữu</h3>
              <div className={dashboardStyles.tableWrapper}>
                <table className={dashboardStyles.table}>
                  <thead>
                    <tr>
                      <th className={dashboardStyles.th}>Tên ngựa</th>
                      <th className={dashboardStyles.th}>Tuổi</th>
                      <th className={dashboardStyles.th}>Giống</th>
                      <th className={dashboardStyles.th}>Giới tính</th>
                      <th className={dashboardStyles.th}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horses.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "24px" }} className={dashboardStyles.td}>Chưa có ngựa đua nào được đăng ký</td></tr>
                    ) : (
                      horses.map(h => (
                        <tr key={h.id} className={dashboardStyles.rowHover}>
                          <td style={{ fontWeight: "700" }} className={dashboardStyles.td}>{h.name}</td>
                          <td className={dashboardStyles.td}>{h.age} tuổi</td>
                          <td className={dashboardStyles.td}>{h.breed}</td>
                          <td className={dashboardStyles.td}>{h.gender}</td>
                          <td className={dashboardStyles.td}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button className={dashboardStyles.btnPrimary} style={{ padding: "4px 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }} onClick={() => startEditHorse(h)}>
                                <EditIcon size={12} /> Sửa
                              </button>
                              <button className={dashboardStyles.btnSecondary} style={{ padding: "4px 10px", fontSize: "12px", color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)", display: "inline-flex", alignItems: "center", gap: "4px" }} onClick={() => deleteHorse(h.id)}>
                                <TrashIcon size={12} /> Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Mời Jockey (Owner) */}
      {activeTab === "invite-jockey" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MailIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Mời Jockey lái ngựa thi đấu
          </h2>
          <div className={dashboardStyles.splitLayout}>
            {/* Send invitation */}
            <form onSubmit={sendJockeyInvitation} className={dashboardStyles.formPanel}>
              <h3 className={dashboardStyles.subHeading} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <PlusIcon size={18} /> Gửi Lời Mời Mới
              </h3>
              <div className={dashboardStyles.formGroup}>
                <label>Chọn Jockey</label>
                <select className={dashboardStyles.inputField} required
                  value={newInvitation.jockey_id} onChange={(e) => setNewInvitation({ ...newInvitation, jockey_id: e.target.value })}>
                  <option value="">-- Chọn Jockey --</option>
                  {jockeys.length === 0 && (
                    <option value="" disabled>Chưa có Jockey nào trong hệ thống</option>
                  )}
                  {jockeys.map(j => (
                    <option key={j.id} value={j.id}>{getJockeyLabel(j)}</option>
                  ))}
                </select>
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Chọn Ngựa đua</label>
                <select className={dashboardStyles.inputField} required
                  value={newInvitation.horse_id} onChange={(e) => setNewInvitation({ ...newInvitation, horse_id: e.target.value })}>
                  <option value="">-- Chọn Ngựa --</option>
                  {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Chọn Giải đấu</label>
                <select className={dashboardStyles.inputField} required
                  value={newInvitation.tournament_id} onChange={(e) => setNewInvitation({ ...newInvitation, tournament_id: e.target.value })}>
                  <option value="">-- Chọn Giải đấu --</option>
                  {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Tin nhắn gửi kèm</label>
                <textarea className={dashboardStyles.inputField} placeholder="Mời tham gia giải đua..."
                  value={newInvitation.message} onChange={(e) => setNewInvitation({ ...newInvitation, message: e.target.value })} />
              </div>
              <button type="submit" className={dashboardStyles.btnPrimary}>Gửi Lời Mời</button>
            </form>

            {/* Invitation lists sent */}
            <div style={{ flex: 1.2 }}>
              <h3 className={dashboardStyles.subHeading}>Trạng thái lời mời đã gửi</h3>
              <div className={dashboardStyles.tableWrapper}>
                <table className={dashboardStyles.table}>
                  <thead>
                    <tr>
                      <th className={dashboardStyles.th}>Jockey</th>
                      <th className={dashboardStyles.th}>Ngựa</th>
                      <th className={dashboardStyles.th}>Giải đấu</th>
                      <th className={dashboardStyles.th}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "24px" }} className={dashboardStyles.td}>Chưa gửi lời mời nào</td></tr>
                    ) : (
                      invitations.map(i => (
                        <tr key={i.id} className={dashboardStyles.rowHover}>
                          <td className={dashboardStyles.td}>{i.jockey_name || `Jockey #${i.jockey_id}`}</td>
                          <td style={{ fontWeight: "700" }} className={dashboardStyles.td}>{i.horse_name || `Ngựa #${i.horse_id}`}</td>
                          <td className={dashboardStyles.td}>{i.tournament_name || `Giải đấu #${i.tournament_id}`}</td>
                          <td className={dashboardStyles.td}>
                            <span className={`${dashboardStyles.badge} ${i.status === "ACCEPTED" ? dashboardStyles.badgeApproved : i.status === "PENDING" ? dashboardStyles.badgePending : dashboardStyles.badgeRejected}`}>
                              {i.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Đăng ký Giải đấu (Owner) */}
      {activeTab === "register-tournament" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <TrophyIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Đăng ký Ngựa và Jockey tham gia Giải đấu
          </h2>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "16px", fontSize: "14px" }}>Chỉ đăng ký được các giải đấu sắp diễn ra bằng cách sử dụng các Jockey đã CHẤP NHẬN lời mời lái ngựa của bạn.</p>
          <div className={dashboardStyles.tableWrapper}>
            <table className={dashboardStyles.table}>
              <thead>
                <tr>
                  <th className={dashboardStyles.th}>Tên giải đấu</th>
                  <th className={dashboardStyles.th}>Địa điểm</th>
                  <th className={dashboardStyles.th}>Thời gian</th>
                  <th className={dashboardStyles.th}>Cặp đăng ký khả dụng</th>
                  <th className={dashboardStyles.th}>Đăng ký thi đấu</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "24px" }} className={dashboardStyles.td}>Không tìm thấy giải đấu nào</td></tr>
                ) : (
                  tournaments.map(t => {
                    const acceptedInvites = invitations.filter(i => i.tournament_id === t.id && i.status === "ACCEPTED");
                    return (
                      <tr key={t.id} className={dashboardStyles.rowHover}>
                        <td style={{ fontWeight: "700" }} className={dashboardStyles.td}>{t.name}</td>
                        <td className={dashboardStyles.td}>{t.location}</td>
                        <td className={dashboardStyles.td}>{formatDate(t.start_date)} đến {formatDate(t.end_date)}</td>
                        <td className={dashboardStyles.td}>
                          {acceptedInvites.length === 0 ? (
                            <span style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>Cần mời và được Jockey đồng ý trước</span>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {acceptedInvites.map(inv => (
                                <div key={inv.id} style={{ fontSize: "13px" }}>
                                  {inv.horse_name || `Ngựa #${inv.horse_id}`} & {inv.jockey_name || `Jockey #${inv.jockey_id}`}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className={dashboardStyles.td}>
                          {acceptedInvites.map(inv => {
                            const isRegistered = registrations.some(reg => reg.tournament_id === t.id && reg.horse_id === inv.horse_id);
                            return isRegistered ? (
                              <span key={inv.id} className={`${dashboardStyles.badge} ${dashboardStyles.badgeApproved}`} style={{ display: "block", marginBottom: "4px", padding: "6px 12px", textAlign: "center", fontSize: "12px" }}>
                                Đã đăng ký
                              </span>
                            ) : (
                              <button key={inv.id} className={dashboardStyles.btnPrimary}
                                style={{ padding: "6px 12px", fontSize: "12px", marginBottom: "4px", display: "block", width: "100%" }}
                                onClick={() => registerForTournament(t.id, inv.horse_id, inv.jockey_id)}>
                                Đăng ký: {inv.horse_name || `#${inv.horse_id}`}
                              </button>
                            );
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Danh sách giải đấu đã đăng ký (Owner) */}
      {activeTab === "my-registrations" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ListIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Danh sách giải đấu đã đăng ký
          </h2>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "16px", fontSize: "14px" }}>Xem trạng thái duyệt hồ sơ đăng ký của bạn từ Admin (PENDING: Chờ duyệt, APPROVED: Đã chấp nhận, REJECTED: Bị từ chối)</p>
          <div className={dashboardStyles.tableWrapper}>
            <table className={dashboardStyles.table}>
              <thead>
                <tr>
                  <th className={dashboardStyles.th}>Tên giải đấu</th>
                  <th className={dashboardStyles.th}>Ngựa</th>
                  <th className={dashboardStyles.th}>Jockey</th>
                  <th className={dashboardStyles.th}>Ngày đăng ký</th>
                  <th className={dashboardStyles.th}>Trạng thái duyệt</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "24px" }} className={dashboardStyles.td}>Chưa đăng ký giải đấu nào</td></tr>
                ) : (
                  registrations.map(reg => (
                    <tr key={reg.id} className={dashboardStyles.rowHover}>
                      <td style={{ fontWeight: "700" }} className={dashboardStyles.td}>{reg.tournament_name}</td>
                      <td className={dashboardStyles.td}>{reg.horse_name || `Ngựa #${reg.horse_id}`}</td>
                      <td className={dashboardStyles.td}>{reg.jockey_name || `Jockey #${reg.jockey_id}`}</td>
                      <td className={dashboardStyles.td}>{formatDate(reg.registration_date)}</td>
                      <td className={dashboardStyles.td}>
                        <span className={`${dashboardStyles.badge} ${
                          reg.status === "APPROVED" ? dashboardStyles.badgeApproved :
                          reg.status === "PENDING" ? dashboardStyles.badgePending :
                          dashboardStyles.badgeRejected
                        }`}>
                          {reg.status === "APPROVED" ? "✓ Đã chấp nhận" : reg.status === "PENDING" ? "Chờ duyệt" : "✗ Bị từ chối"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Lịch thi đấu của Ngựa (Owner) */}
      {activeTab === "upcoming-races" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CalendarIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Lịch thi đấu của Ngựa
          </h2>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "16px", fontSize: "14px" }}>
            Những trận đua sắp tới cho ngựa của bạn.
          </p>
          <div className={dashboardStyles.tableWrapper}>
            <table className={dashboardStyles.table}>
              <thead>
                <tr>
                  <th className={dashboardStyles.th}>Ngựa</th>
                  <th className={dashboardStyles.th}>Giải đấu</th>
                  <th className={dashboardStyles.th}>Ngày giờ</th>
                  <th className={dashboardStyles.th}>Địa điểm</th>
                </tr>
              </thead>
              <tbody>
                {upcomingRaces.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "24px" }} className={dashboardStyles.td}>Không có lịch thi đấu nào sắp tới</td></tr>
                ) : (
                  upcomingRaces.map(r => (
                    <tr key={r.race_id} className={dashboardStyles.rowHover}>
                      <td style={{ fontWeight: "700" }} className={dashboardStyles.td}>{r.horse_name}</td>
                      <td className={dashboardStyles.td}>{r.tournament_name}</td>
                      <td className={dashboardStyles.td}>{formatDateTime(r.race_date)}</td>
                      <td className={dashboardStyles.td}>{r.location || "Chưa rõ"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "results" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ResultIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Kết quả thi đấu
          </h2>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "16px", fontSize: "14px" }}>
            Lịch sử xếp hạng và vi phạm của ngựa của bạn.
          </p>
          <div className={dashboardStyles.tableWrapper}>
            <table className={dashboardStyles.table}>
              <thead>
                <tr>
                  <th className={dashboardStyles.th}>Ngựa</th>
                  <th className={dashboardStyles.th}>Cuộc đua</th>
                  <th className={dashboardStyles.th}>Giải đấu</th>
                  <th className={dashboardStyles.th}>Rank</th>
                  <th className={dashboardStyles.th}>Điểm</th>
                  <th className={dashboardStyles.th}>Ghi chú</th>
                  <th className={dashboardStyles.th}>Vi phạm</th>
                </tr>
              </thead>
              <tbody>
                {resultHistory.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "24px" }} className={dashboardStyles.td}>Chưa có kết quả nào</td></tr>
                ) : (
                  resultHistory.map(item => (
                    <tr key={item.id} className={dashboardStyles.rowHover}>
                      <td style={{ fontWeight: "700" }} className={dashboardStyles.td}>{item.horse_name}</td>
                      <td className={dashboardStyles.td}>{item.race_name}</td>
                      <td className={dashboardStyles.td}>{item.tournament_name}</td>
                      <td className={dashboardStyles.td} style={{ fontWeight: "700", color: item.rank === 1 ? "#f59e0b" : item.rank === 2 ? "#94a3b8" : item.rank === 3 ? "#cd7f32" : "var(--color-text-dark)" }}>{item.rank ?? "-"}</td>
                      <td className={dashboardStyles.td} style={{ fontWeight: "700", color: "var(--color-burgundy)" }}>{item.points ?? "-"}</td>
                      <td className={dashboardStyles.td}>{item.notes || "-"}</td>
                      <td className={dashboardStyles.td}>
                        {item.violation_count > 0 ? (
                          <span className={`${dashboardStyles.badge} ${dashboardStyles.badgeRejected}`}>{item.violations}</span>
                        ) : (
                          <span className={`${dashboardStyles.badge} ${dashboardStyles.badgeApproved}`}>Không có</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Cúp & Giải thưởng của Owner */}
      {activeTab === "owner-awards" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AwardIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Cúp & Giải thưởng
          </h2>
          {awardsLoading ? (
            <p style={{ color: "var(--color-text-muted)" }}>Đang tải danh sách giải thưởng...</p>
          ) : awardsError ? (
            <div className={dashboardStyles.card} style={{ borderLeft: "4px solid var(--danger)", padding: "20px" }}>
              <p style={{ color: "var(--danger)", marginTop: 0 }}>Không thể tải danh sách giải thưởng: {awardsError}</p>
              <button type="button" className={dashboardStyles.btnSecondary} onClick={retryAwards}>Thử lại</button>
            </div>
          ) : awards.length === 0 ? (
            <div className={dashboardStyles.card} style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
              <AwardIcon size={48} style={{ color: "var(--color-border)", marginBottom: "16px" }} />
              <p style={{ fontWeight: "600", color: "var(--color-text-dark)" }}>Chưa có giải thưởng nào.</p>
              <p style={{ fontSize: "14px" }}>Hãy tham gia giải đấu để giành chiến thắng!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {awards.map((award, index) => (
                <article
                  key={`${award.tournament_name || "tournament"}-${award.horse_name || "horse"}-${award.rank ?? "rank"}-${index}`}
                  className={dashboardStyles.card}
                  style={{ display: "flex", flexDirection: "column", gap: "12px", borderLeft: "4px solid var(--color-burgundy)" }}
                >
                  <div style={{ color: "var(--color-burgundy)", fontSize: "18px", fontWeight: "800", fontFamily: "var(--font-bungee)" }}>
                    {formatAwardRank(award.rank)}
                  </div>
                  <h3 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <TrophyIcon size={18} style={{ color: "var(--color-forest)" }} /> {award.title || "Chưa có thông tin"}
                  </h3>
                  <div className={dashboardStyles.infoListItem}><label>Giải đấu:</label><span>{award.tournament_name || "Chưa có thông tin"}</span></div>
                  <div className={dashboardStyles.infoListItem}><label>Ngựa:</label><span style={{ fontWeight: "700" }}>{award.horse_name || "Chưa có thông tin"}</span></div>
                  <div className={dashboardStyles.infoListItem}><label>Nài ngựa:</label><span>{award.jockey_name || "Chưa có thông tin"}</span></div>
                  <div className={dashboardStyles.infoListItem}><label>Giá trị giải:</label><span style={{ fontWeight: "700", color: "var(--color-forest)" }}>{formatPrizeValue(award.prize_value)} VNĐ</span></div>
                  <div className={dashboardStyles.infoListItem}><label>Ghi chú:</label><span style={{ color: "var(--color-text-muted)" }}>{award.notes || "Không có ghi chú"}</span></div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Hồ sơ cá nhân Owner */}
      {activeTab === "profile" && (
        <div className={dashboardStyles.tabContent}>
          <h2 className={dashboardStyles.heading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <UserIcon size={24} style={{ color: "var(--color-burgundy)" }} /> Hồ sơ cá nhân Chủ Sở Hữu
          </h2>
          <div className={dashboardStyles.splitLayout}>
            <form onSubmit={saveOwnerProfile} className={dashboardStyles.formPanel}>
              <h3 className={dashboardStyles.subHeading} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <EditIcon size={18} /> Chỉnh sửa thông tin
              </h3>
              <div className={dashboardStyles.formGroup}>
                <label>Họ tên</label>
                <input type="text" className={dashboardStyles.inputField} value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} required />
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Email</label>
                <input type="email" className={dashboardStyles.inputField} value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required />
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Số điện thoại</label>
                <input type="text" className={dashboardStyles.inputField} value={profileForm.phone_number}
                  onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                <div className={dashboardStyles.formGroup}>
                  <label>Tuổi</label>
                  <input type="number" className={dashboardStyles.inputField} min="18" max="100" value={profileForm.age}
                    onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })} />
                </div>
                <div className={dashboardStyles.formGroup}>
                  <label>Kinh nghiệm (năm)</label>
                  <input type="number" className={dashboardStyles.inputField} min="0" value={profileForm.experience_years}
                    onChange={(e) => setProfileForm({ ...profileForm, experience_years: e.target.value })} />
                </div>
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Nghề nghiệp</label>
                <input type="text" className={dashboardStyles.inputField} value={profileForm.occupation}
                  onChange={(e) => setProfileForm({ ...profileForm, occupation: e.target.value })} />
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Địa chỉ liên hệ</label>
                <input type="text" className={dashboardStyles.inputField} value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Quốc tịch</label>
                <select className={dashboardStyles.inputField} value={profileForm.nationality}
                  onChange={(e) => setProfileForm({ ...profileForm, nationality: e.target.value })}>
                  <option value="">-- Chọn quốc tịch --</option>
                  <option value="Việt Nam">Việt Nam</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="France">France</option>
                  <option value="Japan">Japan</option>
                  <option value="Australia">Australia</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Thailand">Thailand</option>
                  <option value="Malaysia">Malaysia</option>
                </select>
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Công ty / Tên đội</label>
                <input type="text" className={dashboardStyles.inputField} value={profileForm.company_name}
                  onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })} />
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Avatar (URL)</label>
                <input type="text" className={dashboardStyles.inputField} value={profileForm.avatar}
                  onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })} />
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Website / Mạng xã hội</label>
                <input type="url" className={dashboardStyles.inputField} placeholder="https://example.com"
                  value={profileForm.social_link} onChange={(e) => setProfileForm({ ...profileForm, social_link: e.target.value })} />
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Mô tả ngắn (Bio)</label>
                <textarea className={dashboardStyles.inputField} maxLength={300} value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} />
                <div style={{ color: "var(--color-text-muted)", fontSize: "12px", marginTop: "4px" }}>
                  {profileForm.bio.length}/300 ký tự
                </div>
              </div>
              <div className={dashboardStyles.formGroup}>
                <label>Ngày tham gia hệ thống</label>
                <input type="text" className={dashboardStyles.inputField}
                  value={`Thành viên từ ${formatDate(ownerProfile?.joined_date)}`} readOnly />
              </div>
              <button type="submit" className={dashboardStyles.btnPrimary}>Lưu thay đổi</button>
            </form>

            <div style={{ flex: 1.2, minWidth: "280px" }}>
              <div className={dashboardStyles.card} style={{ padding: "24px" }}>
                <h3 className={dashboardStyles.subHeading} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
                  <UserIcon size={18} /> Thông tin hiện tại
                </h3>
                {ownerProfile ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {ownerProfile.avatar && (
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ownerProfile.avatar} alt="Owner Avatar" width={80} height={80}
                          style={{ borderRadius: "50%", objectFit: "cover", border: "3px solid var(--color-burgundy)" }}
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/fallback-avatar.png"; }} />
                      </div>
                    )}
                    <div className={dashboardStyles.infoListItem}><label>Họ tên:</label><span style={{ fontWeight: "700" }}>{ownerProfile.full_name}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>Email:</label><span>{ownerProfile.email}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>Thành viên từ:</label><span>{formatDate(ownerProfile.joined_date)}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>SĐT:</label><span>{ownerProfile.phone_number || "Chưa có"}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>Tuổi:</label><span>{ownerProfile.age != null ? `${ownerProfile.age} tuổi` : "Chưa có"}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>Kinh nghiệm:</label><span>{ownerProfile.experience_years != null ? `${ownerProfile.experience_years} năm` : "Chưa có"}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>Nghề nghiệp:</label><span>{ownerProfile.occupation || "Chưa có"}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>Địa chỉ:</label><span>{ownerProfile.address || "Chưa có"}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>Quốc tịch:</label><span>{ownerProfile.nationality || "Chưa có"}</span></div>
                    <div className={dashboardStyles.infoListItem}><label>Công ty:</label><span>{ownerProfile.company_name || "Chưa có"}</span></div>
                    <div className={dashboardStyles.infoListItem}>
                      <label>Website:</label>
                      {ownerProfile.social_link ? (
                        <a href={ownerProfile.social_link} target="_blank" rel="noreferrer" style={{ color: "var(--color-burgundy)" }}>{ownerProfile.social_link}</a>
                      ) : (<span>Chưa có</span>)}
                    </div>
                    <div className={dashboardStyles.infoListItem}><label>Bio:</label><span style={{ color: "var(--color-text-muted)" }}>{ownerProfile.bio || "Chưa có"}</span></div>
                  </div>
                ) : (
                  <p style={{ color: "var(--color-text-muted)" }}>Đang tải thông tin hồ sơ...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
