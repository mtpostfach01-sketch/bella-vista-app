# Bella Vista App — AI Briefing

**Projekt:** Interne Restaurantverwaltung für Bella Vista (2 Standorte, Berlin)
**Auftraggeber:** Marco Ferretti · Bella Vista Kreuzberg & Spandau
**Entwicklerin:** Marie Tewes · HTW Berlin · SB52.2 Anforderungsmodell (Prof. Zawisza)
**Stand:** Juni 2026

---

## Pflichtlektüre — in dieser Reihenfolge

| # | Datei | Zweck |
|---|-------|-------|
| 1 | `docs/spec.md` | Vollständiges Anforderungsmodell: 25 Entitäten, 29 Beziehungen, 23 Business Rules, 8 aufgelöste Widersprüche |
| 2 | `docs/decisions.md` | Architekturentscheidungen (ADRs) — hier vor Scope-Änderungen nachsehen |
| 3 | `docs/backlog.md` | Feature-Register mit stabilen IDs (BV-xxx), v1 vs. v2 |

---

## Projekt in einem Satz

Eine interne Web-App für den Restaurantbetrieb: digitale Reservierungsverwaltung, Tisch-zu-Küche-Bestellkette, Stammgast-CRM (Bella-Card) und Chef-Dashboard — für zwei Berliner Standorte, ohne Gast-Self-Service.

---

## Harte Constraints (nicht verhandeln ohne ADR)

- **Kein Gast-Self-Service.** Reservierungen und Bestellungen laufen immer über Mitarbeiter.
- **Standort ist der zentrale Anker.** Tischnummern, Speisekarten, Reservierungen, Auslastung — alles hängt am Standort. Tisch 4 Kreuzberg ≠ Tisch 4 Spandau.
- **Gast-Datensatz ist standortübergreifend.** Ein Gast, beide Häuser; Wiedererkennung per Telefonnummer.
- **Grillgerichte nur Kreuzberg.** Spandau hat baulich keinen Grill (Business Rule #8).
- **Bella-Card ab 10 Besuchen, 15 % auf alles** (inkl. Getränke, beide Standorte).
- **Rollen:** Chef sieht alles · Manager nur seinen Standort + Speisekarten-Pflege · Bedienung nur Bestellungen + Reservierungen.
- **v1 first.** Keine v2-Features bauen — was in `docs/backlog.md` als v2 steht, bleibt draußen.

---

## Aktuelle Phase

`BEREIT ZUM BAUEN` — Anforderungsmodell abgeschlossen, Tech-Stack entschieden (ADR-005: Next.js + SQLite/Prisma), Backlog in 3 Phasen strukturiert.

Nächster Schritt: BV-001 bauen (Gäste anlegen + Telefonnummer-Suche)

---

## Offene Technikfragen (vor dem Bau klären)

1. **TSE-Kasse** — v1-Annahme: App erzeugt Rechnung, direkte TSE-Kopplung ist v2 (ADR-004).
2. **Offline-Verhalten** — Läuft Bestellaufnahme bei WLAN-Ausfall weiter? (Nicht geklärt.)
3. **DSGVO** — Einwilligung + Aufbewahrungsfristen für Gast-Telefonnummern.
4. **Trinkgeld-Schlüssel** — Verteilung nach Umsatz, Gleich, oder pro Tisch? (Nur „Chef bestätigt" ist fix.)

---

## Session-Workflow

1. Lies CLAUDE.md + relevante Abschnitte in `docs/`
2. Plane → baue → halte Entscheidungen sofort in `docs/decisions.md` fest
3. Features nach Fertigstellung in `docs/backlog.md` als `✓` markieren

---

## Konventionen

- **Sprache:** Alles auf Deutsch — Docs, Commits, Kommentare (Ausnahme: Code-Bezeichner Englisch)
- **Commits:** Conventional Commits — `feat:`, `fix:`, `docs:`, `refactor:`
- **Keine externen Tools:** Markdown + Git sind die einzige Quelle der Wahrheit
- **Artefakte > Meetings:** Entscheidungen gelten erst, wenn sie in `docs/decisions.md` stehen
