import { db } from "@/lib/db";
import { getAktiverMitarbeiter } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { gruppenmenueAnlegen, gruppenmenueEntfernen } from "./actions";

// BV-105: Gruppenmenü-Pflege je Standort (BR #6, Speisekarten-Pflege BR #21)
export default async function GruppenmenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const aktiver = await getAktiverMitarbeiter();
  if (!aktiver) redirect("/session");
  if (aktiver.rolle === "BEDIENUNG") redirect("/");

  const { error } = await searchParams;

  const standorte = await db.standort.findMany({ orderBy: { name: "asc" } });
  const gruppenmenues = await db.gruppenmenue.findMany({
    include: { standort: true },
    orderBy: { standort: { name: "asc" } },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Gruppenmenüs</h1>
        <Link href="/speisekarte" className="text-sm text-gray-500 hover:text-gray-900">
          ← Speisekarte
        </Link>
      </div>

      {error === "pflichtfelder" && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Bitte alle Pflichtfelder ausfüllen.
        </div>
      )}

      <section className="border border-gray-200 rounded-lg bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Gruppenmenü anlegen
        </h2>
        <form action={gruppenmenueAnlegen} className="space-y-3">
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
              Bezeichnung *
            </label>
            <input
              name="bezeichnung"
              required
              placeholder="z. B. Gruppenmenü Herbst"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fixpreis (€) *
              </label>
              <input
                name="fixpreis"
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ab Personenzahl
              </label>
              <input
                name="ab_personenzahl"
                type="number"
                min="1"
                defaultValue={8}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Gruppenmenü anlegen
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Gruppenmenüs ({gruppenmenues.length})
        </h2>
        {gruppenmenues.length === 0 ? (
          <p className="text-sm text-gray-400">Noch keine Gruppenmenüs angelegt.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
            {gruppenmenues.map((g) => {
              const entfernenAction = gruppenmenueEntfernen.bind(null, g.id);
              return (
                <div key={g.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">{g.bezeichnung}</div>
                    <div className="text-sm text-gray-500">
                      {g.standort.name} · {g.fixpreis.toFixed(2)} € · ab {g.ab_personenzahl} Personen
                    </div>
                  </div>
                  <form action={entfernenAction}>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-md hover:bg-gray-50"
                    >
                      Entfernen
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
