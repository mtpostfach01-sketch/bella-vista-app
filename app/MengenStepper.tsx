"use client";

import { useState } from "react";

// Touch-freundliche Mengen-Eingabe (+/- Buttons statt winzigem Zahlenfeld)
// für die Bestellaufnahme am Handy/Tablet
export function MengenStepper({ name = "menge" }: { name?: string }) {
  const [menge, setMenge] = useState(0);

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setMenge((m) => Math.max(0, m - 1))}
        aria-label="Weniger"
        className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 active:bg-gray-100"
      >
        −
      </button>
      <input
        type="number"
        name={name}
        min={0}
        value={menge}
        onChange={(e) => setMenge(Math.max(0, parseInt(e.target.value, 10) || 0))}
        className="w-10 text-center text-sm border border-gray-300 rounded-md py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      <button
        type="button"
        onClick={() => setMenge((m) => m + 1)}
        aria-label="Mehr"
        className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 active:bg-gray-100"
      >
        +
      </button>
    </div>
  );
}
