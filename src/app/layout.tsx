import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Tracker Envilog",
  description:
    "Pencatatan target, progress, dan status tugas tim Envilog dengan pengingat WhatsApp otomatis.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
