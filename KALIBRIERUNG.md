# KALIBRIERUNG.md — Kennst du deine App?

5 Aussagen über die Bella Vista App, je 2 Punkte. Format: 2× Business Rule ·
1× Datenmodell (n:m) · 1× Widerspruchsauflösung · 1× frei.

---

### 1. Business Rule — Grillgerichte (BR #8)

**Aussage:** Ein Gericht mit `ist_grillgericht = true` ist am Standort
Spandau nicht bestellbar — weder bei einer neuen Bestellung noch beim
nachträglichen Hinzufügen einer Position zu einer bestehenden Bestellung.

**Konfidenz:** 9/10

**Wie geprüft?** Code-Review beider Prüfpunkte in
`app/bestellungen/actions.ts` (`bestellungAnlegen` Zeile 52,
`positionHinzufuegen` Zeile 123) — beide brechen mit
`redirect(...?error=grillgericht_spandau)` ab, sobald
`gericht.ist_grillgericht && standort.name === "Spandau"`.

---

### 2. Business Rule — Bella-Card-Rabatt (BR #3, #4)

**Aussage:** Ab dem 10. Besuch aktiviert die App die Bella-Card automatisch
und gewährt 15 % Rabatt auf die **gesamte** Rechnung inklusive Getränke,
standortübergreifend — es gibt keine Ausnahme für einzelne
Positionskategorien.

**Konfidenz:** 9/10

**Wie geprüft?** Code-Review `rechnungErstellen` in
`app/bestellungen/actions.ts` (Zeile 173–226): `besuchsanzahl >= 10` setzt
`bella_card = true` (Zeile 220–225); der Rabatt wird pauschal auf
`summe * 0.85` (Zeile 198–199, alle Positionen ungefiltert) berechnet,
keine Kategorie-Ausnahme im Code.

---

### 3. Datenmodell (n:m) — Bestellung ↔ Gericht

**Aussage:** Bestellung und Gericht stehen in einer echten n:m-Beziehung,
aufgelöst über die Verbindungsentität `Bestellposition` mit den
Beziehungsattributen Menge und (historisch fixiertem) Einzelpreis.

**Konfidenz:** 10/10

**Wie geprüft?** `prisma/schema.prisma` direkt gelesen: `Bestellposition`
trägt sowohl `bestellung_id` als auch `gericht_id` als Fremdschlüssel plus
die Zusatzattribute `menge` und `einzelpreis` — klassische
n:m-Auflösung mit Beziehungsattributen.

---

### 4. Widerspruchsauflösung — W9 (Catering-Auftrag → Bestellung)

**Aussage:** Ein bestätigter Catering-Auftrag (Statuswechsel
ANGEBOT → BESTAETIGT) erzeugt automatisch genau eine Bestellung mit
`bestellart = "CATERING"` und identischen Positionen (Preis-Snapshot zum
Bestätigungszeitpunkt) — Catering ist damit kein Parallelkonzept zur
normalen Bestellung, sondern erzeugt eine.

**Konfidenz:** 10/10

**Wie geprüft?** Live gegen die echte Datenbank getestet (Skript via
Prisma Client): CateringAuftrag mit einer Position angelegt, bestätigt,
und geprüft, dass genau eine `Bestellung` mit `bestellart = "CATERING"`
und derselben Positionsmenge entsteht.

---

### 5. Frei — Trinkgeld-Verteilschlüssel

**Aussage:** Der Trinkgeld-Vorschlag verteilt den Tages-Topf eines
Standorts nicht gleichmäßig, sondern proportional zum durch die
Bestellungen erzielten Umsatz pro Mitarbeiter — der Chef sieht den
Vorschlag vorausgefüllt, kann aber jeden Betrag vor dem Bestätigen frei
überschreiben.

**Konfidenz:** 9/10

**Wie geprüft?** Live getestet: Testrechnung mit 15,50 € Trinkgeld und
einem Mitarbeiter angelegt, `/trinkgeld` im Browser aufgerufen — Vorschlag
erschien korrekt vorausgefüllt in einem editierbaren `<input>`-Feld
(`betrag_<mitarbeiter_id>`), das die Bestätigungs-Action unverändert oder
überschrieben entgegennimmt.
