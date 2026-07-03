import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { rechnungErstellen, zahlungHinzufuegen } from "../../actions";

export default async function RechnungPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rechnung_id?: string }>;
}) {
  const { id } = await params;
  const { rechnung_id: rechnungIdParam } = await searchParams;

  const bestellung = await db.bestellung.findUnique({
    where: { id: Number(id) },
    include: {
      tisch: true,
      standort: true,
      mitarbeiter: true,
      positionen: { include: { gericht: true }, orderBy: { id: "asc" } },
      rechnungen: {
        include: { zahlungen: true, gast: true },
        orderBy: { erstellt_am: "desc" },
      },
    },
  });

  if (!bestellung) notFound();

  const summe = bestellung.positionen.reduce(
    (acc, p) => acc + p.menge * p.gericht.preis,
    0
  );

  // Bereits vorhandene Rechnung?
  const existierendeRechnung =
    rechnungIdParam
      ? bestellung.rechnungen.find((r) => r.id === parseInt(rechnungIdParam, 10))
      : bestellung.rechnungen[0] ?? null;

  const gaeste = await db.gast.findMany({ orderBy: { nachname: "asc" } });

  const erstelleRechnung = rechnungErstellen.bind(null, bestellung.id);

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold text-gray-900">Rechnung</h1>
        <Link
          href={`/bestellungen/${bestellung.id}`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Zur Bestellung
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {bestellung.standort.name}
        {bestellung.tisch ? ` · Tisch ${bestellung.tisch.nummer}` : " · Abholung"} ·
        Bestellung #{bestellung.id}
      </p>

      {/* Positionen-Übersicht */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Positionen</h2>
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white">
          {bestellung.positionen.map((p) => (
            <div key={p.id} className="flex justify-between px-4 py-3 text-sm">
              <span className="text-gray-700">
                {p.menge}× {p.gericht.name}
              </span>
              <span className="text-gray-900 font-medium">
                {(p.menge * p.gericht.preis).toFixed(2)} €
              </span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 font-semibold text-gray-900 text-sm bg-gray-50 rounded-b-lg">
            <span>Zwischensumme</span>
            <span>{summe.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {!existierendeRechnung ? (
        /* Rechnung noch nicht erstellt */
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Rechnung erstellen
          </h2>
          <form action={erstelleRechnung} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gast (optional, für Bella-Card-Zuordnung)
              </label>
              <select
                name="gast_id"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Kein Gast zugeordnet</option>
                {gaeste.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.vorname} {g.nachname} · {g.telefon}
                    {g.bella_card
                      ? ` · Bella-Card (15% Rabatt)`
                      : ` · ${g.besuchsanzahl} Besuche`}
                  </option>
                ))}
              </select>
            </div>

            {/* BV-010: Hinweis Bella-Card */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              <div className="font-medium mb-1">
                Gesamtbetrag: {summe.toFixed(2)} €
              </div>
              <div className="text-xs text-amber-700">
                Bei Bella-Card-Inhaber: automatisch 15% Rabatt auf den
                Gesamtbetrag (inkl. Getränke).
                Bella-Card wird ab dem 10. Besuch aktiviert.
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
            >
              Rechnung abschließen
            </button>
          </form>
        </div>
      ) : (
        /* Rechnung bereits erstellt — Zahlungen verwalten */
        <div>
          {/* BV-010: Bella-Card-Rabatt anzeigen */}
          {existierendeRechnung.bella_card_rabatt && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              <span className="font-semibold">Bella-Card-Rabatt 15%</span>
              <span className="text-green-600 text-xs">
                ({summe.toFixed(2)} € → {existierendeRechnung.gesamt_betrag.toFixed(2)} €)
              </span>
              {existierendeRechnung.gast && (
                <span className="ml-auto text-xs text-green-600">
                  {existierendeRechnung.gast.vorname}{" "}
                  {existierendeRechnung.gast.nachname}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Zahlungen</h2>
            <div className="text-sm text-gray-500">
              Gesamt:{" "}
              <strong>{existierendeRechnung.gesamt_betrag.toFixed(2)} €</strong>
              {" · "}Offen:{" "}
              <strong>
                {Math.max(
                  0,
                  existierendeRechnung.gesamt_betrag -
                    existierendeRechnung.zahlungen.reduce(
                      (a, z) => a + z.betrag,
                      0
                    )
                ).toFixed(2)}{" "}
                €
              </strong>
            </div>
          </div>

          {existierendeRechnung.zahlungen.length > 0 ? (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white mb-4">
              {existierendeRechnung.zahlungen.map((z) => (
                <div key={z.id} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-gray-700">{z.zahlungsart}</span>
                  <span className="font-medium text-gray-900">
                    {z.betrag.toFixed(2)} €
                  </span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-3 text-sm bg-gray-50 rounded-b-lg font-semibold text-gray-900">
                <span>Bezahlt</span>
                <span>
                  {existierendeRechnung.zahlungen
                    .reduce((a, z) => a + z.betrag, 0)
                    .toFixed(2)}{" "}
                  €
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mb-4">
              Noch keine Zahlungen erfasst.
            </p>
          )}

          {/* Neue Zahlung */}
          <ZahlungForm
            rechnung_id={existierendeRechnung.id}
            bestellung_id={bestellung.id}
          />
        </div>
      )}
    </div>
  );
}

function ZahlungForm({
  rechnung_id,
  bestellung_id,
}: {
  rechnung_id: number;
  bestellung_id: number;
}) {
  const addZahlung = zahlungHinzufuegen.bind(null, rechnung_id, bestellung_id);

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Zahlung erfassen
      </h3>
      <form action={addZahlung} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Betrag (€) *
            </label>
            <input
              name="betrag"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Zahlungsart *
            </label>
            <select
              name="zahlungsart"
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="BAR">BAR</option>
              <option value="KARTE">KARTE</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
        >
          Zahlung erfassen
        </button>
      </form>
    </div>
  );
}
