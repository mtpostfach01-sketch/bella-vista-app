import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { gastBearbeiten } from "../actions";

export default async function GastBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gast = await db.gast.findUnique({ where: { id: Number(id) } });

  if (!gast) notFound();

  const bearbeiten = gastBearbeiten.bind(null, gast.id);

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        {gast.vorname} {gast.nachname}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {gast.besuchsanzahl} Besuche
        {gast.bella_card && " · Bella-Card aktiv"}
      </p>
      <form action={bearbeiten} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vorname *
            </label>
            <input
              name="vorname"
              required
              defaultValue={gast.vorname}
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
              defaultValue={gast.nachname}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefonnummer *
          </label>
          <input
            name="telefon"
            type="tel"
            required
            defaultValue={gast.telefon}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-Mail
          </label>
          <input
            name="email"
            type="email"
            defaultValue={gast.email ?? ""}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lieblingstisch
          </label>
          <input
            name="lieblingstisch"
            placeholder="z. B. Tisch 4 Terrasse"
            defaultValue={gast.lieblingstisch ?? ""}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notiz (z. B. Allergien, Sonderwünsche)
          </label>
          <textarea
            name="notiz"
            rows={3}
            defaultValue={gast.notiz ?? ""}
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
          <Link href="/gaeste" className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
