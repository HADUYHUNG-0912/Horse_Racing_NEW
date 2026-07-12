"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "./api";
import styles from "./page.module.css";

const imageBase = "/images/next";

const statItems = [
  { key: "tournamentsCount", label: "Giải đấu", icon: "icon-trophy.svg" },
  { key: "racesCount", label: "Trận đua", icon: "icon-finish-flag.svg" },
  { key: "horsesCount", label: "Ngựa đua", icon: "icon-horseshoe.svg" },
  { key: "jockeysCount", label: "Jockey", icon: "icon-jockey-helmet.svg" },
];

function formatDate(value) {
  if (!value) return "Đang cập nhật";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusLabel(status) {
  const labels = {
    ACTIVE: "Đang diễn ra",
    OPEN: "Đang mở đăng ký",
    UPCOMING: "Sắp diễn ra",
    COMPLETED: "Đã kết thúc",
  };

  return labels[status] || status || "Sắp công bố";
}

export default function Home() {
  const [rankings, setRankings] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState({
    tournamentsCount: 0,
    racesCount: 0,
    horsesCount: 0,
    jockeysCount: 0,
  });

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const ranks = await api.get("/results/rankings");
        setRankings(ranks.slice(0, 5));

        const tours = await api.get("/tournaments");
        setTournaments(tours);

        const horses = await api.get("/horses");
        const jockeys = await api.get("/jockeys");
        const races = await api.get("/races");

        setStats({
          tournamentsCount: tours.length,
          racesCount: races.length,
          horsesCount: horses.length,
          jockeysCount: jockeys.length,
        });
      } catch (err) {
        console.error("Error loading landing page data:", err);
      }
    };

    fetchLandingData();
  }, []);

  const featuredTournament =
    tournaments.find((tournament) => ["OPEN", "ACTIVE"].includes(tournament.status)) ||
    tournaments[0];
  const topRanking = rankings[0];

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <Image
          className={styles.heroImage}
          src={`${imageBase}/equestrian horse portrait dark background.jpg`}
          alt="Các jockey đang tranh tài trên đường đua ngựa"
          fill
          priority
          sizes="100vw"
        />
        <div className={styles.heroShade} />

        <header className={styles.header}>
          <Link className={styles.logo} href="/" aria-label="Horse Racing - Trang chủ">
            <span className={styles.logoMark}>
              <Image src={`${imageBase}/icon/icon-horse-head.svg`} alt="" width={34} height={34} />
            </span>
            <span>Horse <strong>Racing</strong></span>
          </Link>

          <nav className={styles.nav} aria-label="Điều hướng chính">
            <a href="#about">Giới thiệu</a>
            <a href="#tournaments">Giải đấu</a>
            <a href="#rankings">Xếp hạng</a>
          </nav>

          <div className={styles.authActions}>
            <Link className={styles.loginLink} href="/login">Đăng nhập</Link>
            <Link className={styles.registerLink} href="/register">Đăng ký</Link>
          </div>
        </header>

        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Nền tảng quản lý giải đấu chuyên nghiệp</p>
          <h1 id="hero-title">
            Nơi tốc độ tạo nên
            <span>những huyền thoại.</span>
          </h1>
          <p className={styles.heroDescription}>
            Kết nối ban tổ chức, chủ ngựa, jockey, trọng tài và khán giả trong một
            hệ thống quản lý minh bạch, chính xác theo thời gian thực.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/login">
              Vào bảng điều khiển <span aria-hidden="true">→</span>
            </Link>
            <Link className={styles.secondaryButton} href="/register">
              Tạo tài khoản mới
            </Link>
          </div>
        </div>

        <aside className={styles.featuredCard} aria-label="Giải đấu nổi bật">
          <div className={styles.featuredTopline}>
            <span className={styles.featuredIcon}>
              <Image src={`${imageBase}/icon/icon-trophy.svg`} alt="" width={25} height={25} />
            </span>
            <span className={styles.statusDot} />
            <span>{getStatusLabel(featuredTournament?.status)}</span>
          </div>
          <p className={styles.featuredLabel}>Giải đấu nổi bật</p>
          <h2>{featuredTournament?.name || "Mùa giải mới sắp khởi tranh"}</h2>
          <p className={styles.featuredMeta}>
            {featuredTournament
              ? `${featuredTournament.location || "Địa điểm đang cập nhật"} · ${formatDate(featuredTournament.start_date)}`
              : "Thông tin đăng ký sẽ sớm được công bố"}
          </p>
          <Link href="/login">Xem chi tiết <span aria-hidden="true">↗</span></Link>
        </aside>

        <a className={styles.scrollCue} href="#stats" aria-label="Cuộn xuống phần thống kê">
          <span>Khám phá</span>
          <i aria-hidden="true" />
        </a>
      </section>

      <section className={styles.statsSection} id="stats" aria-label="Thống kê hệ thống">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionKicker}>Những con số trên đường đua</p>
          <h2>Một hệ sinh thái đang chuyển động</h2>
        </div>
        <div className={styles.statsGrid}>
          {statItems.map((item, index) => (
            <article className={styles.statCard} key={item.key}>
              <span className={styles.statIndex}>0{index + 1}</span>
              <Image
                className={styles.statIcon}
                src={`${imageBase}/icon/${item.icon}`}
                alt=""
                width={42}
                height={42}
              />
              <strong>{stats[item.key]}</strong>
              <p>{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.aboutSection} id="about">
        <div className={styles.aboutVisual}>
          <Image
            src={`${imageBase}/dressage horse rider action.jpg`}
            alt="Jockey điều khiển ngựa trong một màn thi đấu chuyên nghiệp"
            fill
            sizes="(max-width: 768px) 100vw, 52vw"
          />
          <div className={styles.rankingCard} id="rankings">
            <span>Dẫn đầu bảng xếp hạng</span>
            <strong>{topRanking?.entity_name || "Đang cập nhật"}</strong>
            <p>{topRanking ? `${topRanking.points} điểm` : "Kết quả mới nhất sẽ sớm xuất hiện"}</p>
          </div>
        </div>

        <div className={styles.aboutContent}>
          <p className={styles.sectionKicker}>Vì sao chọn chúng tôi</p>
          <h2>Trọn vẹn từng khoảnh khắc trên đường đua</h2>
          <Image
            className={styles.divider}
            src={`${imageBase}/icon/decor-divider.svg`}
            alt=""
            width={150}
            height={15}
          />
          <p className={styles.aboutLead}>
            Từ đăng ký vận động viên đến công bố kết quả, mọi nghiệp vụ đều được
            tổ chức trong một luồng làm việc liền mạch và đáng tin cậy.
          </p>
          <ul className={styles.benefits}>
            <li>
              <span>01</span>
              <div><strong>Quản lý tập trung</strong><p>Dữ liệu giải đấu, lịch đua và hồ sơ được đồng bộ trong một hệ thống.</p></div>
            </li>
            <li>
              <span>02</span>
              <div><strong>Kết quả minh bạch</strong><p>Xếp hạng và thành tích được cập nhật chính xác theo thời gian thực.</p></div>
            </li>
            <li>
              <span>03</span>
              <div><strong>Kết nối mọi vai trò</strong><p>Mỗi thành viên có không gian làm việc phù hợp với nhiệm vụ của mình.</p></div>
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.tournamentSection} id="tournaments">
        <div className={styles.tournamentHeading}>
          <div>
            <p className={styles.lightKicker}>Tâm điểm mùa giải</p>
            <h2>Các giải đấu mới nhất</h2>
          </div>
          <Link href="/login">Theo dõi toàn bộ giải đấu <span aria-hidden="true">→</span></Link>
        </div>

        <div className={styles.tournamentGrid}>
          {tournaments.length === 0 ? (
            <p className={styles.emptyState}>Lịch giải đấu đang được cập nhật.</p>
          ) : (
            tournaments.slice(0, 3).map((tournament) => (
              <article className={styles.tournamentCard} key={tournament.id}>
                <span>{getStatusLabel(tournament.status)}</span>
                <h3>{tournament.name}</h3>
                <p>{tournament.location || "Địa điểm đang cập nhật"}</p>
                <time dateTime={tournament.start_date}>{formatDate(tournament.start_date)}</time>
              </article>
            ))
          )}
        </div>
      </section>

      <section className={styles.testimonialSection}>
        <div className={styles.portrait}>
          <Image
            src={`${imageBase}/equestrian horse portrait dark background.jpg`}
            alt="Chân dung ngựa đua trên nền tối"
            fill
            sizes="(max-width: 768px) 100vw, 38vw"
          />
        </div>
        <figure>
          <span className={styles.quoteMark} aria-hidden="true">“</span>
          <blockquote>
            Một giải đấu xuất sắc không chỉ được tạo nên bởi tốc độ, mà còn bởi
            sự chuẩn bị chỉn chu, công bằng và niềm tin của tất cả những người tham gia.
          </blockquote>
          <figcaption>
            <span className={styles.avatar}>HT</span>
            <div><strong>Hội đồng tổ chức</strong><small>Horse Racing Tournament System</small></div>
          </figcaption>
        </figure>
      </section>

      <footer className={styles.footer}>
        <Link className={styles.footerLogo} href="/">
          <Image src={`${imageBase}/icon/icon-horse-head.svg`} alt="" width={32} height={32} />
          Horse Racing
        </Link>
        <p>© 2026 Horse Racing Tournament Management System.</p>
        <div>
          <Link href="/login">Đăng nhập</Link>
          <Link href="/register">Đăng ký</Link>
        </div>
      </footer>
    </main>
  );
}
