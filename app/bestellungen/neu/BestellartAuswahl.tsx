"use client";

import { useState } from "react";

interface Tisch {
  id: number;
  nummer: number;
  kapazitaet: number;
}

interface Standort {
  id: number;
  name: string;
  tische: Tisch[];
}

interface BestellartAuswahlProps {
  standorte: Standort[];
}

export function BestellartAuswahl({ standorte }: BestellartAuswahlProps) {
  const [bestellart, setBestellart] = useState<"TISCH" | "ABHOLUNG">("TISCH");

  return (
    <div className="space-y-4">
      {/* Bestellart-Radio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bestellart *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="bestellart"
              value="TISCH"
              checked={bestellart === "TISCH"}
              onChange={() => setBestellart("TISCH")}
              className="accent-gray-900"
            />
            <span className="text-sm text-gray-700">Tisch</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="bestellart"
              value="ABHOLUNG"
              checked={bestellart === "ABHOLUNG"}
              onChange={() => setBestellart("ABHOLUNG")}
              className="accent-gray-900"
            />
            <span className="text-sm text-gray-700">Abholung</span>
          </label>
        </div>
      </div>

      {/* Tisch-Feld — nur bei Bestellart TISCH */}
      {bestellart === "TISCH" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tisch *
          </label>
          <select
            name="tisch_id"
            required={bestellart === "TISCH"}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Tisch wählen …</option>
            {standorte.map((s) =>
              s.tische.map((t) => (
                <option key={t.id} value={t.id}>
                  {s.name} — Tisch {t.nummer} ({t.kapazitaet} Plätze)
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {/* Bei Abholung: unsichtbares leeres Feld für tisch_id */}
      {bestellart === "ABHOLUNG" && (
        <input type="hidden" name="tisch_id" value="" />
      )}
    </div>
  );
}
