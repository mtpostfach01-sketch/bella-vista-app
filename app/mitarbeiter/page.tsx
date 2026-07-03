import { db } from "@/lib/db";
import Link from "next/link";

export default async function MitarbeiterPage() {
  const mitarbeiter = await db.mitarbeiter.findMany({
    include: { standort: true },
    orderBy: { nachname: "asc" },
  });

  const rolleBadge: Record<string, string> = {
    CHEF: "bg-purple-100 text-purple-700",
    MANAGER: "bg-blue-100 text-blue-700",
    BEDIENUNG: "bg-gray-100 text-gray-600",
  };

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

      {mitarbeiter.length === 0 ? (
        <p className="text-gray-400 text-sm">Noch keine Mitarbeiter angelegt.</p>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white">
          {mitarbeiter.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
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
                <div className="text-sm text-gray-500">
                  {m.email}
                  {m.standort && ` · ${m.standort.name}`}
                  {!m.standort && m.rolle === "CHEF" && " · alle Standorte"}
                </div>
              </div>
              <Link
                href={`/mitarbeiter/${m.id}`}
                className="text-sm text-gray-400 hover:text-gray-900"
              >
                Bearbeiten →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
