import { db } from "@/lib/db";
import Link from "next/link";
import { verfuegbarToggle } from "./actions";

export default async function SpeisekartePage({
  searchParams,
}: {
  searchParams: Promise<{ standort?: string }>;
}) {
  const { standort: standortParam } = await searchParams;

  const standorte = await db.standort.findMany({ orderBy: { name: "asc" } });

  const gewaehlterStandort = standortParam
    ? standorte.find((s) => s.id === parseInt(standortParam, 10))
    : standorte[0];

  const speisekarte = gewaehlterStandort
    ? await db.speisekarte.findUnique({
        where: { standort_id: gewaehlterStandort.id },
        include: {
          kategorien: {
            include: {
              gerichte: {
                include: {
                  allergene: { include: { allergen: true } },
                },
                orderBy: { name: "asc" },
              },
            },
            orderBy: { name: "asc" },
          },
        },
      })
    : null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Speisekarte</h1>
        <div className="flex gap-2">
          <Link
            href="/speisekarte/kategorien/neu"
            className="px-3 py-1.5 bg-white border border-gray-300 text-sm rounded-md hover:bg-gray-50"
          >
            + Kategorie
          </Link>
          <Link
            href="/speisekarte/gerichte/neu"
            className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
          >
            + Gericht
          </Link>
        </div>
      </div>

      {/* Standort-Auswahl */}
      <div className="flex gap-2 mb-6">
        {standorte.map((s) => (
          <a
            key={s.id}
            href={`/speisekarte?standort=${s.id}`}
            className={`px-3 py-1.5 text-sm rounded-md border ${
              gewaehlterStandort?.id === s.id
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s.name}
          </a>
        ))}
        <Link
          href="/speisekarte/gruppenmenues"
          className="ml-auto px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          Gruppenmenüs →
        </Link>
        <Link
          href="/speisekarte/allergene"
          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          Allergene →
        </Link>
      </div>

      {!speisekarte ? (
        <p className="text-gray-400 text-sm">
          Noch keine Speisekarte für{" "}
          {gewaehlterStandort?.name ?? "diesen Standort"}.
          <br />
          Legen Sie eine Kategorie an, um die Karte zu erstellen.
        </p>
      ) : speisekarte.kategorien.length === 0 ? (
        <p className="text-gray-400 text-sm">
          Noch keine Kategorien in der Speisekarte.
        </p>
      ) : (
        <div className="space-y-6">
          {speisekarte.kategorien.map((kat) => (
            <div key={kat.id}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {kat.name}
              </h2>
              {kat.gerichte.length === 0 ? (
                <p className="text-gray-400 text-xs pl-1">
                  Keine Gerichte in dieser Kategorie.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white">
                  {kat.gerichte.map((g) => {
                    // BV-014: Toggle-Action
                    const toggle = verfuegbarToggle.bind(null, g.id, !g.verfuegbar);

                    return (
                      <div
                        key={g.id}
                        className={`flex items-center justify-between px-4 py-3 ${
                          !g.verfuegbar ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                        {g.foto_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={g.foto_url}
                            alt={g.name}
                            className="h-12 w-12 object-cover rounded-md border border-gray-200 flex-shrink-0"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {g.name}
                            {!g.verfuegbar && (
                              <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                                Ausverkauft
                              </span>
                            )}
                            {g.ist_grillgericht && (
                              <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                                Grill
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {g.preis.toFixed(2)} €
                            {g.allergene.length > 0 && (
                              <span className="ml-2 text-xs text-gray-400">
                                Allergene:{" "}
                                {g.allergene
                                  .map((a) => a.allergen.kuerzel)
                                  .join(", ")}
                              </span>
                            )}
                          </div>
                          {g.beschreibung && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {g.beschreibung}
                            </div>
                          )}
                        </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* BV-014: Ausverkauft-Toggle */}
                          <form action={toggle}>
                            <button
                              type="submit"
                              className={`text-xs px-2 py-1 rounded border ${
                                g.verfuegbar
                                  ? "border-red-200 text-red-600 hover:bg-red-50"
                                  : "border-green-200 text-green-700 hover:bg-green-50"
                              }`}
                            >
                              {g.verfuegbar
                                ? "Ausverkauft"
                                : "Wieder verfügbar"}
                            </button>
                          </form>
                          <Link
                            href={`/speisekarte/gerichte/${g.id}`}
                            className="text-sm text-gray-400 hover:text-gray-900"
                          >
                            Bearbeiten →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
