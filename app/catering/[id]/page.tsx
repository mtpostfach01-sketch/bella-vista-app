import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAktiverMitarbeiter } from "@/lib/session";
import { cateringAuftragBestaetigen, cateringAuftragStornieren } from "../actions";

// BV-104 / W9: Catering-Auftrag-Detail — Bestätigen erzeugt eine Bestellung
export default async function CateringDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const aktiver = await getAktiverMitarbeiter();
  if (!aktiver) redirect("/session");
  if (aktiver.rolle === "BEDIENUNG") redirect("/");

  const { id } = await params;

  const auftrag = await db.cateringAuftrag.findUnique({
    where: { id: Number(id) },
    include: {
      firmenkunde: true,
      standort: true,
      positionen: { include: { gericht: true } },
      bestellungen: true,
    },
  });
  if (!auftrag) notFound();

  const summe = auftrag.positionen.reduce(
    (a, p) => a + p.menge * p.gericht.preis,
    0
  );

  const bestaetigenAction = cateringAuftragBestaetigen.bind(null, auftrag.id);
  const stornierenAction = cateringAuftragStornieren.bind(null, auftrag.id);

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold text-gray-900">
          {auftrag.firmenkunde.name}
        </h1>
        <Link href="/catering" className="text-sm text-gray-500 hover:text-gray-900">
          ← Catering
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {auftrag.standort.name} ·{" "}
        {new Date(auftrag.event_datum).toLocaleDateString("de-DE")} ·{" "}
        {auftrag.lieferadresse}
      </p>

      <div className="mb-6 text-sm text-gray-600">
        Ansprechpartner: {auftrag.firmenkunde.ansprechpartner} ·{" "}
        {auftrag.firmenkunde.telefon}
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Menü</h2>
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white">
          {auftrag.positionen.map((p) => (
            <div key={p.id} className="flex justify-between px-4 py-3 text-sm">
              <span className="text-gray-700">
                {p.menge}× {p.gericht.name}
              </span>
              <span className="text-gray-900 font-medium">
                {(p.menge * p.gericht.preis).toFixed(2)} €
              </span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 font-semibold text-gray-900 text-sm bg-gray-50 rounded-b-lg">
            <span>Summe</span>
            <span>{summe.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Status: {auftrag.status}</span>
      </div>

      {auftrag.status === "ANGEBOT" && (
        <div className="flex gap-3 mt-4">
          <form action={bestaetigenAction}>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
            >
              Bestätigen (erzeugt Bestellung)
            </button>
          </form>
          <form action={stornierenAction}>
            <button
              type="submit"
              className="px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-50"
            >
              Stornieren
            </button>
          </form>
        </div>
      )}

      {auftrag.bestellungen.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            Erzeugte Bestellung
          </h2>
          {auftrag.bestellungen.map((b) => (
            <Link
              key={b.id}
              href={`/bestellungen/${b.id}`}
              className="text-sm text-gray-700 hover:text-gray-900 underline"
            >
              Bestellung #{b.id} ({b.status}) →
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
