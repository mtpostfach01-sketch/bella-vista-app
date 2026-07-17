# architecture.md — Tech-Stack & Datenmodell

_Wird mit jeder Architekturentscheidung ergänzt. Entscheidungslog: `docs/decisions.md`._

---

## Stack (ADR-005)

| Schicht | Wahl | Begründung |
|---------|------|------------|
| **Framework** | Next.js (App Router) | React-basiert, Server Actions für Backend-Logik, gute Agent-Unterstützung |
| **Datenbank** | SQLite | Zero Setup, eine Datei, lokal sofort lauffähig, kein Server-Dienst |
| **ORM** | Prisma | Migrations, typsicher, Wechsel zu PostgreSQL später mit einer Zeile möglich |
| **Auth** | Noch offen | Session-based (z. B. next-auth) — vor BV-016 klären |
| **Hosting** | Lokal (v1) | Kein Deployment für v1; lokale Abnahme |

---

## Projektstruktur (geplant)

```
bella-vista-app/
├── prisma/
│   └── schema.prisma        # Wahrheitsquelle Datenmodell
├── app/                     # Next.js App Router
│   ├── (auth)/              # Login / Session
│   ├── reservierungen/
│   ├── bestellungen/
│   ├── speisekarte/
│   ├── gaeste/
│   └── dashboard/
├── lib/
│   └── db.ts                # Prisma Client Singleton
├── docs/
└── CLAUDE.md
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
