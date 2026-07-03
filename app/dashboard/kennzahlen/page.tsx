import { db } from "@/lib/db";
import { getAktiverMitarbeiter } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function KennzahlenPage() {
  const aktiver = await getAktiverMitarbeiter();

  // BV-016: Nur CHEF und MANAGER
  if (!aktiver) redirect("/session");
  if (aktiver.rolle === "BEDIENUNG") redirect("/");

  const jetzt = new Date();
  // Letzte 30 Tage
  const vor30Tagen = new Date(jetzt.getTime() - 30 * 24 * 60 * 60 * 1000);
  // Letzte 4 Wochen (28 Tage)
  const vor28Tagen = new Date(jetzt.getTime() - 28 * 24 * 60 * 60 * 1000);

  // Standort-Filter
  const standortFilter =
    aktiver.rolle === "CHEF" ? {} : { standort_id: aktiver.standort_id! };

  // ── Top 5 Gerichte (letzte 30 Tage) ─────────────────────────
  // Rohe Abfrage: Bestellpositionen gruppiert nach gericht_id
  const bestellpositionenRoh = await db.bestellposition.findMany({
    where: {
      bestellung: {
        erstellt_am: { gte: vor30Tagen },
        ...standortFilter,
      },
    },
    include: { gericht: true },
  });

  // Manuell aggregieren
  const gerichtMap = new Map<
    number,
    { name: string; menge: number; preis: number }
  >();
  for (const pos of bestellpositionenRoh) {
    const eintrag = gerichtMap.get(pos.gericht_id);
    if (eintrag) {
      eintrag.menge += pos.menge;
    } else {
      gerichtMap.set(pos.gericht_id, {
        name: pos.gericht.name,
        menge: pos.menge,
        preis: pos.gericht.preis,
      });
    }
  }
  const topGerichte = Array.from(gerichtMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.menge - a.menge)
    .slice(0, 5);

  // ── No-Show-Quote (letzte 30 Tage) ───────────────────────────
  const alleReservierungen30 = await db.reservierung.findMany({
    where: {
      datum_uhrzeit: { gte: vor30Tagen, lte: jetzt },
      status: { not: "STORNIERT" },
      ...standortFilter,
    },
  });
  const noShows = alleReservierungen30.filter((r) => r.status === "NO_SHOW").length;
  const noShowQuote =
    alleReservierungen30.length > 0
      ? Math.round((noShows / alleReservierungen30.length) * 100)
      : 0;

  // ── Umsatz pro Wochentag (letzte 4 Wochen) ───────────────────
  const rechnungen4Wochen = await db.rechnung.findMany({
    where: {
      erstellt_am: { gte: vor28Tagen, lte: jetzt },
      bestellung: { ...standortFilter },
    },
  });

  // 0=So, 1=Mo, …, 6=Sa → auf de-DE-Reihenfolge mappen (Mo=0)
  const wochentage = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const umsatzProTag: number[] = new Array(7).fill(0);
  const anzahlProTag: number[] = new Array(7).fill(0);
  for (const r of rechnungen4Wochen) {
    const tag = new Date(r.erstellt_am).getDay(); // 0=So
    const idx = tag === 0 ? 6 : tag - 1; // Mo=0 … So=6
    umsatzProTag[idx] += r.gesamt_betrag;
    anzahlProTag[idx]++;
  }

  // ── Top 5 Gäste (nach Besuchsanzahl) ─────────────────────────
  // Besuchsanzahl ist standortübergreifend (ADR-003) — keine Filterung nach Standort
  const topGaeste = await db.gast.findMany({
    orderBy: { besuchsanzahl: "desc" },
    take: 5,
  });

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Kennzahlen</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Letzte 30 Tage
            {aktiver.rolle === "MANAGER" && aktiver.standort
              ? ` · ${aktiver.standort.name}`
              : " · Alle Standorte"}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Gerichte */}
        <section className="border border-gray-200 rounded-lg bg-white p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Top 5 Gerichte (letzte 30 Tage)
          </h2>
          {topGerichte.length === 0 ? (
            <p className="text-sm text-gray-400">Keine Daten vorhanden.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 text-left font-medium">#</th>
                  <th className="pb-2 text-left font-medium">Gericht</th>
                  <th className="pb-2 text-right font-medium">Menge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topGerichte.map((g, i) => (
                  <tr key={g.id}>
                    <td className="py-2 text-gray-400">{i + 1}</td>
                    <td className="py-2 text-gray-800">{g.name}</td>
                    <td className="py-2 text-right font-medium text-gray-900">
                      {g.menge}×
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* No-Show-Quote */}
        <section className="border border-gray-200 rounded-lg bg-white p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            No-Show-Quote (letzte 30 Tage)
          </h2>
          <div className="flex items-baseline gap-3">
            <span
              className={`text-4xl font-bold ${
                noShowQuote > 15
                  ? "text-red-600"
                  : noShowQuote > 8
                  ? "text-amber-500"
                  : "text-green-600"
              }`}
            >
              {noShowQuote} %
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {noShows} No-Shows bei {alleReservierungen30.length} Reservierungen
          </p>
          <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                noShowQuote > 15
                  ? "bg-red-500"
                  : noShowQuote > 8
                  ? "bg-amber-400"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(noShowQuote, 100)}%` }}
            />
          </div>
        </section>

        {/* Umsatz pro Wochentag */}
        <section className="border border-gray-200 rounded-lg bg-white p-5 md:col-span-2">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Umsatz pro Wochentag (letzte 4 Wochen, Ø pro Tag)
          </h2>
          {rechnungen4Wochen.length === 0 ? (
            <p className="text-sm text-gray-400">Keine Daten vorhanden.</p>
          ) : (
            <div className="space-y-2">
              {wochentage.map((tag, idx) => {
                // Durchschnitt über 4 Wochen = 4 Tage je Wochentag
                const durchschnitt =
                  anzahlProTag[idx] > 0
                    ? umsatzProTag[idx] / 4
                    : 0;
                const maxUmsatz = Math.max(...umsatzProTag) / 4;
                const breite =
                  maxUmsatz > 0
                    ? Math.round((durchschnitt / maxUmsatz) * 100)
                    : 0;

                return (
                  <div key={tag} className="flex items-center gap-3">
                    <span className="w-6 text-sm text-gray-500">{tag}</span>
                    <div className="flex-1 bg-gray-100 rounded h-5 relative overflow-hidden">
                      <div
                        className="h-5 bg-gray-800 rounded"
                        style={{ width: `${breite}%` }}
                      />
                    </div>
                    <span className="w-20 text-right text-sm text-gray-700">
                      {durchschnitt.toFixed(2)} €
                    </span>
                    <span className="w-16 text-right text-xs text-gray-400">
                      {anzahlProTag[idx]} Rg.
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Top 5 Gäste */}
        <section className="border border-gray-200 rounded-lg bg-white p-5 md:col-span-2">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Meistbesuchte Gäste (standortübergreifend)
          </h2>
          {topGaeste.length === 0 ? (
            <p className="text-sm text-gray-400">Keine Gäste vorhanden.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 text-left font-medium">#</th>
                  <th className="pb-2 text-left font-medium">Name</th>
                  <th className="pb-2 text-left font-medium">Telefon</th>
                  <th className="pb-2 text-center font-medium">Bella-Card</th>
                  <th className="pb-2 text-right font-medium">Besuche</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topGaeste.map((g, i) => (
                  <tr key={g.id}>
                    <td className="py-2 text-gray-400">{i + 1}</td>
                    <td className="py-2 font-medium text-gray-900">
                      {g.vorname} {g.nachname}
                    </td>
                    <td className="py-2 text-gray-500">{g.telefon}</td>
                    <td className="py-2 text-center">
                      {g.bella_card ? (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                          aktiv
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">–</span>
                      )}
                    </td>
                    <td className="py-2 text-right font-bold text-gray-900">
                      {g.besuchsanzahl}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
