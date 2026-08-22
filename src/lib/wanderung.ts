// Wander-Truhe: wie ein Pokémon-Go-Ei — sie öffnet sich erst nach
// 2 km echter Gehstrecke. GPS-Sprünge zählen nicht.

import type { Lage } from "./orte"
import { distanzMeter } from "./reichweite"
import type { Beute } from "./sammeln"

export const WANDER_ZIEL_METER = 2000

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

const BELOHNUNGEN: Beute[][] = [
  [{ gegenstandId: "diamant", anzahl: 1 }],
  [{ gegenstandId: "eisenerz", anzahl: 3 }],
  [{ gegenstandId: "weizen", anzahl: 5 }],
  [{ gegenstandId: "smaragd", anzahl: 1 }],
]

export function oeffneWanderTruhe(
  zufall: () => number = Math.random,
): Beute[] {
  const index = Math.min(
    BELOHNUNGEN.length - 1,
    Math.floor(zufall() * BELOHNUNGEN.length),
  )
  return BELOHNUNGEN[index] ?? BELOHNUNGEN[0]!
}

export function parseWanderung(roh: unknown): number {
  if (typeof roh === "number" && Number.isFinite(roh) && roh >= 0) {
    return Math.min(roh, WANDER_ZIEL_METER)
  }
  return 0
}

export function wanderText(meter: number): string {
  const km = Math.min(meter, WANDER_ZIEL_METER) / 1000
  return `${km.toFixed(1)} / ${(WANDER_ZIEL_METER / 1000).toFixed(1)} km`
}
