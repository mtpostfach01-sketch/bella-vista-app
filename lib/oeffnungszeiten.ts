/**
 * Öffnungszeiten je Standort (BR #9, #10) — aus spec.md §3
 * Kreuzberg: Di–So 12:00–15:00 & 18:00–23:00 (Montag Ruhetag)
 * Spandau:   Mi–So 17:00–22:00 (Montag + Dienstag Ruhetag)
 * Küchenschluss: 30 Min vor Schließung (KB 22:30 / SP 21:30)
 */

const RUHETAGE: Record<string, number[]> = {
  Kreuzberg: [1],    // 1 = Montag (JS: 0=So, 1=Mo, 2=Di ...)
  Spandau: [1, 2],   // Montag + Dienstag
};

function minutesOfDay(datum: Date): number {
  return datum.getHours() * 60 + datum.getMinutes();
}

function istRuhetag(datum: Date, standortName: string): boolean {
  const tag = datum.getDay();
  return (RUHETAGE[standortName] ?? RUHETAGE.Kreuzberg).includes(tag);
}

/** Ist der Standort zum gegebenen Zeitpunkt geöffnet? */
export function istGeoeffnet(datum: Date, standortName = "Kreuzberg"): boolean {
  if (istRuhetag(datum, standortName)) return false;
  const min = minutesOfDay(datum);
  if (standortName === "Spandau") {
    return min >= 17 * 60 && min < 22 * 60;
  }
  return (min >= 12 * 60 && min < 15 * 60) || (min >= 18 * 60 && min < 23 * 60);
}

/** Nimmt die Küche noch Bestellungen an? (30 Min vor Schließung Schluss) */
export function istKuecheOffen(datum: Date, standortName = "Kreuzberg"): boolean {
  if (istRuhetag(datum, standortName)) return false;
  const min = minutesOfDay(datum);
  if (standortName === "Spandau") {
    return min >= 17 * 60 && min < 21 * 60 + 30;
  }
  return (min >= 12 * 60 && min < 14 * 60 + 30) || (min >= 18 * 60 && min < 22 * 60 + 30);
}

/** Ist noch ein Einlass möglich? (= Küche offen) */
export function istEinlassMoeglich(datum: Date, standortName = "Kreuzberg"): boolean {
  return istKuecheOffen(datum, standortName);
}
