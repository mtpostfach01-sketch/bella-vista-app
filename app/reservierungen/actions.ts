"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function reservierungAnlegen(formData: FormData) {
  const gast_id = parseInt(formData.get("gast_id") as string, 10);
  const standort_id = parseInt(formData.get("standort_id") as string, 10);
  const tisch_id_raw = formData.get("tisch_id") as string;
  const tisch_id = tisch_id_raw ? parseInt(tisch_id_raw, 10) : null;
  const datum = formData.get("datum") as string;
  const uhrzeit = formData.get("uhrzeit") as string;
  const personenanzahl = parseInt(formData.get("personenanzahl") as string, 10);
  const notiz = (formData.get("notiz") as string)?.trim() || null;

  const datum_uhrzeit = new Date(`${datum}T${uhrzeit}:00`);

  await db.reservierung.create({
    data: {
      gast_id,
      standort_id,
      tisch_id,
      datum_uhrzeit,
      personenanzahl,
      notiz,
      status: "BESTAETIGT",
    },
  });

  revalidatePath("/reservierungen");
  redirect("/reservierungen");
}

export async function reservierungBearbeiten(id: number, formData: FormData) {
  const standort_id = parseInt(formData.get("standort_id") as string, 10);
  const tisch_id_raw = formData.get("tisch_id") as string;
  const tisch_id = tisch_id_raw ? parseInt(tisch_id_raw, 10) : null;
  const datum = formData.get("datum") as string;
  const uhrzeit = formData.get("uhrzeit") as string;
  const personenanzahl = parseInt(formData.get("personenanzahl") as string, 10);
  const notiz = (formData.get("notiz") as string)?.trim() || null;
  const status = formData.get("status") as string;

  const datum_uhrzeit = new Date(`${datum}T${uhrzeit}:00`);

  await db.reservierung.update({
    where: { id },
    data: {
      standort_id,
      tisch_id,
      datum_uhrzeit,
      personenanzahl,
      notiz,
      status,
    },
  });

  revalidatePath("/reservierungen");
  redirect("/reservierungen");
}
