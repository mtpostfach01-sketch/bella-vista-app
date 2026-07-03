import { db } from "@/lib/db";
import { tischAnlegen } from "../actions";

export default async function TischNeuPage() {
  const standorte = await db.standort.findMany({
    include: { bereiche: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Tisch anlegen</h1>
      <form action={tischAnlegen} className="space-y-4">
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
            Bereich *
          </label>
          <select
            name="bereich_id"
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Bereich wählen …</option>
            {standorte.map((s) =>
              s.bereiche.map((b) => (
                <option key={b.id} value={b.id}>
                  {s.name} — {b.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tischnummer *
            </label>
            <input
              name="nummer"
              type="number"
              min={1}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kapazität *
            </label>
            <input
              name="kapazitaet"
              type="number"
              min={1}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="FREI">FREI</option>
            <option value="BESETZT">BESETZT</option>
            <option value="RESERVIERT">RESERVIERT</option>
            <option value="GESPERRT">GESPERRT</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Speichern
          </button>
          <a
            href="/tische"
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
          >
            Abbrechen
          </a>
        </div>
      </form>
    </div>
  );
}
