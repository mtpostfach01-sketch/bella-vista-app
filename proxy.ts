/**
 * BV-016: Rollenbasierter Zugriff (Proxy, ehem. Middleware — Next.js 16)
 *
 * Rollen:
 *   CHEF     → Zugriff auf alles
 *   MANAGER  → kein Zugriff auf /mitarbeiter/*
 *   BEDIENUNG → nur /bestellungen/*, /reservierungen/*, /gaeste/*, /tische/*
 *              (alle neuen Phase-3-Bereiche wie /catering, /schichtplanung,
 *              /trinkgeld, /erinnerungen, /speisekarte/* sind für BEDIENUNG
 *              damit ebenfalls automatisch gesperrt — nicht in der Allowlist)
 *
 * Ohne Session: nur die Startseite (Login/Mitarbeiterauswahl) und die
 * Erst-Einrichtung eines Mitarbeiters sind erreichbar — sonst könnte
 * jeder ohne Anmeldung mit vollen Chef-Rechten arbeiten. Mit Session
 * wird die Rolle aus dem Cookie gelesen (kein DB-Aufruf im Edge möglich).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Ohne Login erreichbar: Startseite (Login-Auswahl) und Mitarbeiter-Erst-
// anlage (Bootstrap — ohne diese Ausnahme könnte man nie den ersten
// Mitarbeiter anlegen, um sich überhaupt einzuloggen).
const OHNE_LOGIN_ERLAUBT = ["/", "/mitarbeiter/neu"];

export function proxy(request: NextRequest) {
  const rolle = request.cookies.get("mitarbeiter_rolle")?.value;
  const { pathname } = request.nextUrl;

  if (!rolle) {
    if (OHNE_LOGIN_ERLAUBT.includes(pathname)) return NextResponse.next();
    return NextResponse.redirect(
      new URL("/?error=keine_session", request.url)
    );
  }

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
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|session).*)",
  ],
};
