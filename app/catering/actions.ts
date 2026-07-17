"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAktiverMitarbeiter } from "@/lib/session";

// BV-104: Catering-Auftrag anlegen (Firmenkunde neu oder bestehend)
export async function cateringAuftragAnlegen(formData: FormData) {
  const standort_id = parseInt(formData.get("standort_id") as string, 10);
  const event_datum = formData.get("event_datum") as string;
  const lieferadresse = (formData.get("lieferadresse") as string)?.trim();

  const firmenkunde_id_raw = formData.get("firmenkunde_id") as string;
  const neuer_firmenkunde_name = (formData.get("neuer_firmenkunde_name") as string)?.trim();

  if (!standort_id || !event_datum || !lieferadresse) {
    redirect("/catering/neu?error=pflichtfelder");
  }
  if (!firmenkunde_id_raw && !neuer_firmenkunde_name) {
    redirect("/catering/neu?error=firmenkunde_fehlt");
  }

  let firmenkunde_id: number;
  if (firmenkunde_id_raw) {
    firmenkunde_id = parseInt(firmenkunde_id_raw, 10);
  } else {
    const ansprechpartner = (formData.get("neuer_firmenkunde_ansprechpartner") as string)?.trim() || "";
    const telefon = (formData.get("neuer_firmenkunde_telefon") as string)?.trim() || "";
    const firmenkunde = await db.firmenkunde.create({
      data: { name: neuer_firmenkunde_name, ansprechpartner, telefon },
    });
    firmenkunde_id = firmenkunde.id;
  }

  const gericht_ids = formData.getAll("gericht_id").map((v) => parseInt(v as string, 10));
  const mengen = formData.getAll("menge").map((v) => parseInt(v as string, 10));
  const positionen = gericht_ids
    .map((gericht_id, i) => ({ gericht_id, menge: mengen[i] ?? 0 }))
    .filter((p) => p.menge > 0);

  if (positionen.length === 0) {
    redirect("/catering/neu?error=keine_positionen");
  }

  const auftrag = await db.cateringAuftrag.create({
    data: {
      firmenkunde_id,
      standort_id,
      event_datum: new Date(event_datum),
      lieferadresse,
      positionen: { create: positionen },
    },
  });

  revalidatePath("/catering");
  redirect(`/catering/${auftrag.id}`);
}

// W9: Bestätigter Catering-Auftrag erzeugt eine Bestellung (bestellart=CATERING)
export async function cateringAuftragBestaetigen(id: number) {
  const auftrag = await db.cateringAuftrag.findUnique({
    where: { id },
    include: { positionen: { include: { gericht: true } } },
  });
  if (!auftrag) redirect("/catering?error=nicht_gefunden");

  const aktiver = await getAktiverMitarbeiter();
  if (!aktiver) redirect("/?error=keine_session");

  await db.cateringAuftrag.update({
    where: { id },
    data: { status: "BESTAETIGT" },
  });

  const bestellung = await db.bestellung.create({
    data: {
      bestellart: "CATERING",
      standort_id: auftrag!.standort_id,
      mitarbeiter_id: aktiver.id,
      catering_auftrag_id: auftrag!.id,
      status: "OFFEN",
      positionen: {
        create: auftrag!.positionen.map((p) => ({
          gericht_id: p.gericht_id,
          menge: p.menge,
          einzelpreis: p.gericht.preis,
          status: "OFFEN",
        })),
      },
    },
  });

  await db.kuechenauftrag.create({
    data: { bestellung_id: bestellung.id, status: "OFFEN" },
  });

  revalidatePath("/catering");
  revalidatePath(`/catering/${id}`);
  redirect(`/catering/${id}`);
}

export async function cateringAuftragStornieren(id: number) {
  await db.cateringAuftrag.update({ where: { id }, data: { status: "STORNIERT" } });
  revalidatePath("/catering");
  redirect("/catering");
}
