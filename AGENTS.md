<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Bella Vista App — Projekt-Vertrag

Interne Restaurantverwaltung für Bella Vista (Standorte Kreuzberg & Spandau).
Kurs Smart Applications SB52.2, HTW Berlin, Prof. Dr.-Ing. Jacek Zawisza.
Solo-Projekt, Methodik nach [modus-operandi](https://github.com/jacekzawisza/modus-operandi).

## Wo was steht

| Datei | Inhalt |
|---|---|
| `docs/spec.md` | Anforderungsmodell — Entitäten, Beziehungen, Business Rules, aufgelöste Widersprüche. Quelle der Wahrheit für "was die App können muss". |
| `docs/architecture.md` | Tech-Stack, Datenmodell-Überblick, Architekturprinzipien. |
| `docs/decisions.md` | ADR-Log (append-only). Jede Architekturentscheidung ein Eintrag, nie stillschweigend geändert. |
| `docs/backlog.md` | Feature-Register mit stabilen IDs (BV-xxx), Phase, Status. |
| `KALIBRIERUNG.md` | 5 geprüfte Aussagen zur App für die Kalibrierungs-Bewertung. |
| `prisma/schema.prisma` | Autoritative Implementierung des Datenmodells — bei Abweichung von `spec.md` gilt das Schema. |

## Stack (ADR-005)

Next.js (App Router) · SQLite via Prisma · TypeScript · Tailwind CSS · Server Actions statt separates API-Layer.

## Kernprinzipien

1. **Standort-ID als Pflichtparameter** (ADR-001) — Tische, Reservierungen, Bestellungen, Speisekarten immer mit `standort_id`. Tischnummern sind nur innerhalb eines Standorts eindeutig.
2. **Gast-Datensatz global** (ADR-003) — kein standortgebundener Fremdschlüssel; Wiedererkennung per Telefonnummer.
3. **Kein Gast-Self-Service** (ADR-002) — alle Eingaben laufen über eingeloggte Mitarbeiter, kein öffentliches Frontend.
4. **Prisma Schema First** — Datenmodell zuerst, dann Migration, dann UI.
5. **Business Rules server-seitig** — in Server Actions, nie nur im Client geprüft.
6. **Rollenbasierter Zugriff** (BV-016, ADR-010) — Chef sieht beide Standorte, Manager nur seinen, Bedienung keine Speisekarten-Pflege. Login erfordert Passwort (`lib/passwort.ts`), `proxy.ts` erzwingt die Session.

## Workflow

Ein Feature = ein Commit mit Backlog-ID (`feat: BV-xxx ...`). Vor jedem Commit: `docs/decisions.md` bei neuen Architekturentscheidungen ergänzen, `docs/backlog.md`-Status aktualisieren. Kein einzelner "Final"-Commit — die Commit-Historie ist die Doku des Vorgehens.
