/**
 * BV-016: Rollenbasierter Zugriff (Middleware)
 *
 * Rollen:
 *   CHEF     → Zugriff auf alles
 *   MANAGER  → kein Zugriff auf /mitarbeiter/*
 *   BEDIENUNG → nur /bestellungen/*, /reservierungen/*, /gaeste/*, /tische/*
 *
 * Ohne Session: alle Seiten erreichbar (für initiale Einrichtung / Tests).
 * Mit Session: Rolle wird aus Cookie gelesen (kein DB-Aufruf in Edge).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const rolle = request.cookies.get("mitarbeiter_rolle")?.value;
  const { pathname } = request.nextUrl;

  // Ohne Session: alle Seiten zugänglich
  if (!rolle) return NextResponse.next();

  // CHEF: Zugriff auf alles
  if (rolle === "CHEF") return NextResponse.next();

  // MANAGER: kein Zugriff auf Mitarbeiter-Verwaltung
  if (rolle === "MANAGER" && pathname.startsWith("/mitarbeiter")) {
    return NextResponse.redirect(new URL("/?error=kein_zugriff", request.url));
  }

  // BEDIENUNG: nur Bestellungen, Reservierungen, Gäste, Tische und Startseite
  if (rolle === "BEDIENUNG") {
    const erlaubte = [
      "/bestellungen",
      "/reservierungen",
      "/gaeste",
      "/tische",
      "/",
    ];
    const erlaubt = erlaubte.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (!erlaubt) {
      return NextResponse.redirect(
        new URL("/?error=kein_zugriff", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|session).*)",
  ],
};
