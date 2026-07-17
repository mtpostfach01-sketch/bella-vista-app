import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Einfaches Passwort-Hashing mit Node-eigenem crypto (kein zusätzliches
// Package nötig). Format im DB-Feld: "salt:hash" (beides hex).
export function passwortHashen(klartext: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(klartext, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function passwortPruefen(klartext: string, gespeichertesHash: string): boolean {
  const [salt, hash] = gespeichertesHash.split(":");
  if (!salt || !hash) return false;
  const pruefHash = scryptSync(klartext, salt, 64);
  const gespeichert = Buffer.from(hash, "hex");
  if (pruefHash.length !== gespeichert.length) return false;
  return timingSafeEqual(pruefHash, gespeichert);
}
