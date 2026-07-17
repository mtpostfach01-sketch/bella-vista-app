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

---

## ADR-006: Bella-Card als Felder auf Gast statt eigene Entität

**Status:** Akzeptiert  
**Datum:** 2026-07-03

### Kontext

spec.md (§2, Entität #16) beschreibt die Bella-Card als eigenständige Entität mit Attributen (Kartennummer, Ausstellungsdatum, Status). Eine eigene Tabelle würde eine 1:1-Beziehung zu Gast erzeugen.

### Entscheidung

Die Bella-Card wird nicht als separate Entität modelliert, sondern als zwei Felder direkt auf dem Gast-Datensatz:
- `bella_card Boolean` — ob Karte aktiv
- `besuchsanzahl Int` — Besuchszähler für automatische Aktivierung

### Begründung

Die einzigen Operationen auf der Bella-Card sind: Prüfen ob aktiv (bei Rechnungsstellung) und automatisches Aktivieren bei Besuch #10. Eine eigene Entität würde für diese zwei einfachen Felder unnötige JOIN-Komplexität erzeugen. Kartennummer und Ausstellungsdatum werden im internen System nicht benötigt (keine Druckfunktion geplant, TSE-Kassenkopplung in v2 zurückgestellt per ADR-004).

### Konsequenzen

- Einfachere Abfragen (kein JOIN)
- Bella-Card-Status ist direkt auf dem Gast-Objekt verfügbar
- Falls v2 Druckkarten erfordert: Migration zu eigener Entität nötig (ADR-004 prüfen)

---

## ADR-007 — TSE-Anbindung als Stub (ergänzt ADR-004)

**Status:** Entschieden (Juli 2026)
**Kontext:** BV-108 wurde nachträglich aus dem v2-Backlog gezogen. ADR-004
hält weiterhin fest, dass v1 keine Annahmen über die echte TSE-Schnittstelle
trifft — diese ist unbekannt, Marco selbst kann sie nicht spezifizieren
(„das ist euer Bereich, ich bin Koch, kein Informatiker").

**Entscheidung:** `Rechnung` bekommt zwei Felder (`tse_uebermittelt`,
`tse_uebermittlungszeitpunkt`) und einen manuellen Button „Als an TSE
übermittelt markieren". Es findet **kein** echter Netzwerkaufruf, keine
TSE-Bibliothek und keine Annahme über Protokoll/Datenformat der echten Kasse
statt — reiner Statusmarker im Datenmodell.

**Begründung:** Ohne reale Schnittstellen-Dokumentation wäre jede
„Integration" eine unbegründete Annahme (widerspräche ADR-004). Ein
Statusmarker zeigt das Konzept im Datenmodell, ohne eine Anbindung
vorzutäuschen, die nicht existiert.

**Konsequenz:** ADR-004 bleibt in der Sache gültig (keine echte Kopplung in
v1). Die echte TSE-Integration ist weiterhin offen und wird in v2 mit
konkreter Schnittstellen-Doku geklärt.

---

## ADR-008 — Trinkgeld-Verteilschlüssel: proportional zum Umsatz

**Status:** Entschieden (Juli 2026)
**Kontext:** `SPEC.md` §6, offene Frage 4 („Trinkgeld-Verteilschlüssel —
wie genau wird aufgeteilt?") war zum Zeitpunkt von ADR-005 noch nicht
festgelegt, nur „Chef bestätigt" (BR #20).

**Entscheidung:** Der Trinkgeld-Topf eines Abends/Standorts (Summe
`Rechnung.trinkgeld`) wird als Vorschlag proportional zum durch die
Bestellungen erzielten Umsatz pro Mitarbeiter (`Bestellung.mitarbeiter_id` →
`Rechnung.gesamt_betrag`) verteilt. Der Chef sieht den Vorschlag, kann jeden
Betrag manuell überschreiben und bestätigt final (`Trinkgeldverteilung`).

**Begründung:** Interview, Marcos eigenes Beispiel: „Wenn die App sagt
‚Schmidt hat heute Abend Tisch 3, 5 und 7 bedient, Gesamtumsatz soundso' —
dann kann ich fair aufteilen. Automatisch berechnen, ja, aber ich will das
letzte Wort haben."

**Konsequenz:** Neues Modell `Trinkgeldverteilung` speichert nur das
bestätigte Ergebnis, nicht den Berechnungsweg — der Vorschlag wird bei jedem
Aufruf neu aus den Rohdaten berechnet (kein gespeicherter Zwischenstand).

---

## ADR-009 — Konsistente Standort-Gruppierung in Listenansichten

**Status:** Entschieden (Juli 2026)
**Kontext:** ADR-001 legt fest, dass Standort der primäre Anker fast aller
Daten ist. In der Praxis zeigten `/reservierungen`, `/bestellungen` und
`/mitarbeiter` aber eine einzige gemischte Liste beider Standorte (nur
`/tische` war schon nach Standort gruppiert) — genau der Überblicksverlust,
den Marco im Interview beschreibt („weiß manchmal selbst nicht mehr genau,
wer gerade wo ist").

**Entscheidung:** Alle standortgebundenen Listenansichten zeigen durchgängig
getrennte „Kreuzberg" / „Spandau"-Abschnitte (Muster von `/tische`
übernommen), statt einer chronologisch gemischten Liste. Datensätze, die
laut ADR-003 tatsächlich standortübergreifend sind (Gast, sowie Mitarbeiter
mit `standort_id = null`, i. d. R. der Chef), werden bewusst **nicht** in
eine Standort-Gruppe gezwungen — Mitarbeiter bekommt dafür eine eigene
Sektion „Alle Standorte".

**Begründung:** Setzt ADR-001 konsequent in der UI um, statt es nur beim
Datenmodell zu belassen. Vermeidet, dass Chef/Manager Kreuzberg- und
Spandau-Einträge manuell im Kopf sortieren müssen.

**Konsequenz:** Neue standortgebundene Listenseiten sollten künftig
standardmäßig nach diesem Muster (`db.standort.findMany({ include: {...} })`
+ Gruppen-Header) aufgebaut werden, nicht als ungruppierter `findMany` auf
der Kind-Entität.

---

## ADR-010 — Passwort-Pflicht statt reiner Mitarbeiterauswahl

**Status:** Entschieden (Juli 2026)
**Kontext:** ADR-005 ließ die Auth-Strategie bewusst offen. In v1 genügte
eine reine Namensauswahl ohne Passwort, um sich als Mitarbeiter anzumelden
(BV-016). Das bedeutete: jede Bedienung konnte sich ohne jede Hürde als
Chef ausgeben und hatte damit vollen Zugriff — die Rollenrechte griffen
nur, solange sich niemand einfach als jemand anderes auswählte.

**Entscheidung:** `Mitarbeiter` bekommt ein `passwort_hash`-Feld
(Node-`crypto.scryptSync`, Salt+Hash, kein externes Package). Anlegen und
Bearbeiten verlangen/erlauben ein Passwort (`lib/passwort.ts`). Der Login
(`sessionSetzen`) prüft es, bevor die Session-Cookies gesetzt werden.
`proxy.ts` leitet ohne gültige Session konsequent auf `/` um — einzige
Ausnahme bleibt `/mitarbeiter/neu` (Bootstrap, sonst könnte nie ein erster
Mitarbeiter angelegt werden, um sich überhaupt einzuloggen).

**Begründung:** Ohne Passwort war BV-016 (Rollenbasierter Zugriff) in der
Praxis wirkungslos, da die "Anmeldung" keine echte Hürde war.

**Konsequenz:** Kein next-auth/OAuth — bewusst die einfachste Lösung, die
das eigentliche Problem (Rollen-Mogeln) behebt, ohne die Architektur zu
verkomplizieren. Vorhandene Demo-Mitarbeiter wurden nachträglich mit dem
Passwort `bellavista` versehen (siehe README).
