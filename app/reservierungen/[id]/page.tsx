import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { reservierungBearbeiten, noShowSetzen } from "../actions";

const FEHLERMELDUNGEN: Record<string, string> = {
  doppelbelegung:
    "Dieser Tisch ist im gewählten Zeitfenster (±2 Stunden) bereits belegt. Bitte anderen Tisch oder Zeit wählen.",
  ausserhalb_oeffnungszeiten:
    "Reservierungen sind nur zwischen 12:00 und 22:00 Uhr möglich (letzter Einlass 22:00).",
  gruppenraum_spandau:
    "Der Gruppenbereich ist nur im Standort Kreuzberg buchbar.",
  no_show_zu_frueh:
    "No-Show kann erst 20 Minuten nach dem Reservierungszeitpunkt gesetzt werden.",
};

export default async function ReservierungBearbeitenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const res = await db.reservierung.findUnique({
    where: { id: Number(id) },
    include: { gast: true, tisch: true, standort: true },
  });

  if (!res) notFound();

  const standorte = await db.standort.findMany({
    include: {
      tische: {
        include: { bereich: true },
        orderBy: { nummer: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const bearbeiten = reservierungBearbeiten.bind(null, res.id);
  const setzeNoShow = noShowSetzen.bind(null, res.id);

  const dt = new Date(res.datum_uhrzeit);
  const datumStr = dt.toISOString().split("T")[0];
  const zeitStr = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;

  // BV-009: No-Show-Button nur bei BESTAETIGT
  const karenzEnde = new Date(res.datum_uhrzeit.getTime() + 20 * 60 * 1000);
  const noShowMoeglich =
    res.status === "BESTAETIGT" && new Date() >= karenzEnde;
  const noShowZuFrueh =
    res.status === "BESTAETIGT" && new Date() < karenzEnde;

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Reservierung bearbeiten
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {res.gast.vorname} {res.gast.nachname} · {res.gast.telefon}
      </p>

      {/* Fehlermeldung */}
      {error && FEHLERMELDUNGEN[error] && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {FEHLERMELDUNGEN[error]}
        </div>
      )}

      {/* BV-009: No-Show-Bereich */}
      {(noShowMoeglich || noShowZuFrueh) && (
        <div className="mb-6 p-4 border border-amber-200 rounded-lg bg-amber-50">
          <p className="text-sm font-medium text-amber-800 mb-2">
            Gast erschienen?
          </p>
          {noShowZuFrueh ? (
            <p className="text-xs text-amber-700">
              No-Show kann erst 20 Minuten nach dem Reservierungszeitpunkt gesetzt
              werden (ab{" "}
              {karenzEnde.toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              Uhr).
            </p>
          ) : (
            <form action={setzeNoShow}>
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-700 text-white text-xs rounded-md hover:bg-amber-800"
              >
                No-Show setzen (Tisch freigeben)
              </button>
            </form>
          )}
        </div>
      )}

      <form action={bearbeiten} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Standort *
          </label>
          <select
            name="standort_id"
            required
            defaultValue={res.standort_id}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {standorte.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tisch (optional)
          </label>
          <select
            name="tisch_id"
            defaultValue={res.tisch_id ?? ""}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Kein Tisch zugewiesen</option>
            {standorte.map((s) =>
              s.tische.map((t) => {
                // BV-015: Gruppenbereich nur Kreuzberg
                const istGruppenraumSpandau =
                  t.bereich.name === "Gruppenbereich" && s.name === "Spandau";
                return (
                  <option
                    key={t.id}
                    value={t.id}
                    disabled={istGruppenraumSpandau}
                  >
                    {s.name} — Tisch {t.nummer} ({t.kapazitaet} Plätze,{" "}
                    {t.bereich.name})
                    {istGruppenraumSpandau ? " — nur Kreuzberg" : ""}
                  </option>
                );
              })
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Datum *
            </label>
            <input
              name="datum"
              type="date"
              required
              defaultValue={datumStr}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Uhrzeit *
            </label>
            <input
              name="uhrzeit"
              type="time"
              required
              defaultValue={zeitStr}
              min="12:00"
              max="22:00"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Personenanzahl *
          </label>
          <input
            name="personenanzahl"
            type="number"
            min={1}
            required
            defaultValue={res.personenanzahl}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            defaultValue={res.status}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="BESTAETIGT">BESTAETIGT</option>
            <option value="ERSCHIENEN">ERSCHIENEN</option>
            <option value="NO_SHOW">NO_SHOW</option>
            <option value="STORNIERT">STORNIERT</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notiz
          </label>
          <textarea
            name="notiz"
            rows={2}
            defaultValue={res.notiz ?? ""}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Speichern
          </button>
          <a
            href="/reservierungen"
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
          >
            Abbrechen
          </a>
        </div>
      </form>
    </div>
  );
}
