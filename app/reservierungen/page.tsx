import { db } from "@/lib/db";
import Link from "next/link";

export default async function ReservierungenPage() {
  const reservierungen = await db.reservierung.findMany({
    include: {
      gast: true,
      tisch: true,
      standort: true,
    },
    orderBy: { datum_uhrzeit: "asc" },
  });

  const statusBadge: Record<string, string> = {
    BESTAETIGT: "bg-green-100 text-green-700",
    NO_SHOW: "bg-red-100 text-red-700",
    STORNIERT: "bg-gray-100 text-gray-500",
    ERSCHIENEN: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Reservierungen</h1>
        <div className="flex gap-2">
          <Link
            href="/reservierungen/warteliste"
            className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-md hover:bg-gray-50"
          >
            Warteliste
          </Link>
          <Link
            href="/reservierungen/neu"
            className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
          >
            + Reservierung anlegen
          </Link>
        </div>
      </div>

      {reservierungen.length === 0 ? (
        <p className="text-gray-400 text-sm">Noch keine Reservierungen vorhanden.</p>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white">
          {reservierungen.map((r) => {
            const dt = new Date(r.datum_uhrzeit);
            const datumStr = dt.toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
            const zeitStr = dt.toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-medium text-gray-900">
                    {r.gast.vorname} {r.gast.nachname}
                    <span
                      className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        statusBadge[r.status] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {datumStr} {zeitStr} · {r.personenanzahl} Personen ·{" "}
                    {r.standort.name}
                    {r.tisch && ` · Tisch ${r.tisch.nummer}`}
                  </div>
                  <div className="text-xs text-gray-400">{r.gast.telefon}</div>
                </div>
                <Link
                  href={`/reservierungen/${r.id}`}
                  className="text-sm text-gray-400 hover:text-gray-900"
                >
                  Bearbeiten →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
