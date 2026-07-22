import { PrismaClient } from "@prisma/client";
import { passwortHashen } from "../lib/passwort";

const db = new PrismaClient();

async function main() {
  // ─── Standorte ────────────────────────────────────────────
  const kreuzberg = await db.standort.upsert({
    where: { name: "Kreuzberg" },
    update: {},
    create: { name: "Kreuzberg", adresse: "Bergmannstraße 12, 10961 Berlin" },
  });

  const spandau = await db.standort.upsert({
    where: { name: "Spandau" },
    update: {},
    create: { name: "Spandau", adresse: "Breite Straße 8, 13597 Berlin" },
  });

  // ─── Bereiche Kreuzberg ───────────────────────────────────
  const bereiche_kb = ["Innenraum", "Terrasse", "Gruppenbereich"];
  const bereichMapKb = new Map<string, number>();
  for (const name of bereiche_kb) {
    let bereich = await db.bereich.findFirst({
      where: { name, standort_id: kreuzberg.id },
    });
    if (!bereich) {
      bereich = await db.bereich.create({
        data: { name, standort_id: kreuzberg.id },
      });
    }
    bereichMapKb.set(name, bereich.id);
  }

  // ─── Bereiche Spandau ─────────────────────────────────────
  const bereiche_sp = ["Innenraum", "Terrasse"];
  const bereichMapSp = new Map<string, number>();
  for (const name of bereiche_sp) {
    let bereich = await db.bereich.findFirst({
      where: { name, standort_id: spandau.id },
    });
    if (!bereich) {
      bereich = await db.bereich.create({
        data: { name, standort_id: spandau.id },
      });
    }
    bereichMapSp.set(name, bereich.id);
  }

  // ─── Allergene (EU-Standard A–P) ──────────────────────────
  const allergene = [
    { kuerzel: "A", name: "Gluten" },
    { kuerzel: "B", name: "Krebstiere" },
    { kuerzel: "C", name: "Eier" },
    { kuerzel: "D", name: "Fisch" },
    { kuerzel: "E", name: "Erdnüsse" },
    { kuerzel: "F", name: "Soja" },
    { kuerzel: "G", name: "Milch/Laktose" },
    { kuerzel: "H", name: "Schalenfrüchte (Nüsse)" },
    { kuerzel: "L", name: "Sellerie" },
    { kuerzel: "M", name: "Senf" },
    { kuerzel: "N", name: "Sesam" },
    { kuerzel: "O", name: "Schwefeldioxid/Sulfite" },
    { kuerzel: "P", name: "Lupinen" },
    { kuerzel: "R", name: "Weichtiere" },
  ];
  for (const allergen of allergene) {
    await db.allergen.upsert({
      where: { kuerzel: allergen.kuerzel },
      update: {},
      create: allergen,
    });
  }

  // ─── Tische ───────────────────────────────────────────────
  const tischeKb = [
    { nummer: 1, kapazitaet: 2, bereich: "Innenraum" },
    { nummer: 2, kapazitaet: 2, bereich: "Innenraum" },
    { nummer: 3, kapazitaet: 4, bereich: "Innenraum" },
    { nummer: 4, kapazitaet: 4, bereich: "Innenraum" },
    { nummer: 5, kapazitaet: 4, bereich: "Terrasse" },
    { nummer: 6, kapazitaet: 6, bereich: "Innenraum" },
    { nummer: 7, kapazitaet: 8, bereich: "Gruppenbereich" },
  ];
  for (const t of tischeKb) {
    await db.tisch.upsert({
      where: { nummer_standort_id: { nummer: t.nummer, standort_id: kreuzberg.id } },
      update: {},
      create: {
        nummer: t.nummer,
        kapazitaet: t.kapazitaet,
        standort_id: kreuzberg.id,
        bereich_id: bereichMapKb.get(t.bereich)!,
      },
    });
  }

  const tischeSp = [
    { nummer: 1, kapazitaet: 2, bereich: "Innenraum" },
    { nummer: 2, kapazitaet: 4, bereich: "Innenraum" },
    { nummer: 3, kapazitaet: 4, bereich: "Innenraum" },
    { nummer: 4, kapazitaet: 4, bereich: "Terrasse" },
  ];
  for (const t of tischeSp) {
    await db.tisch.upsert({
      where: { nummer_standort_id: { nummer: t.nummer, standort_id: spandau.id } },
      update: {},
      create: {
        nummer: t.nummer,
        kapazitaet: t.kapazitaet,
        standort_id: spandau.id,
        bereich_id: bereichMapSp.get(t.bereich)!,
      },
    });
  }

  // ─── Mitarbeiter (Standard-Passwort "bellavista", siehe README) ──
  const marco = await db.mitarbeiter.upsert({
    where: { email: "marco.ferretti@bellavista.de" },
    update: {},
    create: {
      vorname: "Marco",
      nachname: "Ferretti",
      email: "marco.ferretti@bellavista.de",
      rolle: "CHEF",
      standort_id: null,
      passwort_hash: passwortHashen("bellavista"),
    },
  });

  const schmidt = await db.mitarbeiter.upsert({
    where: { email: "thomas.schmidt@bellavista.de" },
    update: {},
    create: {
      vorname: "Thomas",
      nachname: "Schmidt",
      email: "thomas.schmidt@bellavista.de",
      rolle: "BEDIENUNG",
      standort_id: kreuzberg.id,
      passwort_hash: passwortHashen("bellavista"),
    },
  });

  // ─── Speisekarten + Kategorien + Gerichte ──────────────────
  // Reihenfolge ist bewusst so gewählt, dass "Bistecca alla Fiorentina"
  // exakt Gericht-ID 8 bekommt (siehe KALIBRIERUNG.md Aussage 1).
  const speisekarteKb = await db.speisekarte.upsert({
    where: { standort_id: kreuzberg.id },
    update: {},
    create: { standort_id: kreuzberg.id },
  });
  const speisekarteSp = await db.speisekarte.upsert({
    where: { standort_id: spandau.id },
    update: {},
    create: { standort_id: spandau.id },
  });

  const bereitsGeseedet = await db.kategorie.findFirst({
    where: { speisekarte_id: speisekarteKb.id },
  });

  let bistecca: { id: number } | null = null;
  let carbonaraKb: { id: number } | null = null;
  let lasagneKb: { id: number } | null = null;
  let tiramisuKb: { id: number } | null = null;
  let hausrotweinKb: { id: number } | null = null;

  if (!bereitsGeseedet) {
    const vorspeisenKb = await db.kategorie.create({
      data: { name: "Vorspeisen", speisekarte_id: speisekarteKb.id },
    });
    const hauptgaengeKb = await db.kategorie.create({
      data: { name: "Hauptgänge", speisekarte_id: speisekarteKb.id },
    });
    const dessertsKb = await db.kategorie.create({
      data: { name: "Desserts", speisekarte_id: speisekarteKb.id },
    });
    const getraenkeKb = await db.kategorie.create({
      data: { name: "Getränke", speisekarte_id: speisekarteKb.id },
    });

    await db.gericht.create({
      data: { name: "Bruschetta al Pomodoro", preis: 6.5, kategorie_id: vorspeisenKb.id },
    }); // Gericht-ID 1
    await db.gericht.create({
      data: { name: "Caprese", preis: 7.5, kategorie_id: vorspeisenKb.id },
    }); // 2
    carbonaraKb = await db.gericht.create({
      data: { name: "Spaghetti Carbonara", preis: 14.0, kategorie_id: hauptgaengeKb.id },
    }); // 3
    lasagneKb = await db.gericht.create({
      data: { name: "Lasagne al Forno", preis: 13.5, kategorie_id: hauptgaengeKb.id },
    }); // 4
    tiramisuKb = await db.gericht.create({
      data: { name: "Tiramisu", preis: 6.5, kategorie_id: dessertsKb.id },
    }); // 5
    await db.gericht.create({
      data: { name: "Panna Cotta", preis: 6.0, kategorie_id: dessertsKb.id },
    }); // 6
    hausrotweinKb = await db.gericht.create({
      data: { name: "Hausrotwein (0,2l)", preis: 5.5, kategorie_id: getraenkeKb.id },
    }); // 7
    bistecca = await db.gericht.create({
      data: {
        name: "Bistecca alla Fiorentina",
        preis: 34.0,
        kategorie_id: hauptgaengeKb.id,
        ist_grillgericht: true, // BR #8: nur Kreuzberg, Spandau hat baulich keinen Grill
      },
    }); // 8 — siehe KALIBRIERUNG.md Aussage 1

    // Spandau: identische Grundkarte, aber bewusst OHNE Grillgerichte —
    // die Speisekarte hat keine eigene Kategorie/kein Gericht mit
    // ist_grillgericht = true (KALIBRIERUNG.md Aussage 1).
    const vorspeisenSp = await db.kategorie.create({
      data: { name: "Vorspeisen", speisekarte_id: speisekarteSp.id },
    });
    const hauptgaengeSp = await db.kategorie.create({
      data: { name: "Hauptgänge", speisekarte_id: speisekarteSp.id },
    });
    const dessertsSp = await db.kategorie.create({
      data: { name: "Desserts", speisekarte_id: speisekarteSp.id },
    });
    const getraenkeSp = await db.kategorie.create({
      data: { name: "Getränke", speisekarte_id: speisekarteSp.id },
    });
    await db.gericht.create({
      data: { name: "Bruschetta al Pomodoro", preis: 6.5, kategorie_id: vorspeisenSp.id },
    });
    await db.gericht.create({
      data: { name: "Caprese", preis: 7.5, kategorie_id: vorspeisenSp.id },
    });
    await db.gericht.create({
      data: { name: "Spaghetti Carbonara", preis: 14.0, kategorie_id: hauptgaengeSp.id },
    });
    await db.gericht.create({
      data: { name: "Lasagne al Forno", preis: 13.5, kategorie_id: hauptgaengeSp.id },
    });
    await db.gericht.create({
      data: { name: "Tiramisu", preis: 6.5, kategorie_id: dessertsSp.id },
    });
    await db.gericht.create({
      data: { name: "Hausrotwein (0,2l)", preis: 5.5, kategorie_id: getraenkeSp.id },
    });
  }

  // ─── Kalibrierungs-Demodaten ────────────────────────────────
  // Reproduziert exakt die Beispiele aus KALIBRIERUNG.md (Gast-ID,
  // Bestellungs-ID, Beträge). Läuft nur einmal (Guard auf Bergmanns
  // Telefonnummer), damit `npx prisma db seed` idempotent bleibt.
  const bergmannTelefon = "+49 30 555 0102";
  const bereitsVorhanden = await db.gast.findUnique({
    where: { telefon: bergmannTelefon },
  });

  if (!bereitsVorhanden && carbonaraKb && lasagneKb && tiramisuKb && hausrotweinKb && bistecca) {
    // Gast-ID 1 (Füllgast vor Bergmann, damit Bergmann exakt ID 2 bekommt)
    await db.gast.create({
      data: {
        vorname: "Lena",
        nachname: "Hoffmann",
        telefon: "+49 30 555 0101",
        besuchsanzahl: 2,
      },
    });

    // Gast-ID 2 — siehe KALIBRIERUNG.md Aussage 2 & 3 (/gaeste/2)
    const bergmann = await db.gast.create({
      data: {
        vorname: "Klaus",
        nachname: "Bergmann",
        telefon: bergmannTelefon,
        besuchsanzahl: 12,
        bella_card: true,
      },
    });

    const tisch4Kb = await db.tisch.findUniqueOrThrow({
      where: { nummer_standort_id: { nummer: 4, standort_id: kreuzberg.id } },
    });
    const tisch6Kb = await db.tisch.findUniqueOrThrow({
      where: { nummer_standort_id: { nummer: 6, standort_id: kreuzberg.id } },
    });

    // ─── Firmenkunde + Catering-Auftrag (W9) ───────────────────
    const techcorp = await db.firmenkunde.create({
      data: {
        name: "TechCorp GmbH",
        ansprechpartner: "Julia Neumann",
        telefon: "030 1234567",
      },
    });

    const cateringAuftrag = await db.cateringAuftrag.create({
      data: {
        firmenkunde_id: techcorp.id,
        standort_id: kreuzberg.id,
        event_datum: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        lieferadresse: "TechCorp GmbH, Torstraße 1, 10119 Berlin",
        status: "ANGEBOT",
        positionen: {
          create: [
            { gericht_id: carbonaraKb.id, menge: 15 },
            { gericht_id: tiramisuKb.id, menge: 10 },
          ],
        },
      },
    }); // Catering-Auftrag-ID 1 — siehe KALIBRIERUNG.md Aussage 4 (/catering/1)

    // Bestätigen → erzeugt Bestellung mit bestellart = CATERING (W9-Logik
    // repliziert aus app/catering/actions.ts::cateringAuftragBestaetigen)
    const cateringPositionen = await db.cateringPosition.findMany({
      where: { catering_auftrag_id: cateringAuftrag.id },
      include: { gericht: true },
    });
    await db.cateringAuftrag.update({
      where: { id: cateringAuftrag.id },
      data: { status: "BESTAETIGT" },
    });
    const cateringBestellung = await db.bestellung.create({
      data: {
        bestellart: "CATERING",
        standort_id: kreuzberg.id,
        mitarbeiter_id: marco.id,
        catering_auftrag_id: cateringAuftrag.id,
        status: "OFFEN",
        positionen: {
          create: cateringPositionen.map((p) => ({
            gericht_id: p.gericht_id,
            menge: p.menge,
            einzelpreis: p.gericht.preis,
            status: "OFFEN",
          })),
        },
      },
    }); // Bestellung-ID 1
    await db.kuechenauftrag.create({
      data: { bestellung_id: cateringBestellung.id, status: "OFFEN" },
    });

    // ─── Bestellung #2 — Bergmann, Tisch 4, Bella-Card-Rabatt ──
    // siehe KALIBRIERUNG.md Aussage 2 & 3
    const bergmannBestellung = await db.bestellung.create({
      data: {
        bestellart: "TISCH",
        standort_id: kreuzberg.id,
        mitarbeiter_id: schmidt.id,
        tisch_id: tisch4Kb.id,
        status: "BEZAHLT",
        positionen: {
          create: [
            { gericht_id: carbonaraKb.id, menge: 2, einzelpreis: 14.0, status: "FERTIG" },
            { gericht_id: hausrotweinKb.id, menge: 1, einzelpreis: 5.5, status: "FERTIG" },
            { gericht_id: tiramisuKb.id, menge: 2, einzelpreis: 6.5, status: "FERTIG" },
          ],
        },
      },
    }); // Bestellung-ID 2 — Summe 46,50 € (2×14,00 + 1×5,50 + 2×6,50)
    await db.kuechenauftrag.create({
      data: { bestellung_id: bergmannBestellung.id, status: "FERTIG" },
    });
    await db.rechnung.create({
      data: {
        bestellung_id: bergmannBestellung.id,
        gast_id: bergmann.id,
        bella_card_rabatt: true,
        gesamt_betrag: 39.53, // Math.round(46.50 * 0.85 * 100) / 100
        trinkgeld: 4.5,
      },
    });

    // ─── Bestellung #3 — Marco, Tisch 6, kein Rabatt ───────────
    // siehe KALIBRIERUNG.md Aussage 5 (Trinkgeld-Vorschlag)
    const marcoBestellung = await db.bestellung.create({
      data: {
        bestellart: "TISCH",
        standort_id: kreuzberg.id,
        mitarbeiter_id: marco.id,
        tisch_id: tisch6Kb.id,
        status: "BEZAHLT",
        positionen: {
          create: [
            { gericht_id: bistecca.id, menge: 4, einzelpreis: 34.0, status: "FERTIG" },
            { gericht_id: lasagneKb.id, menge: 2, einzelpreis: 13.5, status: "FERTIG" },
            { gericht_id: hausrotweinKb.id, menge: 4, einzelpreis: 5.5, status: "FERTIG" },
          ],
        },
      },
    }); // Bestellung-ID 3 — Summe 185,00 € (4×34,00 + 2×13,50 + 4×5,50)
    await db.kuechenauftrag.create({
      data: { bestellung_id: marcoBestellung.id, status: "FERTIG" },
    });
    await db.rechnung.create({
      data: {
        bestellung_id: marcoBestellung.id,
        gast_id: null,
        bella_card_rabatt: false,
        gesamt_betrag: 185.0,
        trinkgeld: 12.0,
      },
    });
    // Trinkgeld-Topf Kreuzberg heute: 4,50 € + 12,00 € = 16,50 €.
    // Vorschlag proportional zum Umsatz (ADR-008):
    // Marco 185,00 € Umsatz → 13,60 € · Schmidt 39,53 € Umsatz → 2,90 €
    // (siehe /trinkgeld?standort_id=<Kreuzberg-ID>, KALIBRIERUNG.md Aussage 5)
  }

  console.log("Seed abgeschlossen:");
  console.log(`  Standort Kreuzberg (ID ${kreuzberg.id})`);
  console.log(`  Standort Spandau (ID ${spandau.id})`);
  console.log(`  ${bereiche_kb.length} Bereiche Kreuzberg, ${bereiche_sp.length} Bereiche Spandau`);
  console.log(`  ${tischeKb.length} Tische Kreuzberg, ${tischeSp.length} Tische Spandau`);
  console.log(`  ${allergene.length} Allergene`);
  console.log(`  Mitarbeiter: Marco Ferretti (CHEF), Thomas Schmidt (BEDIENUNG) — Passwort "bellavista"`);
  console.log(`  Speisekarten Kreuzberg (8 Gerichte inkl. Grill) & Spandau (6 Gerichte, kein Grill)`);
  console.log(`  Kalibrierungs-Demodaten: Gast #2 Bergmann, Catering-Auftrag #1 TechCorp, Bestellungen #1-3`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
