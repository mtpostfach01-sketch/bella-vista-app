"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function wartelisteEintragen(formData: FormData) {
  const gast_id = parseInt(formData.get("gast_id") as string, 10);
  const standort_id = parseInt(formData.get("standort_id") as string, 10);
  const gewuenschte_personenzahl = parseInt(
    formData.get("gewuenschte_personenzahl") as string,
    10
  );
  const notiz = (formData.get("notiz") as string)?.trim() || null;

  if (!gast_id || !standort_id || !gewuenschte_personenzahl) {
    redirect("/reservierungen/warteliste?error=pflichtfelder");
  }

  await db.warteliste.create({
    data: {
      gast_id,
      standort_id,
      gewuenschte_personenzahl,
      notiz,
    },
  });

  revalidatePath("/reservierungen/warteliste");
  redirect("/reservierungen/warteliste");
}

export async function wartelisteEntfernen(id: number) {
  await db.warteliste.delete({ where: { id } });
  revalidatePath("/reservierungen/warteliste");
  redirect("/reservierungen/warteliste");
}
