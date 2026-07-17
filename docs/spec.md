# SPEC.md — Bella Vista App (v1)

**Kunde:** Marco Ferretti · Bella Vista (Standorte Kreuzberg & Spandau, Berlin)
**Grundlage:** Kundeninterview, 20 Fragen & Antworten (`KI-Kunde_Gespräch-final.docx`)
**Aufgabe:** Anforderungsmodell nach Briefing *SB52.2 — Anforderungsmodell* (HTW Berlin, Prof. Zawisza)
**Stand:** Juni 2026

---

## 0. Kontext & Ziel

Bella Vista führt zwei italienische Restaurants in Berlin (Kreuzberg = Stammhaus, Spandau). Der Alltag läuft heute über Zettel und ein Reservierungsbuch: Reservierungen telefonisch, Bestellungen handschriftlich an die Küche, Stammgäste „im Kopf" des Chefs. Die größten Schmerzpunkte sind **No-Shows**, **verlorene Bestellpositionen** und **kein zentraler Überblick über beide Standorte**.

Die App soll diese Abläufe intern digitalisieren, **ohne** den persönlichen, telefonischen Gastkontakt zu ersetzen.

### Scope-Abgrenzung

| Im Scope | Nicht im Scope |
|----------|----------------|
| Reservierungen (intern, telefonisch erfasst) | Online-Selbstreservierung durch Gäste |
| Bestellungen Vor-Ort + **Abholung** (als Bestellart) | Liefer-Service / Lieferando |
| Speisekarte je Standort, Tagesgerichte | Gast-Selbstbestellung am Tisch |
| Stammgast-/Bella-Card-System (CRM) | — |
| Gruppen/Feiern + Catering für Firmen | — |
| Schichtplanung + Trinkgeld-Vorschlag | — |
| Rechnung + Splitting; Dashboard/Kennzahlen | Automatische TSE-Kassenkopplung (offene Technikfrage) |

> **Hinweis Abholung:** Marco trackt Abholungen heute nicht („Freundschaftsdienst"). Da er aber Umsatz und beliebteste Gerichte auswerten will, werden Abholungen als **Bestellart** miterfasst (rein intern, kein Bestellservice nach außen) — sonst sind Umsatz und Statistik unvollständig (siehe Widerspruch W8).

---

## 1. Entitäten

### 1.1 Kern-Entitäten (Pflicht, 6–8 laut Briefing)

| # | Entität | Schlüssel | Wichtige Attribute |
|---|---------|-----------|--------------------|
| 1 | **Standort** | Standort-ID | Name, Stadtteil, Anzahl Plätze, Öffnungszeiten, Küchenschlusszeit, Grill (ja/nein) |
| 2 | **Gast** | Gast-ID | Name, Telefonnummer, Besuchsanzahl, Stammgaststatus, Lieblingstisch, Notiz |
| 3 | **Reservierung** | Res-ID | Datum, Uhrzeit, Personenzahl, Status, No-Show-Flag, Anlass, Allergie-Notiz, Gruppen-Flag |
| 4 | **Tisch** | Tisch-ID | Tischnummer (standortspezifisch), Kapazität, Standort-ID, Status, Bereich-ID |
| 5 | **Mitarbeiter** | MA-ID | Name, Rolle, Stammstandort, Schichtstatus |
| 6 | **Bestellung** | Best-ID | Zeitpunkt, **Bestellart** (Vor-Ort / Abholung / Catering), Status, Tisch-ID *(optional)*, MA-ID, Standort-ID, Abholname/Abholzeit *(bei Abholung)* |
| 7 | **Bestellposition** *(Verbindungsentität)* | Pos-ID | Bestell-ID, Gericht-ID, Menge, Sonderwunsch, Positionsstatus, Einzelpreis |
| 8 | **Gericht** | Gericht-ID | Name, Beschreibung, Kategorie-ID, Preis, Verfügbarkeit, Grillgericht (ja/nein) |

### 1.2 Erweiterte Entitäten (alle aus dem Interview belegt)

| # | Entität | Schlüssel | Wichtige Attribute |
|---|---------|-----------|--------------------|
| 9 | **Speisekarte** | Karten-ID | Standort-ID, Saison, Aktivstatus, gültig-ab |
| 10 | **Kategorie** | Kategorie-ID | Name (Vorspeisen, Hauptgänge, Desserts, Getränke) |
| 11 | **Allergen** | Allergen-ID | Bezeichnung |
| 12 | **Tagesgericht** | Tagesgericht-ID | Gericht-ID, Datum, Verfügbarkeit, Lieferant-Notiz |
| 13 | **Rechnung** | Rechnungs-ID | Bestell-ID, Gesamtbetrag, Trinkgeld, Zahlungsstatus, Zeitpunkt |
| 14 | **Zahlung / Teilrechnung** | Zahlungs-ID | Rechnungs-ID, Zahlart (bar/Karte), Betrag, Splitting-Anteil |
| 15 | **Küchenauftrag** | Küchenauftrag-ID | Bestell-ID, Status, Startzeit, Fertigzeit, Priorität |
| 16 | **Bella-Card** | Karten-ID | Gast-ID, Rabattwert (15 %), Aktivstatus, Erstellungsdatum |
| 17 | **Lieferant** | Lieferanten-ID | Name, Telefon, Lieferstatus |
| 18 | **Schicht** | Schicht-ID | MA-ID, Standort-ID, Datum, von–bis, Einspring-Flag |
| 19 | **Rolle / Berechtigung** | Rollen-ID | Bezeichnung (Chef / Manager / Bedienung), Rechteumfang |
| 20 | **Bereich** | Bereich-ID | Standort-ID, Name, für Gruppen reservierbar (ja/nein) |
| 21 | **Gruppenmenü** | Menü-ID | Standort-ID, Bezeichnung, Fixpreis, ab Personenzahl |
| 22 | **Catering-Auftrag** | Catering-ID | Firmenkunde-ID, Eventdatum, Menüauswahl, Lieferadresse, Status |
| 23 | **Firmenkunde** | Firmenkunde-ID | Name, Ansprechpartner, Telefon |
| 24 | **Erinnerung (SMS)** | Erinnerung-ID | Res-ID, Versandzeitpunkt, Status |
| 25 | **Warteliste** | Wartelisten-ID | Standort-ID, Datum, Gast/Telefon, Personenzahl, Reihenfolge |

---

## 2. Beziehungen

Briefing-Vorgabe: 6–9 Beziehungen, mind. 1× n:m. **Erfüllt:** 30 Beziehungen, davon **7 echte n:m**.

| # | Beziehung | Kardinalität | Hinweis |
|---|-----------|--------------|---------|
| 1 | Gast — macht — Reservierung | 1:n | |
| 2 | Tisch — belegt durch — Reservierung | 1:n | |
| 3 | Standort — besitzt — Tisch | 1:n | Tisch 4 KB ≠ Tisch 4 SP |
| 4 | Standort — hat — Bereich | 1:n | |
| 5 | Tisch — liegt in — Bereich | n:1 | |
| 6 | Standort — beschäftigt — Mitarbeiter | 1:n | Stammstandort |
| 7 | **Mitarbeiter — arbeitet/springt ein — Standort** | **n:m** | über Schicht; Bsp. Schmidt |
| 8 | Mitarbeiter — leistet — Schicht | 1:n | |
| 9 | Mitarbeiter — hat — Rolle | n:1 | |
| 10 | Standort — hat — Speisekarte | 1:n | je Saison |
| 11 | **Speisekarte — listet — Gericht** | **n:m** | |
| 12 | **Standort — bietet an — Gericht** | **n:m** | Grill nur Kreuzberg |
| 13 | Gericht — gehört zu — Kategorie | n:1 | |
| 14 | **Gericht — enthält — Allergen** | **n:m** | |
| 15 | Tisch — hat — Bestellung | **0:n** | 0, weil Abhol-/Catering-Bestellung keinen Tisch hat |
| 16 | Mitarbeiter — nimmt auf — Bestellung | 1:n | Basis Umsatz/Trinkgeld pro Kellner |
| 17 | **Bestellung — enthält — Gericht** | **n:m** | Attribute Menge/Sonderwunsch → Bestellposition |
| 18 | Bestellung — erzeugt — Rechnung | 1:1 | |
| 19 | Rechnung — aufgeteilt in — Zahlung | 1:n | Splitting |
| 20 | Küchenauftrag — bearbeitet — Bestellung | 1:1 | |
| 21 | Gast — besitzt — Bella-Card | 1:1 | |
| 22 | Gericht — angeboten als — Tagesgericht | 1:n | |
| 23 | Lieferant — liefert — Tagesgericht | 1:n | |
| 24 | Reservierung — nutzt — Gruppenmenü | n:1 | ab 8 Personen |
| 25 | Reservierung — löst aus — Erinnerung | 1:n | SMS Vortag |
| 26 | Reservierung — steht auf — Warteliste | n:1 | |
| 27 | Firmenkunde — beauftragt — Catering-Auftrag | 1:n | |
| 28 | **Catering-Auftrag — umfasst — Gericht** | **n:m** | |
| 29 | **Trinkgeld(-topf) pro Abend — verteilt auf — Mitarbeiter** | **n:m** | |
| 30 | Catering-Auftrag — erzeugt — Bestellung | 1:n | siehe Widerspruch W9 |

**Wichtigste n:m-Beziehung:** *Bestellung — enthält — Gericht* (#17), aufgelöst über die Verbindungsentität **Bestellposition** mit den Beziehungsattributen Menge und Sonderwunsch.

---

## 3. Business Rules

Briefing-Vorgabe: 4–5 Regeln. **Erfüllt:** 23 Regeln (Format „Wenn A, dann B").

1. **Pflichtfelder Reservierung** — Wenn eine Reservierung erstellt wird, dann müssen Name, Datum, Uhrzeit, Personenzahl und Telefonnummer vorhanden sein.
2. **Reservierungskanal** — Reservierungen werden nur telefonisch durch Mitarbeiter erfasst; keine Online-Selbstreservierung, keine Gast-Selbstbestellung.
3. **Stammgast-Schwelle** — Wenn ein Gast ≥ 10 Besuche erreicht, dann erhält er automatisch die Bella-Card.
4. **Rabatt-Umfang** — Wenn ein Gast eine aktive Bella-Card hat, dann gilt 15 % Rabatt auf die gesamte Rechnung inkl. Getränke, in beiden Standorten.
5. **Stammgast-Erkennung** — Wenn die Telefonnummer bereits existiert, dann wird der Gast standortübergreifend wiedererkannt.
6. **Gruppenmenü-Schwelle** — Wenn eine Reservierung ≥ 8 Personen umfasst, dann gilt das Gruppenmenü (fixe Preise) statt à la carte.
7. **Gruppenbereich** — Der separat reservierbare Gruppenbereich existiert nur in Kreuzberg.
8. **Grillgerichte** — Wenn Standort = Spandau, dann sind Grillgerichte nicht bestellbar (baulich kein Grill).
9. **Küchenschluss** — Wenn die aktuelle Uhrzeit nach der letzten Bestellzeit liegt (30 Min vor Schließung, z. B. KB 22:30), dann werden keine neuen Bestellungen mehr angenommen.
10. **Öffnungszeiten** — Außerhalb der Öffnungszeiten (KB Di–So 12–15 & 18–23 Uhr · SP Mi–So 17–22 Uhr · Montag Ruhetag beider Standorte) sind keine Reservierungen/Bestellungen möglich.
11. **Änderung nur vor Küchenstart** — Wenn der Bestellstatus = „in Küche" ist, dann darf eine Position nicht mehr gelöscht, sondern nur als „Änderung gewünscht" markiert werden.
12. **Getränke-Nachbestellung** — Getränke können jederzeit als neue Position ergänzt werden, auch nach Küchenstart.
13. **Ausverkauft** — Wenn ein Gericht als „ausverkauft" markiert ist, dann ist es nicht bestellbar; der Status ist sofort in beiden Standorten bei allen Kellnern sichtbar.
14. **No-Show** — Wenn die Reservierungszeit überschritten ist und der Gast nicht erschienen ist, dann wird die Reservierung automatisch als No-Show markiert.
15. **Tisch-Karenz** — Wenn ein Gast mehr als ~20 Minuten zu spät ist, dann darf der Tisch neu vergeben werden.
16. **Keine Doppelbelegung** — Wenn ein Tisch im Zeitraum bereits reserviert/belegt ist, dann darf keine zweite Reservierung angelegt werden.
17. **Standortspezifische Tischnummern** — Tischnummern sind je Standort eigenständig (Tisch 4 KB ≠ Tisch 4 SP).
18. **Rechnungs-Splitting** — Eine Bestellung kann in mehrere Teilrechnungen aufgeteilt werden (bar/Karte je Teil).
19. **Umsatz-/Trinkgeldzuordnung** — Jede Bestellung muss dem aufnehmenden Mitarbeiter zugeordnet sein.
20. **Trinkgeld-Vorschlag** — Das Trinkgeld pro Abend wird automatisch berechnet/vorgeschlagen; der Chef bestätigt (letztes Wort).
21. **Berechtigungen** — Chef sieht alles (beide Standorte, alle Zahlen); Manager nur seinen Standort + Speisekarten-Pflege; Bedienung nur Bestellungen + Reservierungen, keine Kartenänderung.
22. **SMS-Erinnerung** — Am Vortag einer Reservierung wird automatisch eine Erinnerungs-SMS versendet.
23. **Anzahlung optional** — Bei großen/fremden Gruppenreservierungen kann eine Anzahlung verlangt werden; die Entscheidung trifft der Wirt fallweise (nicht erzwungen).

---

## 4. Widersprüche (erkannt & aufgelöst)

Briefing-Vorgabe: 2 explizit aufgelöste Widersprüche. **Erfüllt:** 9.

**W1 — Telefonisch vs. digital.**
Aussage A: „Telefonisch, das ist unser Weg — und das will ich auch so behalten."
Aussage B: Wunsch nach zentraler digitaler Verwaltung, Überblick, digitaler Stammgasterkennung.
→ **Auflösung:** Keine Online-Selbstreservierung. Telefonische Dateneingabe durch Mitarbeiter; die interne Verwaltung ist vollständig digital.

**W2 — Standorte getrennt vs. zentral.**
A: „Im Alltag arbeiten die Standorte getrennt."
B: Wunsch nach Gesamt-Dashboard, standortübergreifenden Stammgästen, Personalwechsel.
→ **Auflösung:** Daten je Standort logisch getrennt, aber zentral synchronisiert. Ein Chef-Dashboard wechselt zwischen Kreuzberg und Spandau.

**W3 — Persönliches Erlebnis vs. Automatisierung.**
A: Italienische Gastfreundschaft, „kein Fast-Food-Laden", „kein Callcenter", Trinkgeld-„letztes Wort".
B: Starker Wunsch nach Digitalisierung/Automatisierung.
→ **Auflösung:** Automatisierung nur intern; Gastkontakt und Schlüsselentscheidungen (Warteliste anrufen, Trinkgeld) bleiben menschlich.

**W4 — Will Kennzahlen, hat aber keine Daten.**
A: „Ich habe keine Ahnung, wie viele No-Shows wir haben … keine genauen Zahlen", Besuche „im Kopf".
B: Will No-Show-Quote, Umsatz, beliebteste Gerichte sehen.
→ **Auflösung:** Kennzahlen entstehen erst durch konsequente digitale Erfassung; das Dashboard ist Ergebnis, nicht Voraussetzung.

**W5 — Reservierungen getrennt vs. Stammgast übergreifend.**
A: „Bei Reservierungen ist es komplett getrennt."
B: „Die Stammgäste sollten standortübergreifend erkannt werden."
→ **Auflösung:** Tische/Slots bleiben pro Standort getrennt; der Gast-Datensatz ist standortübergreifend (ein Gast, beide Häuser).

**W6 — Keine Lieferung vs. Catering mit Lieferadresse.**
A: „Lieferando? Nein danke … meine Pasta soll nicht kalt ankommen."
B: „Wir machen jetzt auch Catering … Eventdatum, Menüauswahl, Lieferadresse."
→ **Auflösung:** Restaurant-Lieferung bleibt außen vor; Catering ist ein separates Eventgeschäft (geplant, in Menge, mit Lieferadresse) — kein à-la-carte-Lieferdienst.

**W7 — Keine Anzahlung vs. No-Show-Schmerz bei Gruppen.**
A: „Anzahlung — ehrlich gesagt machen wir das nicht konsequent."
B: Fremde 15-Personen-Gruppe, die nicht erscheint, „das schmerzt".
→ **Auflösung:** Anzahlung als optionale Funktion pro Gruppenreservierung, vom Wirt fallweise aktivierbar.

**W8 — Abholung nicht tracken vs. korrekter Umsatz.**
A: „Das mit dem Abholen … das tracken wir gar nicht. Kein Thema für die App."
B: Will Umsatz und beliebteste Gerichte auswerten.
→ **Auflösung:** Abholungen werden als **Bestellart** miterfasst (rein intern, kein Bestellservice nach außen), damit Umsatz und Gericht-Statistik vollständig und korrekt sind.

**W9 — Catering als Bestellart vs. Catering als eigenes Event-Geschäft.**
A: Entität 6 (Bestellung) führt „Catering" als eine von drei Bestellarten (Vor-Ort / Abholung / Catering).
B: Marco beschreibt Catering wie ein eigenständiges Geschäftsfeld mit eigenem Ablauf: „Da muss ich Angebote schreiben und Aufträge irgendwo tracken … Firmenkunden, Eventdatum, Menüauswahl, Lieferadresse" (Interview, Zeile 178) — modelliert als eigene Entität **Catering-Auftrag** mit Firmenkunde-Bezug, nicht als Position an einem Tisch.
→ **Auflösung:** **Catering-Auftrag** ist die führende Entität für das Event-Geschäft (Angebot, Menüauswahl, Lieferadresse, Status). Bei Bestätigung erzeugt ein Catering-Auftrag optional eine oder mehrere **Bestellungen** mit Bestellart = Catering (für Küche/Rechnung/Kennzahlen) — die Beziehung Catering-Auftrag → Bestellung (1:n) wird in §2 ergänzt. „Catering" als Bestellart bleibt bestehen, ist aber ein Ergebnis des Catering-Auftrags, kein Parallelkonzept.

---

## 5. Prioritäten

Was muss in **v1** rein (löst die größten Schmerzpunkte: No-Shows, Zettelwirtschaft, fehlender Überblick), und was kann warten.

### Muss in v1 (Kernfunktionen)

| Funktion | Begründung (aus dem Interview) |
|----------|--------------------------------|
| Digitale Reservierungsverwaltung + Tischbelegung je Standort | „Die Zettelwirtschaft muss aufhören" — Hauptproblem |
| Zentrales Chef-Dashboard (Reservierungen heute, Auslastung je Standort) | „Ich will das morgens beim Kaffee auf dem Handy sehen" |
| Digitale Bestellaufnahme am Tisch → Küchenbildschirm | ersetzt verlorene Zettel; „Bestellung ist eine Liste" |
| Speisekarte je Standort + Live-„Ausverkauft"-Markierung | „das sehen dann sofort alle Kellner — Gold wert" |
| Stammgast-Erkennung (Telefon) + Bella-Card (ab 10 Besuche, 15 %) | „das muss in der App drin sein" |
| Automatische Rechnung + Splitting | „Rechnung automatisch raus, ohne Nachzählen" |
| No-Show-Erfassung | größtes Geldproblem, „nirgendwo sauber erfasst" |
| Rollen & Rechte (Chef / Manager / Bedienung) | „die Bedienung soll nicht an der Karte rumschrauben" |

### Kann warten (v2 / später)

| Funktion | Warum nachrangig |
|----------|------------------|
| SMS-Erinnerung am Vortag | sinnvoll gegen No-Shows, aber nicht überlebenswichtig für v1 |
| Warteliste für freie Tische | Marco noch unentschlossen, „schauen wir mal" |
| Schichtplanung + automatische Trinkgeld-Berechnung | „kompliziert", Chef will letztes Wort |
| Catering-Modul (Firmenkunden, Events) | neues Geschäftsfeld, eigene Logik |
| Gruppenmenü-Automatik ab 8 Pers. + optionale Anzahlung | Komfort, kein Tagesgeschäft |
| Erweiterte Kennzahlen (Umsatz/Kellner, Top-Gerichte über Zeit) | baut auf v1-Daten auf |
| Abholung als Bestellart | für korrekten Umsatz wichtig, aber klein — v1.5 |
| Gerichtsfotos, TSE-Kassenanbindung | „nice to have" bzw. offene Technikfrage |

---

## 6. Offene Fragen

Punkte, die im Interview nicht (abschließend) geklärt wurden und vor dem Bau zu klären sind.

1. **TSE-Kassenanbindung** — Soll die App an die bestehende TSE-Kasse andocken, oder erzeugt sie nur die Rechnung? (Marco: „das ist euer Bereich").
2. **Technik & Offline-Verhalten** — Wie zuverlässig ist das WLAN abends? Muss die Bestellaufnahme bei Netzausfall offline weiterlaufen? (im Interview nicht gefragt).
3. **Datenschutz / DSGVO** — Telefonnummern und Besuchshistorie werden gespeichert; Einwilligung der Gäste und Aufbewahrung sind zu klären.
4. **Trinkgeld-Verteilschlüssel** — Wie genau wird aufgeteilt (nach Umsatz, gleichmäßig, pro bedientem Tisch)? Nur „Chef bestätigt" ist festgelegt.
5. **Anzahlung bei Gruppen** — Höhe, ab welcher Personenzahl, erstattbar? Bisher „nicht konsequent".
6. **Warteliste-Ablauf** — Wer benachrichtigt den nächsten Gast (App per SMS oder Marco persönlich)? Noch offen.
7. **Mittagstisch Kreuzberg (12–15 Uhr)** — Eigener Reservierungs-/Bestellablauf oder identisch zum Abend?
8. **Mengengerüst** — Wie viele Reservierungen/Bestellungen pro Abend und Standort? (für Dimensionierung).

---

## 7. Status-Modelle & Architektur-Kern

**Status-Übergänge**

- **Bestellung:** offen → in Küche → fertig → serviert → bezahlt
- **Bestellposition:** hinzugefügt → geändert / storniert / nachbestellt
- **Tisch:** frei → reserviert → belegt → freigegeben / No-Show
- **Reservierung:** angelegt → bestätigt → erschienen / No-Show

**Durchgängiges Prinzip — Standortabhängigkeit:** Fast alle Daten hängen am Standort (Tische, Speisekarten, Mitarbeiter, Reservierungen, Auslastung). Tischnummern sind nur innerhalb eines Standorts eindeutig. Dies ist der zentrale Architekturpunkt der App.

**CRM-Modul (Stammgäste):** Telefonnummer → Besuchshistorie → Lieblingstisch → Bella-Card. Standortübergreifend, automatische Wiedererkennung bei Reservierung. Faktisch ein eigenes kleines Kundenbeziehungs-Modul.

**Offene Technikfrage:** Anbindung der vorhandenen TSE-Kasse. Annahme für v1: Die App erzeugt die Rechnung inkl. Splitting; eine direkte TSE-Kopplung wird später geklärt.




