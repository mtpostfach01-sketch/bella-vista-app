import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Fraunces } from "next/font/google";
import Link from "next/link";
import { getAktiverMitarbeiter } from "@/lib/session";
import { NavLink } from "./NavLink";
import { Logo } from "./Logo";
import { BottomNav } from "./BottomNav";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Bella Vista",
  description: "Interne Restaurantverwaltung",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const aktiver = await getAktiverMitarbeiter();

  const rolleBadge: Record<string, string> = {
    CHEF: "bg-amber-400/90 text-teal-950",
    MANAGER: "bg-white/20 text-white",
    BEDIENUNG: "bg-white/10 text-teal-100",
  };

  // Desktop: volle Link-Reihe in der oberen Nav-Leiste
  const navPunkte = (
    <>
      <NavLink href="/gaeste">🧑‍🤝‍🧑 Gäste</NavLink>
      <NavLink href="/tische">🪑 Tische</NavLink>
      <NavLink href="/reservierungen">📅 Reservierungen</NavLink>
      <NavLink href="/speisekarte">🍝 Speisekarte</NavLink>
      <NavLink href="/bestellungen">🧾 Bestellungen</NavLink>
      <NavLink href="/catering">🎉 Catering</NavLink>
      <NavLink href="/mitarbeiter">👤 Mitarbeiter</NavLink>
      {/* BV-017: Dashboard nur für CHEF und MANAGER */}
      {aktiver && aktiver.rolle !== "BEDIENUNG" && (
        <NavLink href="/dashboard">📊 Dashboard</NavLink>
      )}
    </>
  );

  // Mobil: alle erreichbaren Ziele direkt in der unteren, horizontal
  // scrollbaren Tab-Leiste — kein "Mehr"-Umweg. BEDIENUNG sieht nur die
  // ihr erlaubten 5 Ziele (deckt sich mit der Allowlist in proxy.ts),
  // CHEF/MANAGER sehen alle 9.
  const bottomTabs = [
    { href: "/", label: "Start", icon: "🏠" },
    { href: "/bestellungen", label: "Bestellungen", icon: "🧾" },
    { href: "/reservierungen", label: "Reserv.", icon: "📅" },
    { href: "/gaeste", label: "Gäste", icon: "🧑‍🤝‍🧑" },
    { href: "/tische", label: "Tische", icon: "🪑" },
    ...(aktiver && aktiver.rolle !== "BEDIENUNG"
      ? [
          { href: "/speisekarte", label: "Speisekarte", icon: "🍝" },
          { href: "/catering", label: "Catering", icon: "🎉" },
          { href: "/mitarbeiter", label: "Mitarbeiter", icon: "👤" },
          { href: "/dashboard", label: "Dashboard", icon: "📊" },
        ]
      : []),
  ];

  const sessionWidget = aktiver ? (
    <Link
      href="/"
      className="flex items-center gap-1.5 text-xs text-teal-100 hover:text-white"
    >
      <span
        className={`px-1.5 py-0.5 rounded font-medium ${
          rolleBadge[aktiver.rolle] ?? "bg-white/10 text-teal-100"
        }`}
      >
        {aktiver.rolle}
      </span>
      <span className="hidden sm:inline">
        {aktiver.vorname} {aktiver.nachname}
      </span>
    </Link>
  ) : (
    <Link
      href="/"
      className="text-xs text-amber-300 hover:text-amber-200 font-medium"
    >
      Nicht angemeldet →
    </Link>
  );

  return (
    <html
      lang="de"
      className={`${geist.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <nav className="bg-gradient-to-r from-teal-900 to-teal-800 shadow-md px-4 sm:px-6 py-3 flex items-center gap-1.5">
          <Link
            href="/"
            className="font-heading text-xl font-semibold text-white tracking-tight mr-4 flex items-center gap-2"
          >
            <Logo className="w-6 h-6 text-amber-400" />
            <span className="hidden sm:inline">Bella Vista</span>
          </Link>

          {/* Ab md: volle Nav-Reihe oben. Darunter übernimmt die BottomNav. */}
          <div className="hidden md:flex items-center gap-1.5">{navPunkte}</div>

          {/* BV-016: Session-Anzeige in Nav */}
          <div className="ml-auto flex items-center gap-3">{sessionWidget}</div>
        </nav>

        {/* Unten Platz für die fixierte mobile Tab-Leiste lassen */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 pb-24 md:pb-8">
          {children}
        </main>

        <BottomNav tabs={bottomTabs} />
      </body>
    </html>
  );
}
