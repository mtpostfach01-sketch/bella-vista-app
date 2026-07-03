import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { getAktiverMitarbeiter } from "@/lib/session";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

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
    CHEF: "bg-purple-100 text-purple-700",
    MANAGER: "bg-blue-100 text-blue-700",
    BEDIENUNG: "bg-gray-100 text-gray-600",
  };

  return (
    <html lang="de" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
          <Link href="/" className="font-semibold text-gray-900 hover:text-gray-700">
            Bella Vista
          </Link>
          <Link
            href="/gaeste"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Gäste
          </Link>
          <Link
            href="/tische"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Tische
          </Link>
          <Link
            href="/reservierungen"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Reservierungen
          </Link>
          <Link
            href="/speisekarte"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Speisekarte
          </Link>
          <Link
            href="/bestellungen"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Bestellungen
          </Link>
          <Link
            href="/mitarbeiter"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Mitarbeiter
          </Link>
          {/* BV-017: Dashboard nur für CHEF und MANAGER */}
          {aktiver && aktiver.rolle !== "BEDIENUNG" && (
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
          )}

          {/* BV-016: Session-Anzeige in Nav */}
          <div className="ml-auto flex items-center gap-2">
            {aktiver ? (
              <Link
                href="/"
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900"
              >
                <span
                  className={`px-1.5 py-0.5 rounded ${
                    rolleBadge[aktiver.rolle] ?? "bg-gray-100 text-gray-500"
                  }`}
                >
                  {aktiver.rolle}
                </span>
                <span>
                  {aktiver.vorname} {aktiver.nachname}
                </span>
              </Link>
            ) : (
              <Link
                href="/"
                className="text-xs text-amber-600 hover:text-amber-800"
              >
                Nicht angemeldet →
              </Link>
            )}
          </div>
        </nav>
        <main className="flex-1 px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
