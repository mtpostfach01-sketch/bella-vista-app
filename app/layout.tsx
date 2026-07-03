import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bella Vista",
  description: "Interne Restaurantverwaltung",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
          <span className="font-semibold text-gray-900">Bella Vista</span>
          <Link href="/gaeste" className="text-sm text-gray-600 hover:text-gray-900">
            Gäste
          </Link>
          <Link href="/tische" className="text-sm text-gray-600 hover:text-gray-900">
            Tische
          </Link>
          <Link href="/reservierungen" className="text-sm text-gray-600 hover:text-gray-900">
            Reservierungen
          </Link>
          <Link href="/speisekarte" className="text-sm text-gray-600 hover:text-gray-900">
            Speisekarte
          </Link>
          <Link href="/bestellungen" className="text-sm text-gray-600 hover:text-gray-900">
            Bestellungen
          </Link>
        </nav>
        <main className="flex-1 px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
