import { db } from "@/lib/db";
import Link from "next/link";

export default async function BestellungenPage() {
  const standorte = await db.standort.findMany({
    include: {
      bestellungen: {
        include: {
          tisch: true,
          mitarbeiter: true,
          positionen: { include: { gericht: true } },
          kuechenauftrag: true,
        },
        orderBy: { erstellt_am: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const statusBadge: Record<string, string> = {
    OFFEN: "bg-amber-100 text-amber-700",
    IN_ZUBEREITUNG: "bg-blue-100 text-blue-700",
    SERVIERT: "bg-green-100 text-green-700",
    BEZAHLT: "bg-gray-100 text-gray-500",
    STORNIERT: "bg-red-100 text-red-600",
  };

  const bestellartBadge: Record<string, string> = {
    ABHOLUNG: "bg-purple-100 text-purple-700",
    CATERING: "bg-blue-100 text-blue-700",
  };

  const gesamtAnzahl = standorte.reduce((a, s) => a + s.bestellungen.length, 0);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Bestellungen</h1>
        <Link
          href="/bestellungen/neu"
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
        >
          + Bestellung anlegen
        </Link>
      </div>

      {gesamtAnzahl === 0 ? (
        <p className="text-gray-400 text-sm">Noch keine Bestellungen vorhanden.</p>
      ) : (
        // Nach Standort gruppiert — jede Bestellung gehört immer zu genau
        // einem Standort (ADR-001), daher kein "standortübergreifend"-Fall
        standorte.map((standort) => (
          <div key={standort.id} className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {standort.name} ({standort.bestellungen.length})
            </h2>
            {standort.bestellungen.length === 0 ? (
              <p className="text-gray-400 text-sm">Keine Bestellungen.</p>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white">
                {standort.bestellungen.map((b) => {
                  const summe = b.positionen.reduce(
                    (acc, p) => acc + p.menge * p.einzelpreis,
                    0
                  );
                  const zeitStr = new Date(b.erstellt_am).toLocaleString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div key={b.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {b.tisch ? `Tisch ${b.tisch.nummer}` : "Kein Tisch"}
                          {bestellartBadge[b.bestellart] && (
                            <span
                              className={`ml-2 text-xs px-1.5 py-0.5 rounded ${bestellartBadge[b.bestellart]}`}
                            >
                              {b.bestellart === "ABHOLUNG" ? "Abholung" : "Catering"}
                            </span>
                          )}
                          <span
                            className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                              statusBadge[b.status] ?? "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {b.positionen.length} Position(en) · {summe.toFixed(2)} € ·{" "}
                          {b.mitarbeiter.vorname} {b.mitarbeiter.nachname}
                        </div>
                        <div className="text-xs text-gray-400">{zeitStr}</div>
                      </div>
                      <Link
                        href={`/bestellungen/${b.id}`}
                        className="text-sm text-gray-400 hover:text-gray-900"
                      >
                        Details →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
