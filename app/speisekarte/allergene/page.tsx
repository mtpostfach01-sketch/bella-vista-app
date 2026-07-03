import { db } from "@/lib/db";

export default async function AllergeneSeite() {
  const allergene = await db.allergen.findMany({ orderBy: { kuerzel: "asc" } });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Allergene</h1>
        <a
          href="/speisekarte"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Zurück zur Speisekarte
        </a>
      </div>

      {allergene.length === 0 ? (
        <p className="text-gray-400 text-sm">
          Keine Allergene vorhanden. Bitte Seed ausführen.
        </p>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white">
          {allergene.map((a) => (
            <div key={a.id} className="flex items-center gap-4 px-4 py-3">
              <span className="font-mono font-semibold text-gray-900 w-6 text-center">
                {a.kuerzel}
              </span>
              <span className="text-sm text-gray-700">{a.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
