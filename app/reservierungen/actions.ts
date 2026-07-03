"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { istEinlassMoeglich } from "@/lib/oeffnungszeiten";

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

  // BV-011: Öffnungszeiten — Letzter Einlass 22:00 Uhr
  if (!istEinlassMoeglich(datum_uhrzeit)) {
    redirect(
      `/reservierungen/neu?error=ausserhalb_oeffnungszeiten&datum=${datum}&uhrzeit=${uhrzeit}`
    );
  }

  if (tisch_id) {
    // BV-015: Gruppenbereich nur Kreuzberg
    const tisch = await db.tisch.findUnique({
      where: { id: tisch_id },
      include: { bereich: true, standort: true },
    });
    if (
      tisch?.bereich.name === "Gruppenbereich" &&
      tisch.standort.name === "Spandau"
    ) {
      redirect(
        `/reservierungen/neu?error=gruppenraum_spandau&datum=${datum}&uhrzeit=${uhrzeit}`
      );
    }

    // BV-008: Keine Doppelbelegung — Zeitfenster ±2 Stunden
    const konflikt = await db.reservierung.findFirst({
      where: {
        tisch_id,
        status: { notIn: ["STORNIERT", "NO_SHOW"] },
        datum_uhrzeit: {
          gte: new Date(datum_uhrzeit.getTime() - 2 * 60 * 60 * 1000),
          lte: new Date(datum_uhrzeit.getTime() + 2 * 60 * 60 * 1000),
        },
      },
    });
    if (konflikt) {
      redirect(
        `/reservierungen/neu?error=doppelbelegung&tisch_id=${tisch_id}&datum=${datum}&uhrzeit=${uhrzeit}`
      );
    }
  }

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

  // BV-011: Öffnungszeiten (nur bei aktiven Status prüfen)
  if (status === "BESTAETIGT" && !istEinlassMoeglich(datum_uhrzeit)) {
    redirect(
      `/reservierungen/${id}?error=ausserhalb_oeffnungszeiten`
    );
  }

  if (tisch_id) {
    // BV-015: Gruppenbereich nur Kreuzberg
    const tisch = await db.tisch.findUnique({
      where: { id: tisch_id },
      include: { bereich: true, standort: true },
    });
    if (
      tisch?.bereich.name === "Gruppenbereich" &&
      tisch.standort.name === "Spandau"
    ) {
      redirect(`/reservierungen/${id}?error=gruppenraum_spandau`);
    }

    // BV-008: Keine Doppelbelegung — sich selbst ausschließen
    const konflikt = await db.reservierung.findFirst({
      where: {
        tisch_id,
        status: { notIn: ["STORNIERT", "NO_SHOW"] },
        datum_uhrzeit: {
          gte: new Date(datum_uhrzeit.getTime() - 2 * 60 * 60 * 1000),
          lte: new Date(datum_uhrzeit.getTime() + 2 * 60 * 60 * 1000),
        },
        NOT: { id },
      },
    });
    if (konflikt) {
      redirect(`/reservierungen/${id}?error=doppelbelegung`);
    }
  }

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

// BV-009: No-Show setzen mit 20-Minuten-Karenz
export async function noShowSetzen(id: number) {
  const reservierung = await db.reservierung.findUnique({ where: { id } });
  if (!reservierung) redirect("/reservierungen");

  const karenzEnde = new Date(
    reservierung!.datum_uhrzeit.getTime() + 20 * 60 * 1000
  );

  if (new Date() < karenzEnde) {
    redirect(`/reservierungen/${id}?error=no_show_zu_frueh`);
  }

  // Tisch wieder auf FREI setzen
  if (reservierung!.tisch_id) {
    await db.tisch.update({
      where: { id: reservierung!.tisch_id },
      data: { status: "FREI" },
    });
  }

  await db.reservierung.update({
    where: { id },
    data: { status: "NO_SHOW" },
  });

  revalidatePath("/reservierungen");
  redirect("/reservierungen");
}
