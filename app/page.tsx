import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Bella Vista</h1>
      <p className="text-gray-500 mb-6">Interne Restaurantverwaltung · Kreuzberg & Spandau</p>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/gaeste" className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300">
          <div className="font-medium text-gray-900">Gäste</div>
          <div className="text-sm text-gray-500 mt-1">Anlegen & suchen</div>
        </Link>
        <Link href="/reservierungen" className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300">
          <div className="font-medium text-gray-900">Reservierungen</div>
          <div className="text-sm text-gray-500 mt-1">Heute & kommende</div>
        </Link>
        <Link href="/bestellungen" className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300">
          <div className="font-medium text-gray-900">Bestellungen</div>
          <div className="text-sm text-gray-500 mt-1">Tisch aufnehmen</div>
        </Link>
        <Link href="/speisekarte" className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300">
          <div className="font-medium text-gray-900">Speisekarte</div>
          <div className="text-sm text-gray-500 mt-1">Gerichte verwalten</div>
        </Link>
      </div>
    </div>
  );
}
