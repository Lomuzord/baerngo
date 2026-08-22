// Gehstrecken-Zählung für die Tagesaufgabe "Laufe 2 km".
// GPS-Sprünge und Zitterstand zählen nicht.

import type { Lage } from "./orte"
import { distanzMeter } from "./reichweite"

// Nur plausible Schritte zählen: pro Fix höchstens 50 m (kein
// GPS-Teleport), Genauigkeit unter 30 m, und mindestens 2 m Bewegung,
// damit Zitterstand nicht langsam Kilometer sammelt.
export function distanzZuwachs(
  vorher: Lage | null,
  jetzt: Lage,
  genauigkeit?: number,
): number {
  if (!vorher) return 0
  if (typeof genauigkeit === "number" && genauigkeit > 30) return 0
  const d = distanzMeter(vorher, jetzt)
  if (d < 2 || d >= 50) return 0
  return d
}
