import { db } from "@/lib/db";
import { getAktiverMitarbeiter } from "@/lib/session";
import { redirect } from "next/navigation";
import { faelligeErinnerungenVersenden } from "./actions";

// BV-101: SMS-Erinnerung am Vortag (BR #22) — simulierter Versand
export default async function ErinnerungenPage() {
  const aktiver = await getAktiverMitarbeiter();
  if (!aktiver) redirect("/?error=keine_session");
  if (aktiver.rolle === "BEDIENUNG") redirect("/");

  const standortFilter =
    aktiver.rolle === "CHEF"
      ? undefined
      : { reservierung: { standort_id: aktiver.standort_id! } };

  const erinnerungen = await db.erinnerung.findMany({
    where: standortFilter,
    include: { reservierung: { include: { gast: true, standort: true } } },
    orderBy: { versandzeitpunkt: "asc" },
  });

  const faellige = erinnerungen.filter(
    (e) => e.status === "GEPLANT" && e.versandzeitpunkt <= new Date()
  );

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">
        SMS-Erinnerungen
      </h1>

      {faellige.length > 0 && (
        <form action={faelligeErinnerungenVersenden}>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
          >
            {faellige.length} fällige Erinnerung
            {faellige.length !== 1 ? "en" : ""} jetzt versenden
          </button>
        </form>
      )}

      {erinnerungen.length === 0 ? (
        <p className="text-sm text-gray-400">Keine Erinnerungen vorhanden.</p>
      ) : (
        <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
          {erinnerungen.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <div className="font-medium text-gray-900">
                  {e.reservierung.gast.vorname} {e.reservierung.gast.nachname}
                  <span className="ml-2 text-xs text-gray-500">
                    {e.reservierung.standort.name}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Reservierung am{" "}
                  {new Date(e.reservierung.datum_uhrzeit).toLocaleString(
                    "de-DE"
                  )}{" "}
                  · Versand geplant für{" "}
                  {new Date(e.versandzeitpunkt).toLocaleString("de-DE")}
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  e.status === "VERSENDET"
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                {e.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
