import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Di-bundle saat build lalu di-host sendiri — tidak ada permintaan ke server
// font pihak ketiga saat aplikasi dibuka, jadi tetap cepat di jaringan seluler.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Task Tracker Envilog",
  description:
    "Pencatatan target, progress, dan status tugas tim Envilog dengan pengingat WhatsApp otomatis.",
  applicationName: "Task Tracker Envilog",
  appleWebApp: {
    capable: true,
    title: "Envilog",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // supaya area aman iPhone bisa dihitung
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
