"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { passwortHashen } from "@/lib/passwort";

export async function mitarbeiterAnlegen(formData: FormData) {
  const vorname = (formData.get("vorname") as string).trim();
  const nachname = (formData.get("nachname") as string).trim();
  const email = (formData.get("email") as string).trim();
  const rolle = formData.get("rolle") as string;
  const passwort = formData.get("passwort") as string;
  const standort_id_raw = formData.get("standort_id") as string;
  const standort_id =
    rolle === "CHEF" || !standort_id_raw ? null : parseInt(standort_id_raw, 10);

  // BV-016: ohne Passwort kein Zugang — verhindert Rollen-Mogeln
  if (!passwort || passwort.length < 4) {
    redirect("/mitarbeiter/neu?error=passwort_zu_kurz");
  }

  await db.mitarbeiter.create({
    data: {
      vorname,
      nachname,
      email,
      rolle,
      standort_id,
      passwort_hash: passwortHashen(passwort),
    },
  });

  revalidatePath("/mitarbeiter");
  redirect("/mitarbeiter");
}

export async function mitarbeiterBearbeiten(id: number, formData: FormData) {
  const vorname = (formData.get("vorname") as string).trim();
  const nachname = (formData.get("nachname") as string).trim();
  const email = (formData.get("email") as string).trim();
  const rolle = formData.get("rolle") as string;
  const neuesPasswort = (formData.get("passwort") as string)?.trim();
  const standort_id_raw = formData.get("standort_id") as string;
  const standort_id =
    rolle === "CHEF" || !standort_id_raw ? null : parseInt(standort_id_raw, 10);

  // Passwort nur ändern, wenn im Formular ausgefüllt (sonst bleibt es)
  if (neuesPasswort && neuesPasswort.length < 4) {
    redirect(`/mitarbeiter/${id}?error=passwort_zu_kurz`);
  }

  await db.mitarbeiter.update({
    where: { id },
    data: {
      vorname,
      nachname,
      email,
      rolle,
      standort_id,
      ...(neuesPasswort ? { passwort_hash: passwortHashen(neuesPasswort) } : {}),
    },
  });

  revalidatePath("/mitarbeiter");
  redirect("/mitarbeiter");
}
