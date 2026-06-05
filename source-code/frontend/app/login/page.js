"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../api";

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
    <div style={styles.container}>
      <div style={styles.card} className="glass">
        {/* Title */}
        <div style={styles.header}>
          <Link href="/" style={styles.backLink}>← Trang chủ</Link>
          <h1 style={styles.title}>🏇 HORSE <span style={{ color: "var(--primary)" }}>RACING</span></h1>
          <p style={styles.subtitle}>Đăng nhập vào hệ thống quản lý</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={styles.errorAlert}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={styles.form}>
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              id="username"
              type="text"
              className="input-field"
              placeholder="Nhập tên đăng nhập..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Đăng Nhập"}
          </button>
        </form>

        {/* Register navigation link */}
        <div style={styles.registerLink}>
          Chưa có tài khoản? <Link href="/register" style={{ color: "var(--primary)", fontWeight: "600" }}>Đăng ký ngay</Link>
        </div>
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
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
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
    transition: "color 0.2s",
  },
  title: {
    fontSize: "26px",
    fontWeight: "900",
    letterSpacing: "1px",
    marginTop: "20px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#94a3b8",
  },
  errorAlert: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "var(--danger)",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
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
    marginTop: "8px",
  },
  registerLink: {
    textAlign: "center",
    fontSize: "14px",
    color: "#94a3b8",
    marginTop: "8px",
  },
};
