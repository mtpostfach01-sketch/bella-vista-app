import { db } from "@/lib/db";
import Link from "next/link";

export default async function TischePage() {
  const standorte = await db.standort.findMany({
    include: {
      tische: {
        include: { bereich: true },
        orderBy: { nummer: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const statusBadge: Record<string, string> = {
    FREI: "bg-green-100 text-green-700",
    BESETZT: "bg-red-100 text-red-700",
    RESERVIERT: "bg-amber-100 text-amber-700",
    GESPERRT: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Tische</h1>
        <Link
          href="/tische/neu"
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
        >
          + Tisch anlegen
        </Link>
      </div>

      {standorte.map((standort) => (
        <div key={standort.id} className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {standort.name}
          </h2>
          {standort.tische.length === 0 ? (
            <p className="text-gray-400 text-sm">Noch keine Tische angelegt.</p>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white">
              {standort.tische.map((tisch) => (
                <div
                  key={tisch.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      Tisch {tisch.nummer}
                      <span
                        className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                          statusBadge[tisch.status] ?? "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {tisch.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {tisch.kapazitaet} Plätze · {tisch.bereich.name}
                    </div>
                  </div>
                  <Link
                    href={`/tische/${tisch.id}`}
                    className="text-sm text-gray-400 hover:text-gray-900"
                  >
                    Bearbeiten →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
