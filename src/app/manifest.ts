import type { MetadataRoute } from "next";

/**
 * Supaya aplikasi bisa dipasang ke layar utama HP ("Add to Home Screen")
 * dan terbuka tanpa address bar — terasa seperti aplikasi biasa.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Task Tracker Envilog",
    short_name: "Envilog",
    description:
      "Pencatatan target, progress, dan status tugas tim Envilog dengan pengingat WhatsApp otomatis.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f7f9",
    theme_color: "#1d4ed8",
    lang: "id",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
