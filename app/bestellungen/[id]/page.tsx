import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { positionHinzufuegen, bestellungStatusAendern } from "../actions";

export default async function BestellungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bestellung = await db.bestellung.findUnique({
    where: { id: Number(id) },
    include: {
      tisch: true,
      standort: true,
      mitarbeiter: true,
      kuechenauftrag: true,
      rechnungen: true,
      positionen: {
        include: { gericht: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!bestellung) notFound();

  const summe = bestellung.positionen.reduce(
    (acc, p) => acc + p.menge * p.gericht.preis,
    0
  );

  // Gerichte für neue Position
  const gerichte = await db.gericht.findMany({
    where: { verfuegbar: true },
    include: { kategorie: { include: { speisekarte: { include: { standort: true } } } } },
    orderBy: { name: "asc" },
  });

  const addPosition = positionHinzufuegen.bind(null, bestellung.id);
  const statusAendern = bestellungStatusAendern.bind(null, bestellung.id);

  const zeitStr = new Date(bestellung.erstellt_am).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusBadge: Record<string, string> = {
    OFFEN: "bg-amber-100 text-amber-700",
    IN_ZUBEREITUNG: "bg-blue-100 text-blue-700",
    SERVIERT: "bg-green-100 text-green-700",
    BEZAHLT: "bg-gray-100 text-gray-500",
    STORNIERT: "bg-red-100 text-red-600",
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold text-gray-900">
          Bestellung #{bestellung.id}
        </h1>
        <Link href="/bestellungen" className="text-sm text-gray-500 hover:text-gray-900">
          ← Zurück
        </Link>
      </div>

      <div className="text-sm text-gray-500 mb-6">
        {bestellung.standort.name} · Tisch {bestellung.tisch.nummer} ·{" "}
        {bestellung.mitarbeiter.vorname} {bestellung.mitarbeiter.nachname} · {zeitStr}
        <span
          className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
            statusBadge[bestellung.status] ?? "bg-gray-100 text-gray-500"
          }`}
        >
          {bestellung.status}
        </span>
        {bestellung.kuechenauftrag && (
          <span className="ml-2 text-xs text-gray-400">
            Küche: {bestellung.kuechenauftrag.status}
          </span>
        )}
      </div>

      {/* Positionen */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Positionen</h2>
        {bestellung.positionen.length === 0 ? (
          <p className="text-gray-400 text-sm">Noch keine Positionen.</p>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white mb-2">
            {bestellung.positionen.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-medium text-gray-900">
                    {p.menge}× {p.gericht.name}
                  </div>
                  {p.notiz && (
                    <div className="text-xs text-gray-400">{p.notiz}</div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {(p.menge * p.gericht.preis).toFixed(2)} €
                </div>
              </div>
            ))}
            <div className="flex justify-end px-4 py-3 font-semibold text-gray-900">
              Summe: {summe.toFixed(2)} €
            </div>
          </div>
        )}

        {/* Position hinzufügen */}
        <details className="border border-gray-200 rounded-lg bg-white">
          <summary className="px-4 py-3 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
            + Position hinzufügen
          </summary>
          <form action={addPosition} className="px-4 pb-4 pt-2 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gericht *
              </label>
              <select
                name="gericht_id"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Gericht wählen …</option>
                {gerichte.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.kategorie.speisekarte.standort.name} — {g.name} ({g.preis.toFixed(2)} €)
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Menge *
                </label>
                <input
                  name="menge"
                  type="number"
                  min={1}
                  defaultValue={1}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notiz
                </label>
                <input
                  name="notiz"
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
            >
              Hinzufügen
            </button>
          </form>
        </details>
      </div>

      {/* Status ändern */}
      <div className="mb-6 border border-gray-200 rounded-lg bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Status ändern</h2>
        <form action={statusAendern} className="flex gap-2 flex-wrap">
          {["OFFEN", "IN_ZUBEREITUNG", "SERVIERT", "BEZAHLT", "STORNIERT"].map(
            (s) => (
              <button
                key={s}
                type="submit"
                name="status"
                value={s}
                disabled={bestellung.status === s}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                  bestellung.status === s
                    ? "bg-gray-900 text-white border-gray-900 cursor-default"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            )
          )}
        </form>
      </div>

      {/* Rechnung */}
      {bestellung.status !== "STORNIERT" && (
        <div>
          {bestellung.rechnungen.length === 0 ? (
            <Link
              href={`/bestellungen/${bestellung.id}/rechnung`}
              className="inline-block px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
            >
              Rechnung erstellen →
            </Link>
          ) : (
            <Link
              href={`/bestellungen/${bestellung.id}/rechnung`}
              className="inline-block px-4 py-2 bg-white border border-gray-300 text-sm rounded-md hover:bg-gray-50"
            >
              Rechnung anzeigen →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
