import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { gerichtBearbeiten, verfuegbarToggle } from "../../actions";

export default async function GerichtBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gericht = await db.gericht.findUnique({
    where: { id: Number(id) },
    include: {
      kategorie: { include: { speisekarte: { include: { standort: true } } } },
      allergene: true,
    },
  });

  if (!gericht) notFound();

  const speisekarten = await db.speisekarte.findMany({
    include: {
      standort: true,
      kategorien: { orderBy: { name: "asc" } },
    },
    orderBy: { standort: { name: "asc" } },
  });

  const allergene = await db.allergen.findMany({ orderBy: { kuerzel: "asc" } });
  const zugeordneteAllergene = new Set(gericht.allergene.map((a) => a.allergen_id));

  const bearbeiten = gerichtBearbeiten.bind(null, gericht.id);
  // BV-014: Toggle
  const toggle = verfuegbarToggle.bind(null, gericht.id, !gericht.verfuegbar);

  return (
    <div className="max-w-md">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-gray-900">{gericht.name}</h1>
        {/* BV-014: Schnell-Toggle */}
        <form action={toggle}>
          <button
            type="submit"
            className={`text-xs px-3 py-1.5 rounded-md border ${
              gericht.verfuegbar
                ? "border-red-200 text-red-600 hover:bg-red-50"
                : "border-green-200 text-green-700 hover:bg-green-50 bg-green-50"
            }`}
          >
            {gericht.verfuegbar ? "Ausverkauft markieren" : "Wieder verfügbar markieren"}
          </button>
        </form>
      </div>
      <p className="text-sm text-gray-500 mb-1">
        {gericht.kategorie.speisekarte.standort.name} — {gericht.kategorie.name}
      </p>
      {!gericht.verfuegbar && (
        <p className="text-xs text-red-600 mb-4 font-medium">
          Dieses Gericht ist derzeit als ausverkauft markiert.
        </p>
      )}

      <form action={bearbeiten} className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kategorie *
          </label>
          <select
            name="kategorie_id"
            required
            defaultValue={gericht.kategorie_id}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {speisekarten.map((karte) =>
              karte.kategorien.map((kat) => (
                <option key={kat.id} value={kat.id}>
                  {karte.standort.name} — {kat.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gerichtname *
          </label>
          <input
            name="name"
            required
            defaultValue={gericht.name}
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
            defaultValue={gericht.beschreibung ?? ""}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              defaultValue={gericht.preis}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verfügbar *
            </label>
            <select
              name="verfuegbar"
              defaultValue={gericht.verfuegbar ? "true" : "false"}
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
            defaultChecked={gericht.ist_grillgericht}
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
            defaultValue={gericht.foto_url ?? ""}
            placeholder="https://…"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          {gericht.foto_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gericht.foto_url}
              alt={gericht.name}
              className="mt-2 h-24 w-24 object-cover rounded-md border border-gray-200"
            />
          )}
        </div>

        {allergene.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allergene
            </label>
            <div className="grid grid-cols-2 gap-1">
              {allergene.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-1.5 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    name="allergen_ids"
                    value={a.id}
                    defaultChecked={zugeordneteAllergene.has(a.id)}
                    className="rounded"
                  />
                  <span className="font-mono text-xs text-gray-500">
                    {a.kuerzel}
                  </span>
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
