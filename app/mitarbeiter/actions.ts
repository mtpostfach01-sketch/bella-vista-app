"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function mitarbeiterAnlegen(formData: FormData) {
  const vorname = (formData.get("vorname") as string).trim();
  const nachname = (formData.get("nachname") as string).trim();
  const email = (formData.get("email") as string).trim();
  const rolle = formData.get("rolle") as string;
  const standort_id_raw = formData.get("standort_id") as string;
  const standort_id =
    rolle === "CHEF" || !standort_id_raw ? null : parseInt(standort_id_raw, 10);

  await db.mitarbeiter.create({
    data: { vorname, nachname, email, rolle, standort_id },
  });

  revalidatePath("/mitarbeiter");
  redirect("/mitarbeiter");
}

export async function mitarbeiterBearbeiten(id: number, formData: FormData) {
  const vorname = (formData.get("vorname") as string).trim();
  const nachname = (formData.get("nachname") as string).trim();
  const email = (formData.get("email") as string).trim();
  const rolle = formData.get("rolle") as string;
  const standort_id_raw = formData.get("standort_id") as string;
  const standort_id =
    rolle === "CHEF" || !standort_id_raw ? null : parseInt(standort_id_raw, 10);

  await db.mitarbeiter.update({
    where: { id },
    data: { vorname, nachname, email, rolle, standort_id },
  });

  revalidatePath("/mitarbeiter");
  redirect("/mitarbeiter");
}
