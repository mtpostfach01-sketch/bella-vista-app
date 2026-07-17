"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// BV-105: Gruppenmenü-Automatik (BR #6)
export async function gruppenmenueAnlegen(formData: FormData) {
  const standort_id = parseInt(formData.get("standort_id") as string, 10);
  const bezeichnung = (formData.get("bezeichnung") as string)?.trim();
  const fixpreis = parseFloat(formData.get("fixpreis") as string);
  const ab_personenzahl = parseInt(formData.get("ab_personenzahl") as string, 10) || 8;

  if (!standort_id || !bezeichnung || !fixpreis) {
    redirect("/speisekarte/gruppenmenues?error=pflichtfelder");
  }

  await db.gruppenmenue.create({
    data: { standort_id, bezeichnung, fixpreis, ab_personenzahl },
  });

  revalidatePath("/speisekarte/gruppenmenues");
  redirect("/speisekarte/gruppenmenues");
}

export async function gruppenmenueEntfernen(id: number) {
  await db.gruppenmenue.delete({ where: { id } });
  revalidatePath("/speisekarte/gruppenmenues");
  redirect("/speisekarte/gruppenmenues");
}
