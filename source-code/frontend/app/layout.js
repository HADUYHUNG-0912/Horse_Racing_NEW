import "./globals.css";
import { Asap, Bungee } from "next/font/google";

const asap = Asap({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-asap",
});

const bungee = Bungee({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-bungee",
});

export const metadata = {
  title: "Horse Racing Tournament Management System",
  description: "A premium management portal for horse racing championships, scheduling, registrations, results, and spectator predictions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={`${asap.variable} ${bungee.variable}`}>
        {children}
      </body>
    </html>
  );
}
