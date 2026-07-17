import { db } from "@/lib/db";
import { getAktiverMitarbeiter } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_BADGE: Record<string, string> = {
  ANGEBOT: "bg-gray-100 text-gray-600",
  BESTAETIGT: "bg-green-50 text-green-700",
  ABGESCHLOSSEN: "bg-blue-50 text-blue-700",
  STORNIERT: "bg-red-50 text-red-700",
};

// BV-104: Catering-Modul (Firmenkunden, Events)
export default async function CateringPage() {
  const aktiver = await getAktiverMitarbeiter();
  if (!aktiver) redirect("/?error=keine_session");
  if (aktiver.rolle === "BEDIENUNG") redirect("/");

  const standortFilter =
    aktiver.rolle === "CHEF" ? undefined : { standort_id: aktiver.standort_id! };

  const auftraege = await db.cateringAuftrag.findMany({
    where: standortFilter,
    include: { firmenkunde: true, standort: true, positionen: true },
    orderBy: { event_datum: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Catering</h1>
        <Link
          href="/catering/neu"
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
        >
          + Catering-Auftrag anlegen
        </Link>
      </div>

      {auftraege.length === 0 ? (
        <p className="text-sm text-gray-400">Noch keine Catering-Aufträge.</p>
      ) : (
        <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
          {auftraege.map((a) => (
            <Link
              key={a.id}
              href={`/catering/${a.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium text-gray-900">
                  {a.firmenkunde.name}
                  <span
                    className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${STATUS_BADGE[a.status] ?? ""}`}
                  >
                    {a.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {a.standort.name} ·{" "}
                  {new Date(a.event_datum).toLocaleDateString("de-DE")} ·{" "}
                  {a.positionen.length} Position{a.positionen.length !== 1 ? "en" : ""}
                </div>
              </div>
              <span className="text-sm text-gray-400">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
