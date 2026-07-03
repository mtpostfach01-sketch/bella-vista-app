import { db } from "@/lib/db";
import { getAktiverMitarbeiter } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { wartelisteEintragen, wartelisteEntfernen } from "./actions";

export default async function WartelistePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const aktiver = await getAktiverMitarbeiter();
  if (!aktiver) redirect("/session");

  const { error } = await searchParams;

  // Standort-Filter für Manager
  const standortFilter =
    aktiver.rolle === "CHEF"
      ? undefined
      : { id: aktiver.standort_id! };

  const [standorte, gaeste, warteliste] = await Promise.all([
    db.standort.findMany({
      where: standortFilter,
      include: {
        tische: {
          where: { status: "FREI" },
          orderBy: { nummer: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.gast.findMany({ orderBy: { nachname: "asc" } }),
    db.warteliste.findMany({
      where:
        aktiver.rolle === "CHEF"
          ? undefined
          : { standort_id: aktiver.standort_id! },
      include: {
        gast: true,
        standort: true,
      },
      orderBy: { erstellt_am: "asc" },
    }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Warteliste</h1>
        <Link
          href="/reservierungen"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Reservierungen
        </Link>
      </div>

      {error === "pflichtfelder" && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Bitte alle Pflichtfelder ausfüllen.
        </div>
      )}

      {/* Formular: Auf Warteliste setzen */}
      <section className="border border-gray-200 rounded-lg bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Gast auf Warteliste setzen
        </h2>
        <form action={wartelisteEintragen} className="space-y-3">
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
                  {g.nachname}, {g.vorname} · {g.telefon}
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
                  {s.name} ({s.tische.length} Tisch{s.tische.length !== 1 ? "e" : ""} frei)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gewünschte Personenanzahl *
            </label>
            <input
              name="gewuenschte_personenzahl"
              type="number"
              min={1}
              max={50}
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
              placeholder="z. B. Allergie, Hochstuhl …"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Auf Warteliste setzen
          </button>
        </form>
      </section>

      {/* Warteliste */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Aktuelle Warteliste ({warteliste.length}{" "}
          {warteliste.length === 1 ? "Eintrag" : "Einträge"})
        </h2>

        {warteliste.length === 0 ? (
          <p className="text-sm text-gray-400">Die Warteliste ist leer.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
            {warteliste.map((w, idx) => {
              const wartetSeit = Math.floor(
                (Date.now() - new Date(w.erstellt_am).getTime()) / 60000
              );
              const entfernenAction = wartelisteEntfernen.bind(null, w.id);

              // Passende freie Tische am Standort prüfen
              const standortMitTischen = standorte.find(
                (s) => s.id === w.standort_id
            );
              const passendeTische = standortMitTischen?.tische.filter(
                (t) => t.kapazitaet >= w.gewuenschte_personenzahl
              ) ?? [];

              return (
                <div
                  key={w.id}
                  className="flex items-start justify-between px-4 py-3 gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-sm text-gray-400 font-medium mt-0.5">
                      {idx + 1}.
                    </span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {w.gast.vorname} {w.gast.nachname}
                        <span className="ml-2 text-xs text-gray-500">
                          {w.gast.telefon}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {w.standort.name} · {w.gewuenschte_personenzahl} Personen
                        {w.notiz && ` · ${w.notiz}`}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        wartet seit {wartetSeit} Min.
                        {passendeTische.length > 0 && (
                          <span className="ml-2 text-green-600 font-medium">
                            {passendeTische.length} freier Tisch
                            {passendeTische.length !== 1 ? "e" : ""} verfügbar
                            (T. {passendeTische.map((t) => t.nummer).join(", ")})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {/* Tisch zuweisen → Reservierung anlegen */}
                    <Link
                      href={`/reservierungen/neu?gast_id=${w.gast_id}&standort_id=${w.standort_id}&personenanzahl=${w.gewuenschte_personenzahl}`}
                      className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-md hover:bg-gray-700"
                    >
                      Tisch zuweisen
                    </Link>
                    {/* Von Liste entfernen */}
                    <form action={entfernenAction}>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-md hover:bg-gray-50"
                      >
                        Entfernen
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
