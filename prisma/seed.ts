import { PrismaClient } from "@prisma/client";

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
  for (const name of bereiche_kb) {
    const existing = await db.bereich.findFirst({
      where: { name, standort_id: kreuzberg.id },
    });
    if (!existing) {
      await db.bereich.create({
        data: { name, standort_id: kreuzberg.id },
      });
    }
  }

  // ─── Bereiche Spandau ─────────────────────────────────────
  const bereiche_sp = ["Innenraum", "Terrasse"];
  for (const name of bereiche_sp) {
    const existing = await db.bereich.findFirst({
      where: { name, standort_id: spandau.id },
    });
    if (!existing) {
      await db.bereich.create({
        data: { name, standort_id: spandau.id },
      });
    }
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

  console.log("Seed abgeschlossen:");
  console.log(`  Standort Kreuzberg (ID ${kreuzberg.id})`);
  console.log(`  Standort Spandau (ID ${spandau.id})`);
  console.log(`  ${bereiche_kb.length} Bereiche Kreuzberg`);
  console.log(`  ${bereiche_sp.length} Bereiche Spandau`);
  console.log(`  ${allergene.length} Allergene`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
