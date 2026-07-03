"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function bestellungAnlegen(formData: FormData) {
  const tisch_id = parseInt(formData.get("tisch_id") as string, 10);
  const mitarbeiter_id = parseInt(formData.get("mitarbeiter_id") as string, 10);
  const standort_id = parseInt(formData.get("standort_id") as string, 10);

  // Positionen aus FormData lesen (gericht_id[] + menge[] + notiz[])
  const gericht_ids = formData.getAll("gericht_id").map((v) => parseInt(v as string, 10));
  const mengen = formData.getAll("menge").map((v) => parseInt(v as string, 10));
  const notizen = formData.getAll("pos_notiz").map((v) => (v as string).trim() || null);

  const bestellung = await db.bestellung.create({
    data: {
      tisch_id,
      mitarbeiter_id,
      standort_id,
      status: "OFFEN",
      positionen: {
        create: gericht_ids.map((gericht_id, i) => ({
          gericht_id,
          menge: mengen[i] ?? 1,
          notiz: notizen[i] ?? null,
          status: "OFFEN",
        })),
      },
    },
  });

  // Küchenauftrag direkt erstellen
  await db.kuechenauftrag.create({
    data: {
      bestellung_id: bestellung.id,
      status: "OFFEN",
    },
  });

  revalidatePath("/bestellungen");
  redirect(`/bestellungen/${bestellung.id}`);
}

export async function positionHinzufuegen(bestellung_id: number, formData: FormData) {
  const gericht_id = parseInt(formData.get("gericht_id") as string, 10);
  const menge = parseInt(formData.get("menge") as string, 10);
  const notiz = (formData.get("notiz") as string)?.trim() || null;

  await db.bestellposition.create({
    data: { bestellung_id, gericht_id, menge, notiz, status: "OFFEN" },
  });

  revalidatePath(`/bestellungen/${bestellung_id}`);
  redirect(`/bestellungen/${bestellung_id}`);
}

export async function bestellungStatusAendern(id: number, formData: FormData) {
  const status = formData.get("status") as string;

  await db.bestellung.update({ where: { id }, data: { status } });

  revalidatePath("/bestellungen");
  redirect("/bestellungen");
}
