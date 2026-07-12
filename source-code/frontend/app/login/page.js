"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../api";
import styles from "./Login.module.css";

const imageBase = "/images/next";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(username, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.loginPage}>
      <section className={styles.visualPanel} aria-label="Chào mừng trở lại">
        <Image
          className={styles.backgroundImage}
          src={`${imageBase}/dressage horse rider action.jpg`}
          alt="Jockey cùng ngựa đua tại trường đua"
          fill
          priority
          sizes="(max-width: 767px) 100vw, 55vw"
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
            <p>Nơi những nhà vô địch hội tụ</p>
            <h1>Chào mừng trở lại<br />đường đua.</h1>
            <span>Tiếp tục hành trình chinh phục những cột mốc mới.</span>
          </div>

          <p className={styles.copyright}>
            © 2026 Horse Racing Tournament Management System
          </p>
        </div>
      </section>

      <section className={styles.formPanel}>
        <Link className={styles.backLink} href="/">
          <span aria-hidden="true">←</span> Trang chủ
        </Link>

        <div className={styles.formContainer}>
          <header className={styles.formHeader}>
            <p>Cổng thông tin thành viên</p>
            <h2>Đăng nhập</h2>
            <span>Nhập thông tin tài khoản để truy cập bảng điều khiển.</span>
          </header>

          {error && (
            <div className={styles.errorAlert} role="alert" aria-live="polite">
              <span className={styles.errorIcon} aria-hidden="true">!</span>
              <p>{error}</p>
            </div>
          )}

          <form className={styles.form} onSubmit={handleLogin}>
            <div className={styles.fieldGroup}>
              <label htmlFor="username">Tên đăng nhập</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={Boolean(error)}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="password">Mật khẩu</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(error)}
                required
              />
            </div>

            <button className={styles.submitButton} type="submit" disabled={loading}>
              <span>{loading ? "Đang xử lý..." : "Đăng nhập"}</span>
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className={styles.registerPrompt}>
            Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link>
          </p>
        </div>

        <p className={styles.securityNote}>
          Thông tin đăng nhập của bạn được bảo mật an toàn.
        </p>
      </section>
    </main>
  );
}
