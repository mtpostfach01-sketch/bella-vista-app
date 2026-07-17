import { db } from "@/lib/db";
import Link from "next/link";

export default async function GaestePage({
  searchParams,
}: {
  searchParams: Promise<{ telefon?: string }>;
}) {
  const { telefon } = await searchParams;

  const gaeste = await db.gast.findMany({
    where: telefon
      ? { telefon: { contains: telefon } }
      : undefined,
    orderBy: { nachname: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Gäste</h1>
        <Link
          href="/gaeste/neu"
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
        >
          + Gast anlegen
        </Link>
      </div>

      {/* Telefonnummer-Suche */}
      <form className="mb-6">
        <div className="flex gap-2">
          <input
            name="telefon"
            defaultValue={telefon}
            placeholder="Telefonnummer suchen…"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-white border border-gray-300 text-sm rounded-md hover:bg-gray-50"
          >
            Suchen
          </button>
          {telefon && (
            <Link
              href="/gaeste"
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
            >
              Zurücksetzen
            </Link>
          )}
        </div>
      </form>

      {/* Ergebnisliste */}
      {gaeste.length === 0 ? (
        <p className="text-gray-400 text-sm">
          {telefon ? "Kein Gast gefunden." : "Noch keine Gäste angelegt."}
        </p>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white">
          {gaeste.map((g) => (
            <div key={g.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium text-gray-900">
                  {g.vorname} {g.nachname}
                  {g.bella_card ? (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                      Bella-Card
                    </span>
                  ) : (
                    <span className="ml-2 text-xs text-gray-400">
                      noch {Math.max(0, 10 - g.besuchsanzahl)}× bis Bella-Card
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {g.telefon}
                  <span className="text-gray-400"> · {g.besuchsanzahl} Besuche</span>
                </div>
                {g.notiz && (
                  <div className="text-xs text-gray-400 mt-0.5">{g.notiz}</div>
                )}
              </div>
              <Link
                href={`/gaeste/${g.id}`}
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
