import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Erlaubt Zugriff auf den Dev-Server (inkl. Hot-Reload) vom Handy im
  // selben WLAN. IP ändert sich je nach Netzwerk — bei Bedarf ergänzen
  // (Next.js zeigt die passende IP beim Start unter "Network:" an).
  allowedDevOrigins: ["192.168.178.86", "192.168.1.111"],
};

export default nextConfig;
