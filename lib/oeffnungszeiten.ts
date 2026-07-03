/**
 * Öffnungszeiten-Hilfsfunktionen (BV-011)
 * Öffnungszeiten: 12:00–23:00 Uhr täglich, beide Standorte (Phase 1: hardcoded)
 * Küchenschluss: 22:00 Uhr — keine neuen Bestellungen nach 22:00
 * Letzter Einlass (Reservierung): 22:00 Uhr
 */

export function istGeoeffnet(datum: Date): boolean {
  const h = datum.getHours();
  return h >= 12 && h < 23;
}

export function istKuecheOffen(datum: Date): boolean {
  const h = datum.getHours();
  return h >= 12 && h < 22;
}

/** Letzter Einlass = Küchenschluss 22:00 */
export function istEinlassMoeglich(datum: Date): boolean {
  return istKuecheOffen(datum);
}
