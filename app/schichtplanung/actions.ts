"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// BV-103: Schichtplanung
export async function schichtEintragen(formData: FormData) {
  const mitarbeiter_id = parseInt(formData.get("mitarbeiter_id") as string, 10);
  const standort_id = parseInt(formData.get("standort_id") as string, 10);
  const datum = formData.get("datum") as string;
  const von = formData.get("von") as string;
  const bis = formData.get("bis") as string;
  const einspring_flag = formData.get("einspring_flag") === "on";

  if (!mitarbeiter_id || !standort_id || !datum || !von || !bis) {
    redirect("/schichtplanung?error=pflichtfelder");
  }

  await db.schicht.create({
    data: {
      mitarbeiter_id,
      standort_id,
      datum: new Date(datum),
      von,
      bis,
      einspring_flag,
    },
  });

  revalidatePath("/schichtplanung");
  redirect("/schichtplanung");
}

export async function schichtEntfernen(id: number) {
  await db.schicht.delete({ where: { id } });
  revalidatePath("/schichtplanung");
  redirect("/schichtplanung");
}
