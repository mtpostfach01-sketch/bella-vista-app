import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { mitarbeiterBearbeiten } from "../actions";

const FEHLERMELDUNGEN: Record<string, string> = {
  passwort_zu_kurz: "Das Passwort muss mindestens 4 Zeichen lang sein.",
};

export default async function MitarbeiterBearbeitenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const mitarbeiter = await db.mitarbeiter.findUnique({
    where: { id: Number(id) },
    include: { standort: true },
  });

  if (!mitarbeiter) notFound();

  const standorte = await db.standort.findMany({ orderBy: { name: "asc" } });

  const bearbeiten = mitarbeiterBearbeiten.bind(null, mitarbeiter.id);

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        {mitarbeiter.vorname} {mitarbeiter.nachname}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {mitarbeiter.rolle}
        {mitarbeiter.standort && ` · ${mitarbeiter.standort.name}`}
      </p>

      {error && FEHLERMELDUNGEN[error] && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {FEHLERMELDUNGEN[error]}
        </div>
      )}

      <form action={bearbeiten} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vorname *
            </label>
            <input
              name="vorname"
              required
              defaultValue={mitarbeiter.vorname}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nachname *
            </label>
            <input
              name="nachname"
              required
              defaultValue={mitarbeiter.nachname}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-Mail *
          </label>
          <input
            name="email"
            type="email"
            required
            defaultValue={mitarbeiter.email}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Neues Passwort (leer lassen, um es nicht zu ändern)
          </label>
          <input
            name="passwort"
            type="password"
            minLength={4}
            placeholder="Mind. 4 Zeichen"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rolle *
          </label>
          <select
            name="rolle"
            required
            defaultValue={mitarbeiter.rolle}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="CHEF">CHEF (alle Standorte)</option>
            <option value="MANAGER">MANAGER</option>
            <option value="BEDIENUNG">BEDIENUNG</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Standort
          </label>
          <select
            name="standort_id"
            defaultValue={mitarbeiter.standort_id ?? ""}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Kein Standort (nur bei CHEF)</option>
            {standorte.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Speichern
          </button>
          <Link
            href="/mitarbeiter"
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900"
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
