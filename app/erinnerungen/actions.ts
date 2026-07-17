"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// BV-101: Simuliert den automatischen SMS-Versand (kein echtes Gateway
// angebunden — die App hat keinen Background-Job-Runner). Ein Klick markiert
// alle fälligen Erinnerungen als versendet, wie es ein Cron-Job täte.
export async function faelligeErinnerungenVersenden() {
  await db.erinnerung.updateMany({
    where: { status: "GEPLANT", versandzeitpunkt: { lte: new Date() } },
    data: { status: "VERSENDET" },
  });

  revalidatePath("/erinnerungen");
}
