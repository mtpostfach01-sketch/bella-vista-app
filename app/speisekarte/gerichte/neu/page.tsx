import { db } from "@/lib/db";
import { gerichtAnlegen } from "../../actions";

export default async function GerichtNeuPage() {
  const speisekarten = await db.speisekarte.findMany({
    include: {
      standort: true,
      kategorien: { orderBy: { name: "asc" } },
    },
    orderBy: { standort: { name: "asc" } },
  });

  const allergene = await db.allergen.findMany({ orderBy: { kuerzel: "asc" } });

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Gericht anlegen
      </h1>
      <form action={gerichtAnlegen} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kategorie *
          </label>
          <select
            name="kategorie_id"
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Kategorie wählen …</option>
            {speisekarten.map((karte) =>
              karte.kategorien.map((kat) => (
                <option key={kat.id} value={kat.id}>
                  {karte.standort.name} — {kat.name}
                </option>
              ))
            )}
          </select>
          {speisekarten.every((k) => k.kategorien.length === 0) && (
            <p className="text-xs text-gray-400 mt-1">
              Bitte zuerst eine{" "}
              <a href="/speisekarte/kategorien/neu" className="underline">
                Kategorie anlegen
              </a>
              .
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gerichtname *
          </label>
          <input
            name="name"
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Beschreibung
          </label>
          <textarea
            name="beschreibung"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preis (€) *
            </label>
            <input
              name="preis"
              type="number"
              step="0.01"
              min="0"
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verfügbar *
            </label>
            <select
              name="verfuegbar"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="true">Ja</option>
              <option value="false">Ausverkauft</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            name="ist_grillgericht"
            type="checkbox"
            id="grillgericht"
            className="rounded"
          />
          <label htmlFor="grillgericht" className="text-sm text-gray-700">
            Grillgericht (nur Kreuzberg — BR #8)
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Foto-URL (optional)
          </label>
          <input
            name="foto_url"
            type="url"
            placeholder="https://…"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {allergene.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allergene
            </label>
            <div className="grid grid-cols-2 gap-1">
              {allergene.map((a) => (
                <label key={a.id} className="flex items-center gap-1.5 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="allergen_ids"
                    value={a.id}
                    className="rounded"
                  />
                  <span className="font-mono text-xs text-gray-500">{a.kuerzel}</span>
                  {a.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Speichern
          </button>
          <a
            href="/speisekarte"
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
          >
            Abbrechen
          </a>
        </div>
      </form>
    </div>
  );
}
