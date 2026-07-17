"use client";

import { useState } from "react";

interface Gruppenmenue {
  id: number;
  bezeichnung: string;
  fixpreis: number;
  ab_personenzahl: number;
  standort: { name: string };
}

export function PersonenanzahlUndGruppenmenue({
  gruppenmenues,
}: {
  gruppenmenues: Gruppenmenue[];
}) {
  const [personenanzahl, setPersonenanzahl] = useState(2);

  // BR #6: Schwelle über alle verfügbaren Gruppenmenüs (Standort wird im
  // Formular separat gewählt, daher konservativ die niedrigste Schwelle)
  const schwelle =
    gruppenmenues.length > 0
      ? Math.min(...gruppenmenues.map((g) => g.ab_personenzahl))
      : 8;
  const empfohlen = personenanzahl >= schwelle;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Personenanzahl *
        </label>
        <input
          name="personenanzahl"
          type="number"
          min={1}
          required
          value={personenanzahl}
          onChange={(e) => setPersonenanzahl(parseInt(e.target.value, 10) || 1)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {/* BV-105: Gruppenmenü + Anzahlung — ab BR #6-Schwellwert prominent
          vorgeschlagen, aber fallweise/optional (W7) — kein Zwang */}
      <fieldset
        className={`rounded-lg p-3 space-y-3 border transition-colors ${
          empfohlen
            ? "border-amber-300 bg-amber-50"
            : "border-gray-200"
        }`}
      >
        <legend
          className={`text-xs px-1 ${
            empfohlen ? "text-amber-700 font-medium" : "text-gray-500"
          }`}
        >
          {empfohlen
            ? `Gruppenmenü empfohlen ab ${schwelle} Personen`
            : `Gruppen (ab ${schwelle} Personen empfohlen)`}
        </legend>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gruppenmenü {empfohlen ? "" : "(optional)"}
          </label>
          <select
            name="gruppenmenue_id"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Kein Gruppenmenü (à la carte)</option>
            {gruppenmenues.map((g) => (
              <option key={g.id} value={g.id}>
                {g.standort.name} — {g.bezeichnung} ({g.fixpreis.toFixed(2)} €,
                ab {g.ab_personenzahl} Pers.)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Anzahlung (€, optional — fallweise, BR #23)
          </label>
          <input
            name="anzahlung_betrag"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </fieldset>
    </div>
  );
}
