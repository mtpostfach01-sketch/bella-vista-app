"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function gastAnlegen(formData: FormData) {
  const vorname = (formData.get("vorname") as string).trim();
  const nachname = (formData.get("nachname") as string).trim();
  const telefon = (formData.get("telefon") as string).trim();
  const email = (formData.get("email") as string | null)?.trim() || null;
  const lieblingstisch = (formData.get("lieblingstisch") as string | null)?.trim() || null;
  const notiz = (formData.get("notiz") as string | null)?.trim() || null;

  await db.gast.create({
    data: { vorname, nachname, telefon, email, lieblingstisch, notiz },
  });

  revalidatePath("/gaeste");
  redirect("/gaeste");
}

export async function gastBearbeiten(id: number, formData: FormData) {
  const vorname = (formData.get("vorname") as string).trim();
  const nachname = (formData.get("nachname") as string).trim();
  const telefon = (formData.get("telefon") as string).trim();
  const email = (formData.get("email") as string | null)?.trim() || null;
  const lieblingstisch = (formData.get("lieblingstisch") as string | null)?.trim() || null;
  const notiz = (formData.get("notiz") as string | null)?.trim() || null;

  await db.gast.update({
    where: { id },
    data: { vorname, nachname, telefon, email, lieblingstisch, notiz },
  });

  revalidatePath("/gaeste");
  redirect("/gaeste");
}
