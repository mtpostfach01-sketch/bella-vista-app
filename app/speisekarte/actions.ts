"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── Speisekarte auto-erstellen oder holen ────────────────────
async function getOrCreateSpeisekarte(standort_id: number) {
  return db.speisekarte.upsert({
    where: { standort_id },
    update: {},
    create: { standort_id },
  });
}

// ─── Kategorie anlegen ────────────────────────────────────────
export async function kategorieAnlegen(formData: FormData) {
  const standort_id = parseInt(formData.get("standort_id") as string, 10);
  const name = (formData.get("name") as string).trim();

  const karte = await getOrCreateSpeisekarte(standort_id);

  await db.kategorie.create({
    data: { name, speisekarte_id: karte.id },
  });

  revalidatePath("/speisekarte");
  redirect("/speisekarte");
}

// ─── Gericht anlegen ─────────────────────────────────────────
export async function gerichtAnlegen(formData: FormData) {
  const kategorie_id = parseInt(formData.get("kategorie_id") as string, 10);
  const name = (formData.get("name") as string).trim();
  const beschreibung = (formData.get("beschreibung") as string)?.trim() || null;
  const preis = parseFloat(formData.get("preis") as string);
  const verfuegbar = formData.get("verfuegbar") === "true";
  const ist_grillgericht = formData.get("ist_grillgericht") === "on";
  const allergen_ids = formData.getAll("allergen_ids").map((v) => parseInt(v as string, 10));

  const gericht = await db.gericht.create({
    data: {
      name,
      beschreibung,
      preis,
      verfuegbar,
      ist_grillgericht,
      kategorie_id,
    },
  });

  if (allergen_ids.length > 0) {
    await db.gerichtAllergen.createMany({
      data: allergen_ids.map((allergen_id) => ({
        gericht_id: gericht.id,
        allergen_id,
      })),
    });
  }

  revalidatePath("/speisekarte");
  redirect("/speisekarte");
}

// ─── Gericht bearbeiten ───────────────────────────────────────
export async function gerichtBearbeiten(id: number, formData: FormData) {
  const name = (formData.get("name") as string).trim();
  const beschreibung = (formData.get("beschreibung") as string)?.trim() || null;
  const preis = parseFloat(formData.get("preis") as string);
  const verfuegbar = formData.get("verfuegbar") === "true";
  const ist_grillgericht = formData.get("ist_grillgericht") === "on";
  const kategorie_id = parseInt(formData.get("kategorie_id") as string, 10);
  const allergen_ids = formData.getAll("allergen_ids").map((v) => parseInt(v as string, 10));

  await db.gericht.update({
    where: { id },
    data: {
      name,
      beschreibung,
      preis,
      verfuegbar,
      ist_grillgericht,
      kategorie_id,
    },
  });

  // Allergene neu setzen
  await db.gerichtAllergen.deleteMany({ where: { gericht_id: id } });
  if (allergen_ids.length > 0) {
    await db.gerichtAllergen.createMany({
      data: allergen_ids.map((allergen_id) => ({
        gericht_id: id,
        allergen_id,
      })),
    });
  }

  revalidatePath("/speisekarte");
  redirect("/speisekarte");
}
