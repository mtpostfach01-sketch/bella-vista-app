import { db } from "@/lib/db";
import { getAktiverMitarbeiter } from "@/lib/session";
import { redirect } from "next/navigation";
import { cateringAuftragAnlegen } from "../actions";

const FEHLERMELDUNGEN: Record<string, string> = {
  pflichtfelder: "Bitte alle Pflichtfelder ausfüllen.",
  firmenkunde_fehlt: "Bitte einen Firmenkunden wählen oder neu anlegen.",
  keine_positionen: "Bitte mindestens ein Gericht mit einer Menge größer als 0 wählen.",
};

// BV-104: Catering-Auftrag anlegen
export default async function CateringNeuPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const aktiver = await getAktiverMitarbeiter();
  if (!aktiver) redirect("/session");
  if (aktiver.rolle === "BEDIENUNG") redirect("/");

  const { error } = await searchParams;

  const [firmenkunden, standorte, speisekarten] = await Promise.all([
    db.firmenkunde.findMany({ orderBy: { name: "asc" } }),
    db.standort.findMany({ orderBy: { name: "asc" } }),
    db.speisekarte.findMany({
      include: {
        standort: true,
        kategorien: { include: { gerichte: { where: { verfuegbar: true }, orderBy: { name: "asc" } } } },
      },
      orderBy: { standort: { name: "asc" } },
    }),
  ]);

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Catering-Auftrag anlegen
      </h1>

      {error && FEHLERMELDUNGEN[error] && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {FEHLERMELDUNGEN[error]}
        </div>
      )}

      <form action={cateringAuftragAnlegen} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Firmenkunde *
          </label>
          <select
            name="firmenkunde_id"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">— Neuen Firmenkunden unten anlegen —</option>
            {firmenkunden.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.ansprechpartner})
              </option>
            ))}
          </select>
        </div>

        <fieldset className="border border-gray-200 rounded-lg p-3 space-y-2">
          <legend className="text-xs text-gray-500 px-1">
            Neuer Firmenkunde (falls oben nicht gewählt)
          </legend>
          <input
            name="neuer_firmenkunde_name"
            placeholder="Firmenname"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <input
            name="neuer_firmenkunde_ansprechpartner"
            placeholder="Ansprechpartner"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <input
            name="neuer_firmenkunde_telefon"
            placeholder="Telefon"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </fieldset>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Standort *
          </label>
          <select
            name="standort_id"
            required
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Eventdatum *
            </label>
            <input
              name="event_datum"
              type="date"
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lieferadresse *
            </label>
            <input
              name="lieferadresse"
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Menüauswahl *
          </label>
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
                    </span>
                    <input type="hidden" name="gericht_id" value={g.id} />
                    <input
                      type="number"
                      name="menge"
                      min={0}
                      defaultValue={0}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                ))
              )
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Catering-Auftrag anlegen
          </button>
          <a href="/catering" className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">
            Abbrechen
          </a>
        </div>
      </form>
    </div>
  );
}
