import { db } from "@/lib/db";
import { reservierungAnlegen } from "../actions";

export default async function ReservierungNeuPage({
  searchParams,
}: {
  searchParams: Promise<{ telefon?: string }>;
}) {
  const { telefon } = await searchParams;

  // Gäste: bei Suche gefiltert, sonst alle
  const gaeste = await db.gast.findMany({
    where: telefon ? { telefon: { contains: telefon } } : undefined,
    orderBy: { nachname: "asc" },
  });

  const standorte = await db.standort.findMany({
    include: {
      tische: {
        orderBy: { nummer: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const heute = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Reservierung anlegen
      </h1>

      {/* Gast-Suche */}
      <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Gast per Telefonnummer suchen
        </p>
        <form className="flex gap-2">
          <input
            name="telefon"
            defaultValue={telefon}
            placeholder="Telefonnummer …"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-white border border-gray-300 text-sm rounded-md hover:bg-gray-50"
          >
            Suchen
          </button>
          {telefon && (
            <a
              href="/reservierungen/neu"
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900"
            >
              Alle
            </a>
          )}
        </form>
        {telefon && gaeste.length === 0 && (
          <p className="text-xs text-gray-400 mt-2">
            Kein Gast gefunden.{" "}
            <a href="/gaeste/neu" className="underline hover:text-gray-700">
              Neuen Gast anlegen →
            </a>
          </p>
        )}
      </div>

      <form action={reservierungAnlegen} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gast *
          </label>
          <select
            name="gast_id"
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Gast wählen …</option>
            {gaeste.map((g) => (
              <option key={g.id} value={g.id}>
                {g.vorname} {g.nachname} · {g.telefon}
              </option>
            ))}
          </select>
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tisch (optional)
          </label>
          <select
            name="tisch_id"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Kein Tisch zugewiesen</option>
            {standorte.map((s) =>
              s.tische.map((t) => (
                <option key={t.id} value={t.id}>
                  {s.name} — Tisch {t.nummer} ({t.kapazitaet} Plätze)
                </option>
              ))
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Datum *
            </label>
            <input
              name="datum"
              type="date"
              required
              defaultValue={heute}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Uhrzeit *
            </label>
            <input
              name="uhrzeit"
              type="time"
              required
              defaultValue="19:00"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Personenanzahl *
          </label>
          <input
            name="personenanzahl"
            type="number"
            min={1}
            required
            defaultValue={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notiz (z. B. Geburtstag, Allergie)
          </label>
          <textarea
            name="notiz"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Speichern
          </button>
          <a
            href="/reservierungen"
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
          >
            Abbrechen
          </a>
        </div>
      </form>
    </div>
  );
}
