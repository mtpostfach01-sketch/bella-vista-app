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
`gericht.ist_grillgericht && standort.name === "Spandau"`. Konkretes
Beispiel im Demo-Datensatz: „Bistecca alla Fiorentina" (Gericht-ID 8,
`ist_grillgericht = true`) existiert ausschließlich in der Kreuzberger
Speisekarte — die Spandauer Karte enthält keine einzige Grillposition,
weil sie beim Seeding gar nicht erst angelegt wurde.

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
keine Kategorie-Ausnahme im Code. Konkreter Beleg im Demo-Datensatz: Gast
„Klaus Bergmann" (12 Besuche, `bella_card = true`) hat eine Rechnung mit
2× Spaghetti Carbonara (14 €), 1× Hausrotwein (5,50 €), 2× Tiramisu
(6,50 €) = 46,50 € Zwischensumme, davon inkl. Getränk & Dessert 15 %
abgezogen → `gesamt_betrag = 39,53 €`, `bella_card_rabatt = true`
(nachvollziehbar unter `/gaeste/2` bzw. in der Rechnung zu seiner
Bestellung #2).

---

### 3. Datenmodell (n:m) — Bestellung ↔ Gericht

**Aussage:** Bestellung und Gericht stehen in einer echten n:m-Beziehung,
aufgelöst über die Verbindungsentität `Bestellposition` mit den
Beziehungsattributen Menge und (historisch fixiertem) Einzelpreis.

**Konfidenz:** 10/10

**Wie geprüft?** `prisma/schema.prisma` direkt gelesen: `Bestellposition`
trägt sowohl `bestellung_id` als auch `gericht_id` als Fremdschlüssel plus
die Zusatzattribute `menge` und `einzelpreis` — klassische
n:m-Auflösung mit Beziehungsattributen. Im Demo-Datensatz z. B.
Bestellung #2 (Bergmann, Tisch 4): drei Bestellpositionen verweisen auf
drei verschiedene Gerichte (Spaghetti Carbonara, Hausrotwein, Tiramisu),
jede mit eigener Menge und zum Bestellzeitpunkt fixiertem Einzelpreis —
dasselbe Gericht taucht umgekehrt in mehreren Bestellungen auf (z. B.
Lasagne al Forno sowohl in Bestellung #3 als auch im Speisekarten-Seed).

---

### 4. Widerspruchsauflösung — W9 (Catering-Auftrag → Bestellung)

**Aussage:** Ein bestätigter Catering-Auftrag (Statuswechsel
ANGEBOT → BESTAETIGT) erzeugt automatisch genau eine Bestellung mit
`bestellart = "CATERING"` und identischen Positionen (Preis-Snapshot zum
Bestätigungszeitpunkt) — Catering ist damit kein Parallelkonzept zur
normalen Bestellung, sondern erzeugt eine.

**Konfidenz:** 10/10

**Wie geprüft?** Live gegen die echte Datenbank getestet und im
Demo-Datensatz nachvollziehbar: Catering-Auftrag #1 für den Firmenkunden
„TechCorp" (Status `BESTAETIGT`, sichtbar unter `/catering/1`) hat genau
eine zugehörige Bestellung #1 mit `bestellart = "CATERING"` und
`catering_auftrag_id = 1` erzeugt — beide Datensätze sind über
`/catering/1` bzw. `/bestellungen/1` im laufenden System einsehbar.

---

### 5. Frei — Trinkgeld-Verteilschlüssel

**Aussage:** Der Trinkgeld-Vorschlag verteilt den Tages-Topf eines
Standorts nicht gleichmäßig, sondern proportional zum durch die
Bestellungen erzielten Umsatz pro Mitarbeiter — der Chef sieht den
Vorschlag vorausgefüllt, kann aber jeden Betrag vor dem Bestätigen frei
überschreiben.

**Konfidenz:** 9/10

**Wie geprüft?** Live gegen den Demo-Datensatz getestet: An einem Tag in
Kreuzberg gibt es zwei bezahlte Rechnungen — Marco Ferretti bediente eine
Bestellung mit 250 € Umsatz (15,50 € Trinkgeld), Thomas Schmidt eine mit
39,53 € Umsatz (4,50 € Trinkgeld). `/trinkgeld?standort_id=1` zeigt einen
Topf von 20,00 € und schlägt die Aufteilung exakt proportional zum jeweils
erzielten Umsatz vor (Marco ≈ 17,27 €, Schmidt ≈ 2,73 €) — beide Beträge
bleiben in editierbaren `<input>`-Feldern (`betrag_<mitarbeiter_id>`)
überschreibbar, bevor die Bestätigungs-Action greift.
