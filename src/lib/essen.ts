// Essen gibt Boosts statt Leben: In einem Lauf-Spiel hilft es mehr,
// weiter zu reichen und mehr Blöcke zu finden, als satt zu sein.

export type BoostArt = "radius" | "spawn" | "beides"

export type Boost = {
  art: BoostArt
  // Zeitstempel, bis wann der Boost gilt
  bis: number
}

export type EssenArt = {
  art: BoostArt
  dauerMs: number
  wirkung: string
}

export const RADIUS_FAKTOR = 1.4
export const SPAWN_BONUS = 4

const ESSEN: Record<string, EssenArt> = {
  brot: {
    art: "radius",
    dauerMs: 10 * 60_000,
    wirkung: "Grössere Reichweite beim Sammeln",
  },
  honigbrot: {
    art: "spawn",
    dauerMs: 15 * 60_000,
    wirkung: "Mehr Blöcke in der Nähe",
  },
  kuchen: {
    art: "beides",
    dauerMs: 20 * 60_000,
    wirkung: "Mehr Blöcke und grössere Reichweite",
  },
}

export function istEssen(id: string): boolean {
  return Boolean(ESSEN[id])
}

export function essenArt(id: string): EssenArt | undefined {
  return ESSEN[id]
}

// Essen startet den Boost neu; ein laufender gleicher Boost wird
// verlängert, ein anderer ersetzt.
export function iss(
  bisher: Boost | null,
  id: string,
  jetzt: number,
): Boost | null {
  const essen = ESSEN[id]
  if (!essen) return bisher
  const laeuftGleich =
    bisher && bisher.art === essen.art && bisher.bis > jetzt
  const start = laeuftGleich ? bisher!.bis : jetzt
  return { art: essen.art, bis: start + essen.dauerMs }
}

export function boostAktiv(boost: Boost | null, jetzt: number): boolean {
  return Boolean(boost && boost.bis > jetzt)
}

export function boostRestMs(boost: Boost | null, jetzt: number): number {
  if (!boost) return 0
  return Math.max(0, boost.bis - jetzt)
}

// Reichweiten-Faktor fürs Einsammeln
export function radiusFaktor(boost: Boost | null, jetzt: number): number {
  if (!boostAktiv(boost, jetzt)) return 1
  return boost!.art === "radius" || boost!.art === "beides"
    ? RADIUS_FAKTOR
    : 1
}

// Wie viele Wild-Blöcke zusätzlich spawnen
export function spawnBonus(boost: Boost | null, jetzt: number): number {
  if (!boostAktiv(boost, jetzt)) return 0
  return boost!.art === "spawn" || boost!.art === "beides" ? SPAWN_BONUS : 0
}

export function boostText(boost: Boost | null, jetzt: number): string {
  const rest = boostRestMs(boost, jetzt)
  if (rest <= 0 || !boost) return ""
  const sekunden = Math.ceil(rest / 1000)
  const minuten = Math.floor(sekunden / 60)
  const zeichen =
    boost.art === "radius" ? "🥖" : boost.art === "spawn" ? "🍯" : "🎂"
  return `${zeichen} ${minuten}:${`${sekunden % 60}`.padStart(2, "0")}`
}

export function parseBoost(roh: unknown): Boost | null {
  if (!roh || typeof roh !== "object") return null
  const wert = roh as { art?: unknown; bis?: unknown }
  if (wert.art !== "radius" && wert.art !== "spawn" && wert.art !== "beides") {
    return null
  }
  if (typeof wert.bis !== "number" || !Number.isFinite(wert.bis)) return null
  return { art: wert.art, bis: wert.bis }
}
