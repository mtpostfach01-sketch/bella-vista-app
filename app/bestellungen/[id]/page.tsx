import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  positionHinzufuegen,
  positionEntfernen,
  bestellungStatusAendern,
} from "../actions";

const FEHLERMELDUNGEN: Record<string, string> = {
  kueche_geschlossen:
    "Die Küche ist geschlossen. Neue Positionen sind nur bis 22:00 Uhr möglich.",
  grillgericht_spandau:
    "Grillgerichte sind im Standort Spandau nicht verfügbar.",
  kueche_in_arbeit:
    "Die Küche hat die Zubereitung gestartet. Es können nur noch Getränke hinzugefügt werden.",
  kueche_in_arbeit_entfernen:
    "Positionen können nicht mehr entfernt werden, nachdem die Küche mit der Zubereitung begonnen hat.",
};

export default async function BestellungDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const bestellung = await db.bestellung.findUnique({
    where: { id: Number(id) },
    include: {
      tisch: true,
      standort: true,
      mitarbeiter: true,
      kuechenauftrag: true,
      rechnungen: true,
      positionen: {
        include: {
          gericht: { include: { kategorie: true } },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!bestellung) notFound();

  const summe = bestellung.positionen.reduce(
    (acc, p) => acc + p.menge * p.einzelpreis,
    0
  );

  // BV-013: Positionen nur entfernbar wenn KA noch OFFEN
  const kaOffen =
    !bestellung.kuechenauftrag ||
    bestellung.kuechenauftrag.status === "OFFEN";

  // BV-013 + BV-012: Gerichte für neue Position
  const gerichte = await db.gericht.findMany({
    where: { verfuegbar: true },
    include: {
      kategorie: {
        include: { speisekarte: { include: { standort: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  // BV-013: Wenn KA IN_ARBEIT → nur Getränke hinzufügen
  const gerichteGefiltert =
    bestellung.kuechenauftrag?.status === "IN_ARBEIT"
      ? gerichte.filter((g) =>
          g.kategorie.name.toLowerCase().includes("getränk")
        )
      : gerichte;

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

  const kaBadge: Record<string, string> = {
    OFFEN: "text-amber-600",
    IN_ARBEIT: "text-blue-600",
    FERTIG: "text-green-600",
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

      <div className="text-sm text-gray-500 mb-4">
        {bestellung.standort.name}
        {bestellung.tisch ? ` · Tisch ${bestellung.tisch.nummer}` : ""}
        {/* BV-107: Abholung-Badge */}
        {(bestellung as { bestellart?: string }).bestellart === "ABHOLUNG" && (
          <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
            Abholung
          </span>
        )}
        {" · "}
        {bestellung.mitarbeiter.vorname} {bestellung.mitarbeiter.nachname} · {zeitStr}
        <span
          className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
            statusBadge[bestellung.status] ?? "bg-gray-100 text-gray-500"
          }`}
        >
          {bestellung.status}
        </span>
        {bestellung.kuechenauftrag && (
          <span
            className={`ml-2 text-xs font-medium ${
              kaBadge[bestellung.kuechenauftrag.status] ?? "text-gray-400"
            }`}
          >
            Küche: {bestellung.kuechenauftrag.status}
          </span>
        )}
      </div>

      {/* Fehlermeldung */}
      {error && FEHLERMELDUNGEN[error] && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {FEHLERMELDUNGEN[error]}
        </div>
      )}

      {/* BV-013: Warnung wenn Küche IN_ARBEIT */}
      {bestellung.kuechenauftrag?.status === "IN_ARBEIT" && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          Die Küche hat mit der Zubereitung begonnen. Positionen können nicht
          mehr entfernt werden. Nur Getränke können noch hinzugefügt werden.
        </div>
      )}

      {/* Positionen */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Positionen</h2>
        {bestellung.positionen.length === 0 ? (
          <p className="text-gray-400 text-sm">Noch keine Positionen.</p>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white mb-2">
            {bestellung.positionen.map((p) => {
              const removeAction = positionEntfernen.bind(
                null,
                bestellung.id,
                p.id
              );
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {p.menge}× {p.gericht.name}
                      {/* BV-012: Grillgericht-Badge */}
                      {p.gericht.ist_grillgericht && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                          Grill
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {p.gericht.kategorie.name}
                      {p.notiz && ` · ${p.notiz}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500">
                      {(p.menge * p.einzelpreis).toFixed(2)} €
                    </div>
                    {/* BV-013: Entfernen-Button nur wenn KA OFFEN */}
                    {kaOffen &&
                      bestellung.status !== "BEZAHLT" &&
                      bestellung.status !== "STORNIERT" && (
                        <form action={removeAction}>
                          <button
                            type="submit"
                            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                          >
                            Entfernen
                          </button>
                        </form>
                      )}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end px-4 py-3 font-semibold text-gray-900">
              Summe: {summe.toFixed(2)} €
            </div>
          </div>
        )}

        {/* Position hinzufügen */}
        {bestellung.status !== "BEZAHLT" &&
          bestellung.status !== "STORNIERT" && (
            <details className="border border-gray-200 rounded-lg bg-white">
              <summary className="px-4 py-3 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                + Position hinzufügen
                {bestellung.kuechenauftrag?.status === "IN_ARBEIT" && (
                  <span className="ml-2 text-xs text-blue-600">
                    (nur Getränke)
                  </span>
                )}
              </summary>
              <form action={addPosition} className="px-4 pb-4 pt-2 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gericht *
                  </label>
                  {gerichteGefiltert.length === 0 ? (
                    <p className="text-xs text-gray-400">
                      Keine Gerichte verfügbar (Küche in Zubereitung, nur
                      Getränke erlaubt — keine Getränke-Kategorie vorhanden).
                    </p>
                  ) : (
                    <select
                      name="gericht_id"
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="">Gericht wählen …</option>
                      {gerichteGefiltert.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.kategorie.speisekarte.standort.name} — {g.name} (
                          {g.preis.toFixed(2)} €)
                          {/* BV-012: Grillgericht-Hinweis */}
                          {g.ist_grillgericht
                            ? " 🔥 nur Kreuzberg"
                            : ""}
                        </option>
                      ))}
                    </select>
                  )}
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
                {gerichteGefiltert.length > 0 && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
                  >
                    Hinzufügen
                  </button>
                )}
              </form>
            </details>
          )}
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
