# backlog.md — Feature-Register Bella Vista App

_Stabile IDs. Nie umbenennen — nur Status ändern oder neue Zeilen anfügen._
_Quelle: `SPEC.md` §3 Business Rules, §4 Widersprüche, §5 Prioritäten. Architektur: `docs/decisions.md`._

---

## Phase 1 — Skelett

Reines CRUD — Daten anlegen und speichern, keine Business-Rule-Prüfung.
Ziel: Die App läuft. Jede Entität existiert. Formulare funktionieren.

| ID | Feature | Entitäten | Status |
|---|---|---|---|
| BV-001 | Gast anlegen, per Telefonnummer suchen, bearbeiten (Name, Notiz, Lieblingstisch) | Gast | ☐ |
| BV-002 | Tische anlegen und verwalten je Standort (Nummer, Kapazität, Bereich, Status) | Tisch, Bereich, Standort | ☐ |
| BV-003 | Reservierung anlegen + Tisch manuell zuweisen (ohne Konfliktprüfung) | Reservierung, Tisch, Gast | ☐ |
| BV-004 | Speisekarte: Gerichte, Kategorien, Allergene anlegen je Standort (CRUD) | Speisekarte, Gericht, Kategorie, Allergen, Tagesgericht | ☐ |
| BV-005 | Bestellung aufnehmen am Tisch → Küchenauftrag erstellen (ohne Sperren) | Bestellung, Bestellposition, Küchenauftrag | ☐ |
| BV-006 | Rechnung erstellen + Splitting (bar / Karte je Teilrechnung, ohne Rabatt) | Rechnung, Zahlung | ☐ |
| BV-007 | Mitarbeiter anlegen + Rolle zuweisen (Stammdaten, ohne Zugriffsschutz) | Mitarbeiter, Rolle | ☐ |

---

## Phase 2 — Regeln

Business Rules auf dem Skelett — die App verhält sich korrekt.
Ziel: Alle 23 Business Rules aus `SPEC.md` §3 sind aktiv.

| ID | Feature | Business Rule | Status |
|---|---|---|---|
| BV-008 | Keine Doppelbelegung — Tisch + Zeitfenster-Konflikt prüfen | BR #16, #17 | ☐ |
| BV-009 | No-Show automatisch setzen + 20-Min-Tisch-Karenz | BR #14, #15 | ☐ |
| BV-010 | Bella-Card-Automatik — ab 10 Besuchen aktivieren, 15 % Rabatt auf Rechnung (inkl. Getränke, beide Standorte) | BR #3, #4, #5 | ☐ |
| BV-011 | Öffnungszeiten + Küchenschluss — neue Bestellungen + Reservierungen sperren | BR #9, #10 | ☐ |
| BV-012 | Grillgerichte in Spandau sperren (baulich kein Grill) | BR #8 | ☐ |
| BV-013 | Bestellstatus-Workflow: Änderung nur vor Küchenstart; Getränke jederzeit ergänzbar | BR #11, #12 | ☐ |
| BV-014 | Ausverkauft-Markierung sofort bei allen Kellnern sichtbar | BR #13 | ☐ |
| BV-015 | Gruppenbereich nur Kreuzberg buchbar | BR #7 | ☐ |
| BV-016 | Rollenbasierter Zugriff durchsetzen (Chef alles · Manager Standort + Karte · Bedienung Bestellungen + Res.) | BR #21 | ☐ |

---

## Phase 3 — Komfort

Übersichten, Automatisierungen und alles, was auf Phase-1-Daten aufbaut.

| ID | Feature | Abhängigkeit / Offene Frage | Status |
|---|---|---|---|
| BV-017 | Chef-Dashboard — Reservierungen heute + Auslastung je Standort (standortübergreifend) | ADR-001 · baut auf Phase 1+2 | ☐ |
| BV-101 | SMS-Erinnerung am Vortag einer Reservierung | BR #22 · extern: SMS-Provider · Benachrichtigungs-Ablauf offen | ☐ |
| BV-102 | Warteliste für freie Tische | BR #26 · Marco unentschlossen · Benachrichtigung offen | ☐ |
| BV-103 | Schichtplanung + automatischer Trinkgeld-Vorschlag (Chef bestätigt) | BR #20 · Verteilschlüssel offen (`SPEC.md` §6/4) | ☐ |
| BV-104 | Catering-Modul (Firmenkunden, Events, Lieferadresse) | W6 · Entitäten: Catering-Auftrag, Firmenkunde | ☐ |
| BV-105 | Gruppenmenü-Automatik ab 8 Personen + optionale Anzahlung | BR #6, #23 · Details offen (`SPEC.md` §6/5) | ☐ |
| BV-106 | Erweiterte Kennzahlen (Top-Gerichte, Umsatz/Kellner, No-Show-Quote) | Baut auf Phase-1-Daten auf | ☐ |
| BV-107 | Abholung als Bestellart (für korrekten Umsatz, W8) | Bestellart-Feld in Entität Bestellung | ☐ |
| BV-108 | TSE-Kassenanbindung | ADR-004 · Schnittstelle mit Marco / TSE-Hersteller klären | ☐ |
| BV-109 | Gerichtsfotos in der Speisekarte | Nice-to-have | ☐ |

---

## Legende

`☐` offen · `→` in Arbeit · `✓` abgeschlossen · `✗` verworfen
