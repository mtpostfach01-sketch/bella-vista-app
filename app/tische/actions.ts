"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function tischAnlegen(formData: FormData) {
  const nummer = parseInt(formData.get("nummer") as string, 10);
  const kapazitaet = parseInt(formData.get("kapazitaet") as string, 10);
  const status = (formData.get("status") as string) || "FREI";
  const bereich_id = parseInt(formData.get("bereich_id") as string, 10);
  const standort_id = parseInt(formData.get("standort_id") as string, 10);

  await db.tisch.create({
    data: { nummer, kapazitaet, status, bereich_id, standort_id },
  });

  revalidatePath("/tische");
  redirect("/tische");
}

export async function tischBearbeiten(id: number, formData: FormData) {
  const nummer = parseInt(formData.get("nummer") as string, 10);
  const kapazitaet = parseInt(formData.get("kapazitaet") as string, 10);
  const status = (formData.get("status") as string) || "FREI";
  const bereich_id = parseInt(formData.get("bereich_id") as string, 10);
  const standort_id = parseInt(formData.get("standort_id") as string, 10);

  await db.tisch.update({
    where: { id },
    data: { nummer, kapazitaet, status, bereich_id, standort_id },
  });

  revalidatePath("/tische");
  redirect("/tische");
}
