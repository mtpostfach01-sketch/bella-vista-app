import { db } from "@/lib/db";
import { getAktiverMitarbeiter } from "@/lib/session";
import { redirect } from "next/navigation";
import { schichtEintragen, schichtEntfernen } from "./actions";

// BV-103: Schichtplanung je Standort, inkl. Einspring-Kennzeichnung (BR-Analogie zu Schmidt-Beispiel)
export default async function SchichtplanungPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const aktiver = await getAktiverMitarbeiter();
  if (!aktiver) redirect("/?error=keine_session");
  if (aktiver.rolle === "BEDIENUNG") redirect("/");

  const { error } = await searchParams;

  const standortFilter =
    aktiver.rolle === "CHEF" ? undefined : { id: aktiver.standort_id! };

  const [standorte, mitarbeiter, schichten] = await Promise.all([
    db.standort.findMany({ where: standortFilter, orderBy: { name: "asc" } }),
    db.mitarbeiter.findMany({ orderBy: { nachname: "asc" } }),
    db.schicht.findMany({
      where:
        aktiver.rolle === "CHEF"
          ? undefined
          : { standort_id: aktiver.standort_id! },
      include: { mitarbeiter: true, standort: true },
      orderBy: { datum: "desc" },
    }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Schichtplanung</h1>

      {error === "pflichtfelder" && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Bitte alle Pflichtfelder ausfüllen.
        </div>
      )}

      <section className="border border-gray-200 rounded-lg bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Schicht eintragen
        </h2>
        <form action={schichtEintragen} className="space-y-3">
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
              {mitarbeiter.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nachname}, {m.vorname}
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum *
              </label>
              <input
                name="datum"
                type="date"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Von *
              </label>
              <input
                name="von"
                type="time"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bis *
              </label>
              <input
                name="bis"
                type="time"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input name="einspring_flag" type="checkbox" />
            Einspringen an anderem Standort
          </label>

          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Schicht eintragen
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Geplante Schichten ({schichten.length})
        </h2>
        {schichten.length === 0 ? (
          <p className="text-sm text-gray-400">Noch keine Schichten eingetragen.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
            {schichten.map((s) => {
              const entfernenAction = schichtEntfernen.bind(null, s.id);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {s.mitarbeiter.vorname} {s.mitarbeiter.nachname}
                      {s.einspring_flag && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                          Einspringen
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {s.standort.name} ·{" "}
                      {new Date(s.datum).toLocaleDateString("de-DE")} · {s.von}–{s.bis}
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
