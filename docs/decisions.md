# decisions.md — Architekturentscheidungen

_Append-only Log. Einmal getroffen — nie stillschweigend geändert. Neue Entscheidung = neuer ADR._

---

## ADR-001 — Standortabhängigkeit als zentrales Architekturprinzip

**Status:** Entschieden (Juni 2026)
**Kontext:** Bella Vista betreibt zwei Standorte (Kreuzberg, Spandau) mit eigenem Tischplan, eigener Speisekarte und eigenem Personal.

**Entscheidung:** Standort ist der primäre Anker fast aller Daten. Tische, Speisekarten, Reservierungen, Auslastung, Schichten und Bestellungen sind immer einem Standort zugeordnet. Tischnummern sind nur innerhalb eines Standorts eindeutig (Tisch 4 KB ≠ Tisch 4 SP).

**Begründung:** SPEC.md W2 — Marco will im Alltag getrennte Standorte, aber einen gemeinsamen Überblick. Lösung: Daten logisch getrennt, zentral synchronisiert. Chef-Dashboard wechselt zwischen Standorten.

**Konsequenz:** Jeder Datenbankzugriff, der Tische, Reservierungen oder Bestellungen betrifft, muss die `standort_id` als Pflichtparameter tragen. Kein standortübergreifender Tisch-Join ohne expliziten Grund.

---

## ADR-002 — Kein Gast-Self-Service

**Status:** Entschieden (Juni 2026)
**Kontext:** Marco will Digitalisierung intern, aber den persönlichen Gastkontakt erhalten.

**Entscheidung:** Keine Online-Selbstreservierung, keine Gast-App, keine Selbstbestellung am Tisch. Alle Eingaben laufen über Mitarbeiter.

**Begründung:** SPEC.md W1 & W3 — Telefonischer Kontakt ist Markenidentität. „Kein Fast-Food-Laden." Gastkontakt und Schlüsselentscheidungen bleiben menschlich.

**Konsequenz:** Kein öffentliches Frontend für Gäste. Alle UI-Seiten erfordern Login als Mitarbeiter.

---

## ADR-003 — Gast-Datensatz standortübergreifend

**Status:** Entschieden (Juni 2026)
**Kontext:** Reservierungen und Tische sind standortspezifisch, aber Stammgäste besuchen beide Häuser.

**Entscheidung:** Ein Gast-Datensatz gilt für beide Standorte. Wiedererkennung per Telefonnummer. Besuchsanzahl und Bella-Card-Status werden standortübergreifend summiert.

**Begründung:** SPEC.md W5 — Marco erkennt Stammgäste manuell in beiden Restaurants. Das muss die App genauso können.

**Konsequenz:** `gast_id` ist kein standortgebundener Fremdschlüssel. Die Gast-Tabelle liegt einmal zentral; Reservierungen verlinken Gast + Standort.

---

## ADR-004 — TSE-Kassenkopplung zurückgestellt (v2)

**Status:** Entschieden (Juni 2026)
**Kontext:** Marco hat eine bestehende TSE-Kasse. Ob und wie die App daran andockt, ist technisch ungeklärt.

**Entscheidung:** v1 erzeugt die Rechnung inkl. Splitting vollständig in der App. Direkte TSE-Kassenkopplung ist v2. Keine Annahmen über TSE-Schnittstelle im v1-Datenmodell.

**Begründung:** SPEC.md §6 Offene Frage 1 — „das ist euer Bereich" (Marco). Kopplung würde v1 unabsehbar verzögern.

**Konsequenz:** Rechnung/Zahlung wird in der App persistent gespeichert. Export-Format für spätere TSE-Kopplung offen halten (keine proprietären IDs einbauen).

---

## ADR-005 — Tech-Stack

**Status:** Entschieden (Juli 2026)
**Kontext:** Kursempfehlung Modul 5 (Zawisza): Framework frei, SQLite als Standard. v1 läuft lokal, kein Deployment.

**Entscheidung:** Next.js (App Router) als Framework, SQLite als Datenbank via Prisma ORM.

**Begründung:**
- Next.js: React-basiert, Server Actions für Backend-Logik, gute Agent-Unterstützung im Kurs
- SQLite: Zero Setup, eine Datei, kein Server-Dienst — lokal sofort lauffähig
- Prisma: typsicheres ORM mit Migrations; Wechsel zu PostgreSQL später mit einer Zeile (kein Lock-in)
- Auth-Strategie (z. B. next-auth) noch offen — vor BV-016 (Rollenbasierter Zugriff) klären

**Konsequenz:** `prisma/schema.prisma` ist die Wahrheitsquelle für das Datenmodell. Business Rules laufen via Server Actions server-seitig. Offline-Verhalten (SPEC.md §6/2) ist v2-Thema — v1 setzt WLAN-Verfügbarkeit voraus.
