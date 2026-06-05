"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState("SPECTATOR");

  // Profile-specific fields
  const [bio, setBio] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [certificationLevel, setCertificationLevel] = useState("");
  const [favoriteHorseBreed, setFavoriteHorseBreed] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const payload = {
      username,
      email,
      full_name: fullName,
      password,
      role_name: roleName,
    };

    // Attach profile fields conditionally
    if (roleName === "JOCKEY") {
      payload.bio = bio || null;
      payload.weight = weight ? parseFloat(weight) : null;
      payload.height = height ? parseFloat(height) : null;
      payload.experience_years = experienceYears ? parseInt(experienceYears) : 0;
    } else if (roleName === "OWNER") {
      payload.company_name = companyName || null;
    } else if (roleName === "REFEREE") {
      payload.certification_level = certificationLevel || null;
    } else if (roleName === "SPECTATOR") {
      payload.favorite_horse_breed = favoriteHorseBreed || null;
    }

    try {
      await api.register(payload);
      setSuccess("Tạo tài khoản thành công! Đang chuyển hướng đăng nhập...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError(err.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} className="glass">
        {/* Header */}
        <div style={styles.header}>
          <Link href="/login" style={styles.backLink}>← Quay lại</Link>
          <h1 style={styles.title}>Đăng Ký Tài Khoản</h1>
          <p style={styles.subtitle}>Gia nhập hệ sinh thái đua ngựa chuyên nghiệp</p>
        </div>

        {/* Message banners */}
        {error && <div style={styles.errorAlert}>⚠️ {error}</div>}
        {success && <div style={styles.successAlert}>✓ {success}</div>}

        {/* Form */}
        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.row}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="username">Tên đăng nhập *</label>
              <input
                id="username"
                type="text"
                className="input-field"
                placeholder="Ví dụ: aaron123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="email">Địa chỉ Email *</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="aaron@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={styles.row}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="fullName">Họ và tên *</label>
              <input
                id="fullName"
                type="text"
                className="input-field"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="password">Mật khẩu *</label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="Mật khẩu bảo mật..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Role selection */}
          <div className="form-group">
            <label htmlFor="role">Vai trò trên hệ thống *</label>
            <select
              id="role"
              className="input-field"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              style={{ background: "var(--input-bg)" }}
            >
              <option value="SPECTATOR">Spectator (Khán giả)</option>
              <option value="OWNER">Horse Owner (Chủ ngựa)</option>
              <option value="JOCKEY">Jockey (Kỵ sĩ)</option>
              <option value="REFEREE">Referee (Trọng tài)</option>
              <option value="ADMIN">Organizer (Ban tổ chức)</option>
            </select>
          </div>

          {/* Dynamic Profile Sections */}
          {roleName === "JOCKEY" && (
            <div style={styles.profileSection} className="glass">
              <h3 style={styles.sectionTitle}>Thông tin Jockey</h3>
              <div style={styles.row}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="weight">Cân nặng (kg)</label>
                  <input
                    id="weight"
                    type="number"
                    step="0.1"
                    className="input-field"
                    placeholder="Ví dụ: 54.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="height">Chiều cao (m)</label>
                  <input
                    id="height"
                    type="number"
                    step="0.01"
                    className="input-field"
                    placeholder="Ví dụ: 1.62"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="exp">Số năm kinh nghiệm</label>
                  <input
                    id="exp"
                    type="number"
                    className="input-field"
                    placeholder="Ví dụ: 5"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="bio">Tiểu sử</label>
                <textarea
                  id="bio"
                  className="input-field"
                  placeholder="Kinh nghiệm thi đấu, thành tích..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ minHeight: "80px", resize: "vertical" }}
                />
              </div>
            </div>
          )}

          {roleName === "OWNER" && (
            <div style={styles.profileSection} className="glass">
              <h3 style={styles.sectionTitle}>Thông tin Chủ ngựa</h3>
              <div className="form-group">
                <label htmlFor="company">Tên Trang trại / Công ty</label>
                <input
                  id="company"
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: Trang trại Hoàng Gia"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>
          )}

          {roleName === "REFEREE" && (
            <div style={styles.profileSection} className="glass">
              <h3 style={styles.sectionTitle}>Thông tin Trọng tài</h3>
              <div className="form-group">
                <label htmlFor="cert">Cấp độ chứng chỉ</label>
                <input
                  id="cert"
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: Cấp Quốc gia A"
                  value={certificationLevel}
                  onChange={(e) => setCertificationLevel(e.target.value)}
                />
              </div>
            </div>
          )}

          {roleName === "SPECTATOR" && (
            <div style={styles.profileSection} className="glass">
              <h3 style={styles.sectionTitle}>Thông tin Khán giả</h3>
              <div className="form-group">
                <label htmlFor="breed">Giống ngựa yêu thích nhất</label>
                <input
                  id="breed"
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: Thoroughbred, Arabian..."
                  value={favoriteHorseBreed}
                  onChange={(e) => setFavoriteHorseBreed(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Đăng Ký Tài Khoản"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
  },
  card: {
    width: "100%",
    maxWidth: "680px",
    padding: "40px",
    borderRadius: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  header: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    position: "relative",
  },
  backLink: {
    position: "absolute",
    left: "0",
    top: "-10px",
    fontSize: "13px",
    color: "#64748b",
  },
  title: {
    fontSize: "26px",
    fontWeight: "900",
    marginTop: "20px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#94a3b8",
  },
  row: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
  },
  profileSection: {
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background: "rgba(255,255,255,0.01)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "var(--primary)",
    marginBottom: "4px",
  },
  errorAlert: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "var(--danger)",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
  },
  successAlert: {
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    color: "var(--success)",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  submitBtn: {
    width: "100%",
    justifyContent: "center",
    padding: "12px",
    fontSize: "15px",
    marginTop: "16px",
  },
};
