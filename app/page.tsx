import Link from "next/link";
import { db } from "@/lib/db";
import { getAktiverMitarbeiter } from "@/lib/session";
import { sessionSetzen, sessionBeenden } from "@/app/session/actions";

const FEHLERMELDUNGEN: Record<string, string> = {
  kein_zugriff:
    "Kein Zugriff. Ihre Rolle erlaubt diese Seite nicht.",
  keine_session:
    "Bitte zuerst einen Mitarbeiter auswählen.",
  mitarbeiter_nicht_gefunden:
    "Mitarbeiter nicht gefunden.",
  kein_mitarbeiter:
    "Bitte einen Mitarbeiter auswählen.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const aktiver = await getAktiverMitarbeiter();
  const mitarbeiter = await db.mitarbeiter.findMany({
    include: { standort: true },
    orderBy: [{ rolle: "asc" }, { nachname: "asc" }],
  });

  const rolleBadge: Record<string, string> = {
    CHEF: "bg-purple-100 text-purple-700",
    MANAGER: "bg-blue-100 text-blue-700",
    BEDIENUNG: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Bella Vista</h1>
      <p className="text-gray-500 mb-6">
        Interne Restaurantverwaltung · Kreuzberg &amp; Spandau
      </p>

      {/* Fehlermeldung */}
      {error && FEHLERMELDUNGEN[error] && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {FEHLERMELDUNGEN[error]}
        </div>
      )}

      {/* BV-016: Session-Anzeige */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-white">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Angemeldeter Mitarbeiter
        </h2>
        {aktiver ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-medium text-gray-900">
                {aktiver.vorname} {aktiver.nachname}
              </span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  rolleBadge[aktiver.rolle] ?? "bg-gray-100 text-gray-500"
                }`}
              >
                {aktiver.rolle}
              </span>
              {aktiver.standort && (
                <span className="text-xs text-gray-500">
                  · {aktiver.standort.name}
                </span>
              )}
              {!aktiver.standort && aktiver.rolle === "CHEF" && (
                <span className="text-xs text-gray-500">· alle Standorte</span>
              )}
            </div>
            <form action={sessionBeenden}>
              <button
                type="submit"
                className="text-xs text-gray-500 hover:text-gray-900 underline"
              >
                Abmelden
              </button>
            </form>
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-3">
            Noch kein Mitarbeiter ausgewählt.
          </p>
        )}

        {/* Mitarbeiter wechseln / auswählen */}
        {mitarbeiter.length > 0 ? (
          <form action={sessionSetzen} className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            <select
              name="mitarbeiter_id"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              defaultValue=""
            >
              <option value="">Mitarbeiter wählen …</option>
              {mitarbeiter.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.vorname} {m.nachname} ({m.rolle}
                  {m.standort ? ` · ${m.standort.name}` : ""})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
            >
              {aktiver ? "Wechseln" : "Anmelden"}
            </button>
          </form>
        ) : (
          <p className="text-xs text-gray-400 mt-2">
            Noch keine Mitarbeiter angelegt.{" "}
            <a href="/mitarbeiter/neu" className="underline hover:text-gray-700">
              Mitarbeiter anlegen →
            </a>
          </p>
        )}
      </div>

      {/* Navigation-Kacheln */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/gaeste"
          className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300"
        >
          <div className="font-medium text-gray-900">Gäste</div>
          <div className="text-sm text-gray-500 mt-1">Anlegen &amp; suchen</div>
        </Link>
        <Link
          href="/reservierungen"
          className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300"
        >
          <div className="font-medium text-gray-900">Reservierungen</div>
          <div className="text-sm text-gray-500 mt-1">Heute &amp; kommende</div>
        </Link>
        <Link
          href="/bestellungen"
          className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300"
        >
          <div className="font-medium text-gray-900">Bestellungen</div>
          <div className="text-sm text-gray-500 mt-1">Tisch aufnehmen</div>
        </Link>
        <Link
          href="/speisekarte"
          className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300"
        >
          <div className="font-medium text-gray-900">Speisekarte</div>
          <div className="text-sm text-gray-500 mt-1">Gerichte verwalten</div>
        </Link>
        <Link
          href="/tische"
          className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300"
        >
          <div className="font-medium text-gray-900">Tische</div>
          <div className="text-sm text-gray-500 mt-1">Status &amp; Bereiche</div>
        </Link>
        <Link
          href="/mitarbeiter"
          className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300"
        >
          <div className="font-medium text-gray-900">Mitarbeiter</div>
          <div className="text-sm text-gray-500 mt-1">Team verwalten</div>
        </Link>
      </div>
    </div>
  );
}
