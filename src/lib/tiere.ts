// Tiere im Minecraft-Earth-Stil: seltene Tappables auf der Karte.
// Sie spawnen wie Wild-Blöcke, geben beim Antippen aber Tier-Beute.

import type { Umwelt } from "./umwelt"

export type Tier = {
  id: string
  name: string
  sprite: string
}

const TIERE: Record<string, Tier> = {
  huhn: { id: "huhn", name: "Huhn", sprite: "/tiere/huhn.png" },
  schaf: { id: "schaf", name: "Schaf", sprite: "/tiere/schaf.png" },
  kuh: { id: "kuh", name: "Kuh", sprite: "/tiere/kuh.png" },
}

export function tierById(id: string): Tier | undefined {
  return TIERE[id]
}

export function istTier(id: string): boolean {
  return Boolean(TIERE[id])
}

// Ersetzt einen Block-Spawn gelegentlich durch ein Tier — Hühner in
// Park und Feld, Schafe und Kühe nur auf dem Feld (~1-2 von 8 Spawns).
export function tierFuerUmwelt(
  umwelt: Umwelt,
  zufall: () => number = Math.random,
): string | null {
  const wurf = zufall()
  if (umwelt === "park") {
    return wurf < 0.15 ? "huhn" : null
  }
  if (umwelt === "feld") {
    if (wurf < 0.1) return "huhn"
    if (wurf < 0.2) return "schaf"
    if (wurf < 0.3) return "kuh"
    return null
  }
  return null
}

export type TierBeute = {
  drops: { gegenstandId: string; anzahl: number }[]
  // Kuh melken: ein leerer Eimer wird zum Milcheimer
  eimerWirdMilch: boolean
}

export function tierDrops(
  tierId: string,
  inventar: Record<string, number>,
  zufall: () => number = Math.random,
): TierBeute {
  if (tierId === "huhn") {
    return {
      drops: [
        { gegenstandId: "feder", anzahl: 1 },
        { gegenstandId: "ei", anzahl: 1 },
      ],
      eimerWirdMilch: false,
    }
  }
  if (tierId === "schaf") {
    // Mit der Schere gibt es wie in Minecraft mehr Wolle
    const mitSchere = (inventar.schere ?? 0) > 0
    return {
      drops: [
        {
          gegenstandId: "wolle",
          anzahl: mitSchere ? 2 + (zufall() < 0.5 ? 1 : 0) : 1,
        },
      ],
      eimerWirdMilch: false,
    }
  }
  if (tierId === "kuh") {
    return {
      drops: [{ gegenstandId: "leder", anzahl: 1 }],
      eimerWirdMilch: (inventar.eimer ?? 0) > 0,
    }
  }
  return { drops: [], eimerWirdMilch: false }
}
