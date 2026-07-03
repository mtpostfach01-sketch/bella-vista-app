# Bella Vista App

Interne Restaurantverwaltung für Bella Vista (Standorte Kreuzberg & Spandau, Berlin).  
Digitale Reservierungsverwaltung, Tisch-zu-Küche-Bestellkette, Stammgast-CRM und Chef-Dashboard.

**Kurs:** Smart Applications SB52.2 · HTW Berlin · Prof. Dr.-Ing. Jacek Zawisza · SoSe 2026  
**Entwicklerin:** Marie Tewes

---

## KI-Tool & Modell

Dieses Projekt wird mit **Claude Code** (Anthropic) entwickelt.  
Modell: `claude-sonnet-4-6`

---

## Voraussetzungen

- Node.js ≥ 20
- npm ≥ 10

## Setup

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Datenbank initialisieren
npx prisma generate
npx prisma db push

# 3. Entwicklungsserver starten
npm run dev
```

App läuft dann auf `http://localhost:3000`.

---

## Projektstruktur

```
bella-vista-app/
├── prisma/schema.prisma   # Datenmodell (SQLite)
├── app/                   # Next.js App Router
├── docs/
│   ├── spec.md            # Anforderungsmodell (Grundlage)
│   ├── backlog.md         # Feature-Register mit IDs
│   ├── decisions.md       # Architekturentscheidungen (ADRs)
│   └── architecture.md   # Stack & Datenmodell
└── CLAUDE.md              # Agent-Briefing
```

## Stack

| Schicht | Technologie |
|---------|-------------|
| Framework | Next.js (App Router) |
| Datenbank | SQLite via Prisma |
| Sprache | TypeScript |
