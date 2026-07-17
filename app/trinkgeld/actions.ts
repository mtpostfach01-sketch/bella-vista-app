"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// BV-103: Trinkgeld-Vorschlag — Chef bestätigt/korrigiert (BR #20, "letztes Wort")
export async function trinkgeldBestaetigen(formData: FormData) {
  const datum = formData.get("datum") as string;
  const standort_id = parseInt(formData.get("standort_id") as string, 10);

  const eintraege: { mitarbeiter_id: number; betrag: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("betrag_")) {
      const mitarbeiter_id = parseInt(key.replace("betrag_", ""), 10);
      const betrag = parseFloat(value as string);
      if (betrag > 0) eintraege.push({ mitarbeiter_id, betrag });
    }
  }

  if (!datum || !standort_id || eintraege.length === 0) {
    redirect(
      `/trinkgeld?error=pflichtfelder&datum=${datum}&standort_id=${standort_id}`
    );
  }

  await db.trinkgeldverteilung.createMany({
    data: eintraege.map((e) => ({
      datum: new Date(datum),
      standort_id,
      mitarbeiter_id: e.mitarbeiter_id,
      betrag: e.betrag,
    })),
  });

  revalidatePath("/trinkgeld");
  redirect(
    `/trinkgeld?bestaetigt=1&datum=${datum}&standort_id=${standort_id}`
  );
}
