import "./globals.css";

export const metadata = {
  title: "Horse Racing Tournament Management System",
  description: "A premium management portal for horse racing championships, scheduling, registrations, results, and spectator predictions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        {children}
      </body>
    </html>
  );
}
