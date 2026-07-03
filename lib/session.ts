/**
 * Session-Hilfsfunktionen (BV-016)
 * Cookie-basierte Mitarbeiter-Auswahl (ohne echtes Passwort-Login).
 * Speichert mitarbeiter_id und mitarbeiter_rolle in Cookies.
 */

import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function getAktiverMitarbeiter() {
  const cookieStore = await cookies();
  const id = cookieStore.get("mitarbeiter_id")?.value;
  if (!id) return null;
  return db.mitarbeiter.findUnique({
    where: { id: Number(id) },
    include: { standort: true },
  });
}

export function getRolleAusCookie(): string | null {
  // Synchrone Variante für Middleware (Edge) — liest aus dem Cookie-Header
  // Wird in lib/session.ts nur deklariert; tatsächliche Middleware nutzt
  // request.cookies direkt.
  return null;
}
