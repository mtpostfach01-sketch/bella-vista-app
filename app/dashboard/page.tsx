import { db } from "@/lib/db";
import { getAktiverMitarbeiter } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const aktiver = await getAktiverMitarbeiter();

  // BV-016: BEDIENUNG hat keinen Zugriff
  if (!aktiver) redirect("/session");
  if (aktiver.rolle === "BEDIENUNG") redirect("/");

  // Zeitraum: Heute (00:00 – 23:59:59)
  const heute = new Date();
  const tagesStart = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate(), 0, 0, 0);
  const tagesEnde = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate(), 23, 59, 59);

  // Standorte ermitteln — Chef: alle · Manager: nur eigener
  const standorte = await db.standort.findMany({
    where:
      aktiver.rolle === "CHEF"
        ? undefined
        : { id: aktiver.standort_id! },
    include: {
      tische: true,
      reservierungen: {
        where: {
          datum_uhrzeit: { gte: tagesStart, lte: tagesEnde },
        },
      },
      bestellungen: {
        where: { status: { in: ["OFFEN", "IN_ZUBEREITUNG"] } },
      },
    },
    orderBy: { name: "asc" },
  });

  // Umsatz heute je Standort
  const umsatzHeute = await Promise.all(
    standorte.map(async (s) => {
      const rechnungen = await db.rechnung.findMany({
        where: {
          erstellt_am: { gte: tagesStart, lte: tagesEnde },
          bestellung: { standort_id: s.id },
        },
      });
      return {
        standort_id: s.id,
        summe: rechnungen.reduce((acc, r) => acc + r.gesamt_betrag, 0),
      };
    })
  );

  // Nächste 10 Reservierungen heute (aufsteigend nach Uhrzeit)
  const naechsteReservierungen = await db.reservierung.findMany({
    where: {
      datum_uhrzeit: { gte: tagesStart, lte: tagesEnde },
      status: { not: "STORNIERT" },
      ...(aktiver.rolle !== "CHEF" ? { standort_id: aktiver.standort_id! } : {}),
    },
    include: {
      gast: true,
      tisch: true,
      standort: true,
    },
    orderBy: { datum_uhrzeit: "asc" },
    take: 10,
  });

  // Offene Küchenaufträge
  const kuechenauftraege = await db.kuechenauftrag.findMany({
    where: {
      status: { in: ["OFFEN", "IN_ARBEIT"] },
      bestellung: {
        ...(aktiver.rolle !== "CHEF" ? { standort_id: aktiver.standort_id! } : {}),
      },
    },
    include: {
      bestellung: {
        include: {
          tisch: true,
          standort: true,
          positionen: true,
        },
      },
    },
    orderBy: { erstellt_am: "asc" },
  });

  // Status-Badge Farben
  const resStatusBadge: Record<string, string> = {
    BESTAETIGT: "bg-green-100 text-green-700",
    NO_SHOW: "bg-red-100 text-red-700",
    STORNIERT: "bg-gray-100 text-gray-400",
    ERSCHIENEN: "bg-blue-100 text-blue-700",
  };

  const kuecheStatusBadge: Record<string, string> = {
    OFFEN: "bg-amber-100 text-amber-700",
    IN_ARBEIT: "bg-blue-100 text-blue-700",
    FERTIG: "bg-green-100 text-green-700",
  };

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {heute.toLocaleDateString("de-DE", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Link
          href="/dashboard/kennzahlen"
          className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
        >
          Kennzahlen →
        </Link>
      </div>

      {/* Block 1 — Heute auf einen Blick */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Heute auf einen Blick
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {standorte.map((s) => {
            const reservierungen = s.reservierungen;
            const erschienen = reservierungen.filter((r) => r.status === "ERSCHIENEN").length;
            const erwartet = reservierungen.filter((r) => r.status === "BESTAETIGT").length;
            const noShow = reservierungen.filter((r) => r.status === "NO_SHOW").length;

            const tische = s.tische;
            const belegteTische = tische.filter(
              (t) => t.status === "BESETZT" || t.status === "RESERVIERT"
            ).length;

            const offeneBestellungen = s.bestellungen.length;

            const umsatzEintrag = umsatzHeute.find((u) => u.standort_id === s.id);
            const umsatz = umsatzEintrag?.summe ?? 0;

            return (
              <div
                key={s.id}
                className="border border-gray-200 rounded-lg bg-white p-5"
              >
                <h3 className="font-semibold text-gray-900 mb-4">{s.name}</h3>

                <div className="space-y-3">
                  {/* Reservierungen */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Reservierungen</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {reservierungen.length}
                      </span>
                      <span className="text-sm text-gray-500">gesamt</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs">
                      <span className="text-blue-600">{erschienen} erschienen</span>
                      <span className="text-green-600">{erwartet} erwartet</span>
                      <span className="text-red-500">{noShow} No-Show</span>
                    </div>
                  </div>

                  {/* Tisch-Auslastung */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Tisch-Auslastung</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {belegteTische}
                      </span>
                      <span className="text-sm text-gray-500">
                        von {tische.length} Tischen belegt
                      </span>
                    </div>
                    {tische.length > 0 && (
                      <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-gray-800 h-1.5 rounded-full"
                          style={{
                            width: `${Math.round((belegteTische / tische.length) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Offene Bestellungen */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Offene Bestellungen</div>
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-2xl font-bold ${
                          offeneBestellungen > 0 ? "text-amber-600" : "text-gray-900"
                        }`}
                      >
                        {offeneBestellungen}
                      </span>
                      <span className="text-sm text-gray-500">
                        {offeneBestellungen === 1 ? "Bestellung" : "Bestellungen"} offen
                      </span>
                    </div>
                  </div>

                  {/* Umsatz heute */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Umsatz heute</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {umsatz.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Block 2 — Nächste Reservierungen */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Reservierungen heute (nächste {naechsteReservierungen.length})
        </h2>

        {naechsteReservierungen.length === 0 ? (
          <p className="text-sm text-gray-400">Keine Reservierungen heute.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                    Uhrzeit
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                    Gast
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                    Personen
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                    Tisch
                  </th>
                  {aktiver.rolle === "CHEF" && (
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                      Standort
                    </th>
                  )}
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {naechsteReservierungen.map((r) => {
                  const dt = new Date(r.datum_uhrzeit);
                  const zeitStr = dt.toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">
                        {zeitStr} Uhr
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">
                        {r.gast.vorname} {r.gast.nachname}
                        {r.gast.bella_card && (
                          <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1 rounded">
                            Bella-Card
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {r.personenanzahl}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {r.tisch ? `Tisch ${r.tisch.nummer}` : "–"}
                      </td>
                      {aktiver.rolle === "CHEF" && (
                        <td className="px-4 py-2.5 text-gray-500 text-xs">
                          {r.standort.name}
                        </td>
                      )}
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            resStatusBadge[r.status] ?? "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Block 3 — Küche (offene Küchenaufträge) */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Küche — offene Aufträge ({kuechenauftraege.length})
        </h2>

        {kuechenauftraege.length === 0 ? (
          <p className="text-sm text-gray-400">Keine offenen Küchenaufträge.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
            {kuechenauftraege.map((k) => {
              const dt = new Date(k.erstellt_am);
              const zeitStr = dt.toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              });
              // Minuten seit Erstellung
              const minSeit = Math.floor(
                (heute.getTime() - dt.getTime()) / 60000
              );

              return (
                <div
                  key={k.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {k.bestellung.standort.name}
                      {k.bestellung.tisch
                        ? ` · Tisch ${k.bestellung.tisch.nummer}`
                        : " · Abholung"}
                      <span
                        className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                          kuecheStatusBadge[k.status] ?? "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {k.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {k.bestellung.positionen.length} Position(en) · seit {zeitStr}{" "}
                      Uhr
                    </div>
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      minSeit > 20 ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {minSeit} Min.
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
