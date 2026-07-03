"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { istKuecheOffen } from "@/lib/oeffnungszeiten";

export async function bestellungAnlegen(formData: FormData) {
  const tisch_id_raw = formData.get("tisch_id") as string;
  const bestellart = (formData.get("bestellart") as string) || "TISCH";
  const tisch_id =
    bestellart === "ABHOLUNG" || !tisch_id_raw
      ? null
      : parseInt(tisch_id_raw, 10);
  const mitarbeiter_id = parseInt(formData.get("mitarbeiter_id") as string, 10);
  const standort_id = parseInt(formData.get("standort_id") as string, 10);

  // BV-011: Küchenschluss prüfen
  if (!istKuecheOffen(new Date())) {
    redirect("/bestellungen/neu?error=kueche_geschlossen");
  }

  // Positionen aus FormData lesen (gericht_id[] + menge[] + notiz[])
  const gericht_ids = formData.getAll("gericht_id").map((v) => parseInt(v as string, 10));
  const mengen = formData.getAll("menge").map((v) => parseInt(v as string, 10));
  const notizen = formData.getAll("pos_notiz").map((v) => (v as string).trim() || null);

  // Nur Positionen mit menge > 0 berücksichtigen
  const positionen = gericht_ids
    .map((gericht_id, i) => ({
      gericht_id,
      menge: mengen[i] ?? 0,
      notiz: notizen[i] ?? null,
    }))
    .filter((p) => p.menge > 0);

  if (positionen.length === 0) {
    redirect("/bestellungen/neu?error=keine_positionen");
  }

  // BV-012: Grillgerichte in Spandau sperren
  const standort = await db.standort.findUnique({ where: { id: standort_id } });
  if (standort?.name === "Spandau") {
    const grillGerichte = await db.gericht.findMany({
      where: {
        id: { in: positionen.map((p) => p.gericht_id) },
        ist_grillgericht: true,
      },
    });
    if (grillGerichte.length > 0) {
      redirect(
        `/bestellungen/neu?error=grillgericht_spandau&standort_id=${standort_id}`
      );
    }
  }

  const bestellung = await db.bestellung.create({
    data: {
      tisch_id: tisch_id ?? null,
      bestellart,
      mitarbeiter_id,
      standort_id,
      status: "OFFEN",
      positionen: {
        create: positionen.map((p) => ({
          gericht_id: p.gericht_id,
          menge: p.menge,
          notiz: p.notiz,
          status: "OFFEN",
        })),
      },
    },
  });

  // Küchenauftrag direkt erstellen
  await db.kuechenauftrag.create({
    data: {
      bestellung_id: bestellung.id,
      status: "OFFEN",
    },
  });

  revalidatePath("/bestellungen");
  redirect(`/bestellungen/${bestellung.id}`);
}

export async function positionHinzufuegen(bestellung_id: number, formData: FormData) {
  const gericht_id = parseInt(formData.get("gericht_id") as string, 10);
  const menge = parseInt(formData.get("menge") as string, 10);
  const notiz = (formData.get("notiz") as string)?.trim() || null;

  // BV-011: Küchenschluss prüfen
  if (!istKuecheOffen(new Date())) {
    redirect(`/bestellungen/${bestellung_id}?error=kueche_geschlossen`);
  }

  // BV-013: Küchenauftrag-Status prüfen (Getränke immer erlaubt)
  const kuechenauftrag = await db.kuechenauftrag.findUnique({
    where: { bestellung_id },
  });

  if (kuechenauftrag?.status === "IN_ARBEIT") {
    // Nur Getränke erlaubt
    const gericht = await db.gericht.findUnique({
      where: { id: gericht_id },
      include: { kategorie: true },
    });
    const istGetraenk = gericht?.kategorie.name
      .toLowerCase()
      .includes("getränk");
    if (!istGetraenk) {
      redirect(
        `/bestellungen/${bestellung_id}?error=kueche_in_arbeit`
      );
    }
  }

  // BV-012: Grillgericht in Spandau sperren
  const bestellung = await db.bestellung.findUnique({
    where: { id: bestellung_id },
    include: { standort: true },
  });
  const gericht = await db.gericht.findUnique({ where: { id: gericht_id } });
  if (gericht?.ist_grillgericht && bestellung?.standort.name === "Spandau") {
    redirect(`/bestellungen/${bestellung_id}?error=grillgericht_spandau`);
  }

  await db.bestellposition.create({
    data: { bestellung_id, gericht_id, menge, notiz, status: "OFFEN" },
  });

  revalidatePath(`/bestellungen/${bestellung_id}`);
  redirect(`/bestellungen/${bestellung_id}`);
}

// BV-013: Position entfernen (nur wenn Küchenauftrag noch OFFEN)
export async function positionEntfernen(
  bestellung_id: number,
  position_id: number
) {
  const kuechenauftrag = await db.kuechenauftrag.findUnique({
    where: { bestellung_id },
  });

  if (kuechenauftrag?.status === "IN_ARBEIT") {
    redirect(
      `/bestellungen/${bestellung_id}?error=kueche_in_arbeit_entfernen`
    );
  }

  await db.bestellposition.delete({ where: { id: position_id } });

  revalidatePath(`/bestellungen/${bestellung_id}`);
  redirect(`/bestellungen/${bestellung_id}`);
}

export async function bestellungStatusAendern(id: number, formData: FormData) {
  const status = formData.get("status") as string;

  await db.bestellung.update({ where: { id }, data: { status } });

  revalidatePath("/bestellungen");
  redirect("/bestellungen");
}

// ─── Rechnung erstellen (BV-010: Bella-Card-Automatik) ───────────────────────
export async function rechnungErstellen(bestellung_id: number, formData: FormData) {
  const gast_id_raw = formData.get("gast_id") as string;
  const gast_id = gast_id_raw ? parseInt(gast_id_raw, 10) : null;

  // Summe serverseitig berechnen (sicher)
  const bestellung = await db.bestellung.findUnique({
    where: { id: bestellung_id },
    include: { positionen: { include: { gericht: true } } },
  });
  if (!bestellung) throw new Error("Bestellung nicht gefunden");

  const summe = bestellung.positionen.reduce(
    (acc, p) => acc + p.menge * p.gericht.preis,
    0
  );

  // BV-010: Bella-Card-Rabatt prüfen
  let bella_card_rabatt = false;
  let gast = null;
  if (gast_id) {
    gast = await db.gast.findUnique({ where: { id: gast_id } });
    bella_card_rabatt = gast?.bella_card ?? false;
  }

  const gesamt_betrag = bella_card_rabatt
    ? Math.round(summe * 0.85 * 100) / 100
    : Math.round(summe * 100) / 100;

  const rechnung = await db.rechnung.create({
    data: {
      bestellung_id,
      gesamt_betrag,
      gast_id,
      bella_card_rabatt,
    },
  });

  // Bestellung auf BEZAHLT setzen
  await db.bestellung.update({
    where: { id: bestellung_id },
    data: { status: "BEZAHLT" },
  });

  // BV-010: Besuchsanzahl inkrementieren + Bella-Card aktivieren (ab 10)
  if (gast_id && gast) {
    const neuerBesuchsanzahl = gast.besuchsanzahl + 1;
    await db.gast.update({
      where: { id: gast_id },
      data: {
        besuchsanzahl: neuerBesuchsanzahl,
        bella_card: neuerBesuchsanzahl >= 10 || gast.bella_card,
      },
    });
  }

  revalidatePath(`/bestellungen/${bestellung_id}`);
  redirect(`/bestellungen/${bestellung_id}/rechnung?rechnung_id=${rechnung.id}`);
}

// ─── Zahlung hinzufügen ────────────────────────────────────────
export async function zahlungHinzufuegen(
  rechnung_id: number,
  bestellung_id: number,
  formData: FormData
) {
  const betrag = parseFloat(formData.get("betrag") as string);
  const zahlungsart = formData.get("zahlungsart") as string;

  await db.zahlung.create({
    data: { rechnung_id, betrag, zahlungsart },
  });

  revalidatePath(`/bestellungen/${bestellung_id}/rechnung`);
  redirect(`/bestellungen/${bestellung_id}/rechnung`);
}
