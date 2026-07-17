# Bella Vista App

Interne Restaurantverwaltung für Bella Vista (Standorte Kreuzberg & Spandau, Berlin).  
Digitale Reservierungsverwaltung, Tisch-zu-Küche-Bestellkette, Stammgast-CRM (Bella-Card) und Chef-Dashboard.

**Kurs:** Smart Applications SB52.2 · HTW Berlin · Prof. Dr.-Ing. Jacek Zawisza · SoSe 2026  
**Entwicklerin:** Marie Tewes

---

## KI-Tool & Modell

Dieses Projekt wurde mit **Claude Code** (Anthropic) entwickelt.  
Modelle: `claude-sonnet-4-6` (Grundgerüst, Phase 1–3) und `claude-sonnet-5` (v2-Features, Design, Bugfixes)

---

## Voraussetzungen

- Node.js ≥ 20
- npm ≥ 10

## Setup (einmalig)

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Datenbank erstellen
npx prisma db push

# 3. Stammdaten laden (Standorte, Bereiche, Allergene)
npx prisma db seed
```

## App starten

```bash
npm run dev
```

App läuft auf `http://localhost:3000`.

**Erster Schritt nach dem Start:** Auf der Startseite einen Mitarbeiter anlegen (`/mitarbeiter/neu`) und dann über das Auswahl-Widget anmelden.

---

## Projektstruktur

```
bella-vista-app/
├── prisma/
│   ├── schema.prisma      # Datenmodell (25 Modelle, SQLite)
│   └── seed.ts            # Stammdaten: Standorte, Bereiche, Allergene
├── app/                   # Next.js App Router
│   ├── gaeste/            # BV-001 Gäste-CRUD
│   ├── tische/            # BV-002 Tische je Standort
│   ├── reservierungen/    # BV-003 Reservierungen + BV-102 Warteliste
│   ├── speisekarte/       # BV-004 Gerichte & Allergene + BV-105 Gruppenmenüs + BV-109 Fotos
│   ├── bestellungen/      # BV-005/006/107 Bestellungen, Abholung & Rechnung
│   ├── catering/          # BV-104 Catering-Modul (Firmenkunden, Aufträge)
│   ├── schichtplanung/    # BV-103 Schichtplanung
│   ├── trinkgeld/         # BV-103 Trinkgeld-Vorschlag
│   ├── erinnerungen/      # BV-101 SMS-Erinnerung (simuliert)
│   ├── mitarbeiter/       # BV-007 Mitarbeiter & Rollen
│   └── dashboard/         # BV-017/106 Chef-Dashboard & Kennzahlen
├── lib/
│   ├── db.ts              # Prisma-Singleton
│   ├── session.ts         # Cookie-Session (aktiver Mitarbeiter)
│   └── oeffnungszeiten.ts # BR #9/#10: Öffnungszeiten-Hilfsfunktionen
├── proxy.ts                # BV-016: Rollenbasiertes Routen-Gating (Next.js 16, ehem. middleware.ts)
├── docs/
│   ├── spec.md            # Anforderungsmodell (25 Entitäten, 23 Business Rules, 9 Widersprüche)
│   ├── backlog.md         # Feature-Register BV-001–BV-109 (alle Phasen abgeschlossen)
│   ├── decisions.md       # Architekturentscheidungen (ADR-001–ADR-008)
│   └── architecture.md   # Stack & Datenmodell
├── KALIBRIERUNG.md         # 5 geprüfte Aussagen zur App (Kalibrierungs-Bewertung)
└── CLAUDE.md              # Agent-Briefing
```

---

## Stack

| Schicht | Technologie |
|---------|-------------|
| Framework | Next.js 16 (App Router) |
| Datenbank | SQLite via Prisma v5 |
| Sprache | TypeScript |
| Styling | Tailwind CSS |
| Backend | Server Actions (kein separates API-Layer) |

---

## Rollen & Zugriff

| Rolle | Zugriff |
|-------|---------|
| CHEF | Alle Seiten, alle Standorte |
| MANAGER | Nur eigener Standort + Speisekartenpflege |
| BEDIENUNG | Nur Bestellungen, Reservierungen, Gäste, Tische |

Anmeldung: Startseite → Mitarbeiter auswählen (kein Passwort, interne App).

---

## Implementierte Business Rules

| BR | Regel |
|----|-------|
| #3–5 | Bella-Card ab 10 Besuchen, 15% Rabatt |
| #6 | Gruppenmenü-Vorschlag ab 8 Personen |
| #7 | Gruppenbereich nur Kreuzberg |
| #8 | Grillgerichte nur Kreuzberg |
| #9–10 | Öffnungszeiten standortspezifisch (KB: Di–So 12–15+18–23 Uhr / SP: Mi–So 17–22 Uhr) |
| #11–12 | Bestelländerung nur vor Küchenstart, Getränke jederzeit |
| #13 | Ausverkauft-Toggle sofort sichtbar |
| #14–15 | No-Show nach 20 Min, Tisch → FREI |
| #16–17 | Keine Doppelbelegung (±2h Zeitfenster) |
| #20 | Trinkgeld-Vorschlag proportional zum Umsatz, Chef bestätigt |
| #21 | Rollenbasierter Zugriff |
| #22 | SMS-Erinnerung am Vortag (simuliert) |
| #23 | Anzahlung bei Gruppen optional/fallweise |

Alle 23 Business Rules aus `docs/spec.md` §3 sind implementiert.
