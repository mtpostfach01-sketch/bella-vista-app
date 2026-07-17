import { db } from "@/lib/db";
import { getAktiverMitarbeiter } from "@/lib/session";
import { redirect } from "next/navigation";
import { trinkgeldBestaetigen } from "./actions";

// BV-103: Trinkgeld-Vorschlag — Verteilschlüssel proportional zum Umsatz pro
// Mitarbeiter (Interview: "Schmidt hat heute Abend Tisch 3, 5, 7 bedient,
// Gesamtumsatz soundso — dann kann ich fair aufteilen"). Chef/Manager
// bestätigt und kann die Beträge vor dem Bestätigen anpassen (BR #20).
export default async function TrinkgeldPage({
  searchParams,
}: {
  searchParams: Promise<{
    datum?: string;
    standort_id?: string;
    error?: string;
    bestaetigt?: string;
  }>;
}) {
  const aktiver = await getAktiverMitarbeiter();
  if (!aktiver) redirect("/?error=keine_session");
  if (aktiver.rolle === "BEDIENUNG") redirect("/");

  const { datum: datumParam, standort_id: standortIdParam, error, bestaetigt } =
    await searchParams;

  const heute = new Date().toISOString().slice(0, 10);
  const datum = datumParam || heute;

  const standortFilter =
    aktiver.rolle === "CHEF" ? undefined : { id: aktiver.standort_id! };
  const standorte = await db.standort.findMany({
    where: standortFilter,
    orderBy: { name: "asc" },
  });

  const standort_id = standortIdParam
    ? parseInt(standortIdParam, 10)
    : aktiver.rolle !== "CHEF"
    ? aktiver.standort_id!
    : standorte[0]?.id;

  const tagStart = new Date(`${datum}T00:00:00`);
  const tagEnde = new Date(`${datum}T23:59:59`);

  const rechnungen = standort_id
    ? await db.rechnung.findMany({
        where: {
          erstellt_am: { gte: tagStart, lte: tagEnde },
          bestellung: { standort_id },
        },
        include: { bestellung: { include: { mitarbeiter: true } } },
      })
    : [];

  const trinkgeldTopf = rechnungen.reduce((a, r) => a + r.trinkgeld, 0);

  const umsatzMap = new Map<
    number,
    { name: string; umsatz: number }
  >();
  for (const r of rechnungen) {
    const ma = r.bestellung.mitarbeiter;
    const eintrag = umsatzMap.get(ma.id);
    if (eintrag) {
      eintrag.umsatz += r.gesamt_betrag;
    } else {
      umsatzMap.set(ma.id, { name: `${ma.vorname} ${ma.nachname}`, umsatz: r.gesamt_betrag });
    }
  }
  const gesamtUmsatz = Array.from(umsatzMap.values()).reduce((a, m) => a + m.umsatz, 0);
  const vorschlaege = Array.from(umsatzMap.entries()).map(([id, m]) => ({
    mitarbeiter_id: id,
    name: m.name,
    umsatz: m.umsatz,
    vorschlag:
      gesamtUmsatz > 0
        ? Math.round(trinkgeldTopf * (m.umsatz / gesamtUmsatz) * 100) / 100
        : 0,
  }));

  const bereitsBestaetigt = standort_id
    ? await db.trinkgeldverteilung.findMany({
        where: { datum: tagStart, standort_id },
        include: { mitarbeiter: true },
      })
    : [];

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">
        Trinkgeld-Aufteilung
      </h1>

      {error === "pflichtfelder" && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Bitte Beträge eintragen, bevor du bestätigst.
        </div>
      )}
      {bestaetigt === "1" && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          Trinkgeld-Aufteilung bestätigt.
        </div>
      )}

      <form method="get" className="flex gap-3 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Datum
          </label>
          <input
            name="datum"
            type="date"
            defaultValue={datum}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Standort
          </label>
          <select
            name="standort_id"
            defaultValue={standort_id}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {standorte.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
        >
          Anzeigen
        </button>
      </form>

      <div className="text-sm text-gray-600">
        Trinkgeld-Topf am {new Date(datum).toLocaleDateString("de-DE")}:{" "}
        <strong>{trinkgeldTopf.toFixed(2)} €</strong>
      </div>

      {vorschlaege.length === 0 ? (
        <p className="text-sm text-gray-400">
          Keine Rechnungen für diesen Tag/Standort gefunden.
        </p>
      ) : (
        <form action={trinkgeldBestaetigen} className="space-y-3">
          <input type="hidden" name="datum" value={datum} />
          <input type="hidden" name="standort_id" value={standort_id} />
          <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
            {vorschlaege.map((v) => (
              <div
                key={v.mitarbeiter_id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <div className="font-medium text-gray-900">{v.name}</div>
                  <div className="text-xs text-gray-500">
                    Umsatz: {v.umsatz.toFixed(2)} €
                  </div>
                </div>
                <input
                  name={`betrag_${v.mitarbeiter_id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={v.vorschlag.toFixed(2)}
                  className="w-28 px-3 py-1.5 text-sm text-right border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Aufteilung bestätigen
          </button>
        </form>
      )}

      {bereitsBestaetigt.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Bereits bestätigt
          </h2>
          <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
            {bereitsBestaetigt.map((b) => (
              <div
                key={b.id}
                className="flex justify-between px-4 py-3 text-sm"
              >
                <span className="text-gray-700">
                  {b.mitarbeiter.vorname} {b.mitarbeiter.nachname}
                </span>
                <span className="font-medium text-gray-900">
                  {b.betrag.toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
