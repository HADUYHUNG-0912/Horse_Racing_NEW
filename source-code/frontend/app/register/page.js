"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../api";
import styles from "./Register.module.css";

const imageBase = "/images/next";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState("SPECTATOR");

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
    <main className={styles.registerPage}>
      <section className={styles.visualPanel} aria-label="Gia nhập hệ sinh thái đua ngựa">
        <Image
          className={styles.backgroundImage}
          src={`${imageBase}/dressage horse rider action.jpg`}
          alt="Jockey cùng ngựa đua tại trường đua"
          fill
          priority
          sizes="(max-width: 767px) 100vw, 44vw"
        />
        <div className={styles.overlay} />

        <div className={styles.visualContent}>
          <Link className={styles.logo} href="/" aria-label="Horse Racing - Trang chủ">
            <Image
              src={`${imageBase}/icon/icon-horse-head.svg`}
              alt=""
              width={38}
              height={38}
            />
            <span>Horse <strong>Racing</strong></span>
          </Link>

          <div className={styles.welcomeCopy}>
            <p>Gia nhập hệ sinh thái đua ngựa</p>
            <h1>Trở thành một phần<br />của đường đua.</h1>
            <span>
              Tạo tài khoản để quản lý ngựa đua, theo dõi lịch thi đấu và kết quả —
              dành riêng cho vai trò của bạn.
            </span>
          </div>

          <p className={styles.copyright}>
            © 2026 Horse Racing Tournament Management System
          </p>
        </div>
      </section>

      <section className={styles.formPanel}>
        <Link className={styles.backLink} href="/login">
          <span aria-hidden="true">←</span> Quay lại
        </Link>

        <div className={styles.formContainer}>
          <header className={styles.formHeader}>
            <p>Cổng thông tin thành viên</p>
            <h2>Đăng ký tài khoản</h2>
            <span>Gia nhập hệ sinh thái đua ngựa chuyên nghiệp.</span>
          </header>

          {error && (
            <div className={styles.errorAlert} role="alert" aria-live="polite">
              <span className={styles.alertIcon} aria-hidden="true">!</span>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className={styles.successAlert} role="status" aria-live="polite">
              <span className={styles.alertIcon} aria-hidden="true">✓</span>
              <p>{success}</p>
            </div>
          )}

          <form className={styles.form} onSubmit={handleRegister}>
            <div className={styles.row}>
              <div className={styles.fieldGroup}>
                <label htmlFor="username">Tên đăng nhập *</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Ví dụ: aaron123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="email">Địa chỉ Email *</label>
                <input
                  id="email"
                  type="email"
                  placeholder="aaron@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.fieldGroup}>
                <label htmlFor="fullName">Họ và tên *</label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="password">Mật khẩu *</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Mật khẩu bảo mật..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="role">Vai trò trên hệ thống *</label>
              <select
                id="role"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              >
                <option value="SPECTATOR">Spectator (Khán giả)</option>
                <option value="OWNER">Horse Owner (Chủ ngựa)</option>
                <option value="JOCKEY">Jockey (Kỵ sĩ)</option>
                <option value="REFEREE">Referee (Trọng tài)</option>
              </select>
            </div>

            {roleName === "JOCKEY" && (
              <div className={styles.profileSection}>
                <h3 className={styles.sectionTitle}>Thông tin Jockey</h3>
                <div className={styles.profileRow}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="weight">Cân nặng (kg)</label>
                    <input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="Ví dụ: 54.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="height">Chiều cao (m)</label>
                    <input
                      id="height"
                      type="number"
                      step="0.01"
                      placeholder="Ví dụ: 1.62"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="exp">Số năm kinh nghiệm</label>
                    <input
                      id="exp"
                      type="number"
                      placeholder="Ví dụ: 5"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="bio">Tiểu sử</label>
                  <textarea
                    id="bio"
                    placeholder="Kinh nghiệm thi đấu, thành tích..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>
            )}

            {roleName === "OWNER" && (
              <div className={styles.profileSection}>
                <h3 className={styles.sectionTitle}>Thông tin Chủ ngựa</h3>
                <div className={styles.fieldGroup}>
                  <label htmlFor="company">Tên Trang trại / Công ty</label>
                  <input
                    id="company"
                    type="text"
                    placeholder="Ví dụ: Trang trại Hoàng Gia"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {roleName === "REFEREE" && (
              <div className={styles.profileSection}>
                <h3 className={styles.sectionTitle}>Thông tin Trọng tài</h3>
                <div className={styles.fieldGroup}>
                  <label htmlFor="cert">Cấp độ chứng chỉ</label>
                  <input
                    id="cert"
                    type="text"
                    placeholder="Ví dụ: Cấp Quốc gia A"
                    value={certificationLevel}
                    onChange={(e) => setCertificationLevel(e.target.value)}
                  />
                </div>
              </div>
            )}

            {roleName === "SPECTATOR" && (
              <div className={styles.profileSection}>
                <h3 className={styles.sectionTitle}>Thông tin Khán giả</h3>
                <div className={styles.fieldGroup}>
                  <label htmlFor="breed">Giống ngựa yêu thích nhất</label>
                  <input
                    id="breed"
                    type="text"
                    placeholder="Ví dụ: Thoroughbred, Arabian..."
                    value={favoriteHorseBreed}
                    onChange={(e) => setFavoriteHorseBreed(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button className={styles.submitButton} type="submit" disabled={loading}>
              <span>{loading ? "Đang xử lý..." : "Đăng ký tài khoản"}</span>
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className={styles.loginPrompt}>
            Đã có tài khoản? <Link href="/login">Đăng nhập ngay</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
