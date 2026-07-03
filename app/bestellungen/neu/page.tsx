import { db } from "@/lib/db";
import { bestellungAnlegen } from "../actions";
import { BestellartAuswahl } from "./BestellartAuswahl";

const FEHLERMELDUNGEN: Record<string, string> = {
  kueche_geschlossen:
    "Die Küche ist geschlossen. Neue Bestellungen sind nur zwischen 12:00 und 22:00 Uhr möglich.",
  grillgericht_spandau:
    "Grillgerichte sind im Standort Spandau nicht verfügbar (baulich kein Grill). Bitte Grillgericht aus der Bestellung entfernen.",
  keine_positionen:
    "Bitte mindestens ein Gericht mit einer Menge größer als 0 wählen.",
};

export default async function BestellungNeuPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; standort_id?: string }>;
}) {
  const { error, standort_id: standortParam } = await searchParams;

  const standorte = await db.standort.findMany({
    include: {
      tische: {
        where: { status: { in: ["FREI", "BESETZT"] } },
        orderBy: { nummer: "asc" },
      },
      mitarbeiter: { orderBy: { nachname: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  // Gerichte (nur verfügbare), nach Speisekarte / Standort / Kategorie
  const speisekarten = await db.speisekarte.findMany({
    include: {
      standort: true,
      kategorien: {
        include: {
          gerichte: {
            where: { verfuegbar: true },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { standort: { name: "asc" } },
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Bestellung anlegen
      </h1>

      {/* Fehlermeldung */}
      {error && FEHLERMELDUNGEN[error] && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {FEHLERMELDUNGEN[error]}
        </div>
      )}

      <form action={bestellungAnlegen} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Standort *
          </label>
          <select
            name="standort_id"
            required
            defaultValue={standortParam ?? ""}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Standort wählen …</option>
            {standorte.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* BV-107: Bestellart TISCH / ABHOLUNG (interaktiv) */}
        <BestellartAuswahl
          standorte={standorte.map((s) => ({
            id: s.id,
            name: s.name,
            tische: s.tische.map((t) => ({
              id: t.id,
              nummer: t.nummer,
              kapazitaet: t.kapazitaet,
            })),
          }))}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mitarbeiter *
          </label>
          <select
            name="mitarbeiter_id"
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Mitarbeiter wählen …</option>
            {standorte.map((s) =>
              s.mitarbeiter.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.vorname} {m.nachname} ({m.rolle})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Positionen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Positionen *
          </label>

          {speisekarten.length === 0 ? (
            <p className="text-xs text-gray-400">
              Keine Speisekarte vorhanden.{" "}
              <a href="/speisekarte/kategorien/neu" className="underline">
                Speisekarte anlegen →
              </a>
            </p>
          ) : (
            <div className="space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
              {speisekarten.map((karte) =>
                karte.kategorien.map((kat) =>
                  kat.gerichte.map((g) => (
                    <div key={g.id} className="flex items-center gap-3">
                      <span className="flex-1 text-sm text-gray-700">
                        {karte.standort.name} — {g.name}
                        <span className="ml-1 text-xs text-gray-400">
                          {g.preis.toFixed(2)} €
                        </span>
                        {/* BV-012: Grillgericht-Hinweis */}
                        {g.ist_grillgericht && (
                          <span className="ml-1 text-xs text-orange-600 font-medium">
                            🔥 nur Kreuzberg
                          </span>
                        )}
                      </span>
                      {/* verstecktes Feld: gericht_id */}
                      <input type="hidden" name="gericht_id" value={g.id} />
                      <input
                        type="number"
                        name="menge"
                        min={0}
                        defaultValue={0}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                      <input
                        type="text"
                        name="pos_notiz"
                        placeholder="Notiz"
                        className="w-28 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  ))
                )
              )}
              <p className="text-xs text-gray-400 pt-1">
                Menge 0 = nicht bestellt · Küche offen bis 22:00 Uhr
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Bestellung aufnehmen
          </button>
          <a
            href="/bestellungen"
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
          >
            Abbrechen
          </a>
        </div>
      </form>
    </div>
  );
}
