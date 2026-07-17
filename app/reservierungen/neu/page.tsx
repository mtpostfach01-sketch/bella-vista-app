import { db } from "@/lib/db";
import Link from "next/link";
import { reservierungAnlegen } from "../actions";
import { PersonenanzahlUndGruppenmenue } from "./PersonenanzahlUndGruppenmenue";

const FEHLERMELDUNGEN: Record<string, string> = {
  doppelbelegung:
    "Dieser Tisch ist im gewählten Zeitfenster (±2 Stunden) bereits belegt. Bitte anderen Tisch oder eine andere Zeit wählen.",
  ausserhalb_oeffnungszeiten:
    "Reservierungen sind nur zwischen 12:00 und 22:00 Uhr möglich (letzter Einlass 22:00).",
  gruppenraum_spandau:
    "Der Gruppenbereich ist nur im Standort Kreuzberg buchbar. Bitte einen anderen Tisch wählen.",
};

export default async function ReservierungNeuPage({
  searchParams,
}: {
  searchParams: Promise<{
    telefon?: string;
    error?: string;
    tisch_id?: string;
    datum?: string;
    uhrzeit?: string;
  }>;
}) {
  const { telefon, error, tisch_id, datum: datumParam, uhrzeit: uhrzeitParam } =
    await searchParams;

  // Gäste: bei Suche gefiltert, sonst alle
  const gaeste = await db.gast.findMany({
    where: telefon ? { telefon: { contains: telefon } } : undefined,
    orderBy: { nachname: "asc" },
  });

  const standorte = await db.standort.findMany({
    include: {
      tische: {
        include: { bereich: true },
        orderBy: { nummer: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const heute = new Date().toISOString().split("T")[0];

  // BV-105: Gruppenmenüs für Auswahl (BR #6, ab Schwellwert je Standort)
  const gruppenmenues = await db.gruppenmenue.findMany({
    include: { standort: true },
    orderBy: { standort: { name: "asc" } },
  });

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Reservierung anlegen
      </h1>

      {/* Fehlermeldung */}
      {error && FEHLERMELDUNGEN[error] && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {FEHLERMELDUNGEN[error]}
        </div>
      )}

      {/* Gast-Suche */}
      <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Gast per Telefonnummer suchen
        </p>
        <form className="flex gap-2">
          <input
            name="telefon"
            defaultValue={telefon}
            placeholder="Telefonnummer …"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-white border border-gray-300 text-sm rounded-md hover:bg-gray-50"
          >
            Suchen
          </button>
          {telefon && (
            <Link
              href="/reservierungen/neu"
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900"
            >
              Alle
            </Link>
          )}
        </form>
        {telefon && gaeste.length === 0 && (
          <p className="text-xs text-gray-400 mt-2">
            Kein Gast gefunden.{" "}
            <Link href="/gaeste/neu" className="underline hover:text-gray-700">
              Neuen Gast anlegen →
            </Link>
          </p>
        )}
      </div>

      <form action={reservierungAnlegen} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gast *
          </label>
          <select
            name="gast_id"
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Gast wählen …</option>
            {gaeste.map((g) => (
              <option key={g.id} value={g.id}>
                {g.vorname} {g.nachname} · {g.telefon}
                {g.bella_card
                  ? " · Bella-Card"
                  : ` · ${g.besuchsanzahl} Besuche`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Standort *
          </label>
          <select
            name="standort_id"
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Standort wählen …</option>
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
            defaultValue={tisch_id ?? ""}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Kein Tisch zugewiesen</option>
            {standorte.map((s) =>
              s.tische.map((t) => {
                // BV-015: Gruppenbereich nur Kreuzberg — deaktivieren in Spandau
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Datum *
            </label>
            <input
              name="datum"
              type="date"
              required
              defaultValue={datumParam ?? heute}
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
              defaultValue={uhrzeitParam ?? "19:00"}
              min="12:00"
              max="22:00"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <p className="text-xs text-gray-400 mt-1">
              Öffnungszeiten: 12:00–22:00 Uhr (letzter Einlass)
            </p>
          </div>
        </div>

        <PersonenanzahlUndGruppenmenue gruppenmenues={gruppenmenues} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notiz (z. B. Geburtstag, Allergie)
          </label>
          <textarea
            name="notiz"
            rows={2}
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
          <Link
            href="/reservierungen"
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
