/**
 * Session-Hilfsfunktionen (BV-016, ADR-010)
 * Cookie-basierte Mitarbeiter-Session, per Passwort abgesichert.
 * Speichert mitarbeiter_id in Cookies; proxy.ts erzwingt eine gültige Session.
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
