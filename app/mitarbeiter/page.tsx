import { db } from "@/lib/db";
import Link from "next/link";

export default async function MitarbeiterPage() {
  const standorte = await db.standort.findMany({
    include: {
      mitarbeiter: { orderBy: { nachname: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  // Standortübergreifend (Chef, standort_id = null) — bewusst nicht in
  // eine Standort-Gruppe gezwungen, siehe ADR-001
  const uebergreifend = await db.mitarbeiter.findMany({
    where: { standort_id: null },
    orderBy: { nachname: "asc" },
  });

  const rolleBadge: Record<string, string> = {
    CHEF: "bg-amber-100 text-amber-800",
    MANAGER: "bg-gray-100 text-gray-700",
    BEDIENUNG: "bg-gray-100 text-gray-500",
  };

  function MitarbeiterZeile({ m }: { m: { id: number; vorname: string; nachname: string; email: string; rolle: string } }) {
    return (
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="font-medium text-gray-900">
            {m.vorname} {m.nachname}
            <span
              className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                rolleBadge[m.rolle] ?? "bg-gray-100 text-gray-500"
              }`}
            >
              {m.rolle}
            </span>
          </div>
          <div className="text-sm text-gray-500">{m.email}</div>
        </div>
        <Link
          href={`/mitarbeiter/${m.id}`}
          className="text-sm text-gray-400 hover:text-gray-900"
        >
          Bearbeiten →
        </Link>
      </div>
    );
  }

  const gesamtAnzahl =
    standorte.reduce((a, s) => a + s.mitarbeiter.length, 0) + uebergreifend.length;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Mitarbeiter</h1>
        <Link
          href="/mitarbeiter/neu"
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
        >
          + Mitarbeiter anlegen
        </Link>
      </div>

      {gesamtAnzahl === 0 ? (
        <p className="text-gray-400 text-sm">Noch keine Mitarbeiter angelegt.</p>
      ) : (
        <>
          {uebergreifend.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Alle Standorte ({uebergreifend.length})
              </h2>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white">
                {uebergreifend.map((m) => (
                  <MitarbeiterZeile key={m.id} m={m} />
                ))}
              </div>
            </div>
          )}

          {standorte.map((standort) => (
            <div key={standort.id} className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {standort.name} ({standort.mitarbeiter.length})
              </h2>
              {standort.mitarbeiter.length === 0 ? (
                <p className="text-gray-400 text-sm">Keine Mitarbeiter.</p>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white">
                  {standort.mitarbeiter.map((m) => (
                    <MitarbeiterZeile key={m.id} m={m} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
