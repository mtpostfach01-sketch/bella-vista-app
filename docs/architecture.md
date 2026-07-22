# architecture.md — Tech-Stack & Datenmodell

_Wird mit jeder Architekturentscheidung ergänzt. Entscheidungslog: `docs/decisions.md`._

---

## Stack (ADR-005)

| Schicht | Wahl | Begründung |
|---------|------|------------|
| **Framework** | Next.js (App Router) | React-basiert, Server Actions für Backend-Logik, gute Agent-Unterstützung |
| **Datenbank** | SQLite | Zero Setup, eine Datei, lokal sofort lauffähig, kein Server-Dienst |
| **ORM** | Prisma | Migrations, typsicher, Wechsel zu PostgreSQL später mit einer Zeile möglich |
| **Auth** | Cookie-Session + Passwort (ADR-010) | Kein next-auth/OAuth — `passwort_hash` auf Mitarbeiter (Node `crypto.scryptSync`), `proxy.ts` erzwingt die Session app-weit (BV-016) |
| **Hosting** | Lokal (v1) | Kein Deployment für v1; lokale Abnahme |

---

## Projektstruktur (Stand: alle Phasen abgeschlossen)

Vollständige, aktuelle Struktur inkl. aller Module: siehe `README.md`
Abschnitt "Projektstruktur". Kurzüberblick:

```
bella-vista-app/
├── prisma/
│   ├── schema.prisma        # Wahrheitsquelle Datenmodell (25 Modelle)
│   └── seed.ts              # Stammdaten + Kalibrierungs-Demodaten
├── app/                     # Next.js App Router, ein Ordner je Modul
│   (gaeste, tische, reservierungen, speisekarte, bestellungen,
│    catering, schichtplanung, trinkgeld, erinnerungen, mitarbeiter,
│    dashboard)
├── lib/
│   ├── db.ts                # Prisma Client Singleton
│   ├── session.ts           # Cookie-Session (aktiver Mitarbeiter)
│   ├── passwort.ts          # Passwort-Hashing (ADR-010)
│   └── oeffnungszeiten.ts    # BR #9/#10
├── proxy.ts                 # Rollenbasiertes Routen-Gating (BV-016)
├── docs/
└── CLAUDE.md / AGENTS.md     # Projekt-Vertrag
```

---

## Datenmodell-Übersicht

Vollständige Entitäten und Beziehungen: `docs/spec.md` §1 & §2.
`prisma/schema.prisma` ist die autoritative Implementierung — bei Abweichungen gilt das Schema.

**Kern-Entitäten Phase 1:**
Standort · Gast · Tisch · Bereich · Reservierung · Speisekarte · Gericht · Kategorie · Allergen · Bestellung · Bestellposition · Küchenauftrag · Rechnung · Zahlung · Mitarbeiter · Rolle

**Erweiterte Entitäten (Phase 2+, alle implementiert):**
Bella-Card · Tagesgericht · Lieferant · Schicht · Erinnerung · Warteliste · Gruppenmenü · Catering-Auftrag · Firmenkunde

---

## Wichtigste Architekturprinzipien

1. **Standort-ID als Pflichtparameter** — Tische, Reservierungen, Bestellungen, Speisekarten immer mit `standort_id` (ADR-001)
2. **Gast-Datensatz global** — kein standortgebundener Fremdschlüssel; Wiedererkennung per Telefonnummer (ADR-003)
3. **Prisma Schema First** — Datenmodell zuerst, dann Migrationen, dann UI
4. **Server Actions statt separate API** — Business Rules laufen server-seitig, nie im Client
