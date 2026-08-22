// Untergrund-Mine: unter der Bauplatte liegen 16 prozedurale
// Schichten. Deterministisch pro Zelle — jeder gräbt dieselbe Welt aus.

import { EBENE_RADIUS_ZELLEN } from "./spielflaeche"

export const MINE_MAX_TIEFE = 16
export const MINE_SEED = "baerngo-mine-v1"

// Welcher Block liegt bei (ix, iz) in dieser Tiefe?
export function schichtBlock(
  seed: string,
  ix: number,
  iz: number,
  tiefe: number,
): string {
  const wuerfel = mulberry32(hash(`${seed}:${ix}:${iz}:${tiefe}`))
  const w = wuerfel()
  if (tiefe <= 2) {
    return w < 0.7 ? "erde" : "kies"
  }
  if (tiefe <= 6) {
    if (w < 0.15) return "kohleerz"
    if (w < 0.4) return "bruchstein"
    return "stein"
  }
  if (tiefe <= 11) {
    if (w < 0.12) return "eisenerz"
    if (w < 0.17) return "golderz"
    if (w < 0.25) return "granit"
    return "stein"
  }
  if (w < 0.06) return "diamanterz"
  if (w < 0.12) return "lehm"
  if (w < 0.2) return "granit"
  return "stein"
}

export function mineSchluessel(ix: number, iz: number, tiefe: number): string {
  return `${ix},${iz},${tiefe}`
}

export function parseMine(roh: unknown): string[] {
  if (!Array.isArray(roh)) return []
  const gueltig = new Set<string>()
  for (const eintrag of roh) {
    if (typeof eintrag !== "string") continue
    const teile = eintrag.split(",").map((wert) => Number.parseInt(wert, 10))
    if (teile.length !== 3 || teile.some((wert) => !Number.isFinite(wert))) {
      continue
    }
    const [ix, iz, tiefe] = teile as [number, number, number]
    if (
      Math.abs(ix) > EBENE_RADIUS_ZELLEN ||
      Math.abs(iz) > EBENE_RADIUS_ZELLEN ||
      tiefe < 1 ||
      tiefe > MINE_MAX_TIEFE
    ) {
      continue
    }
    gueltig.add(mineSchluessel(ix, iz, tiefe))
  }
  return [...gueltig]
}

// Wie tief ist diese Spalte schon ausgehoben? (0 = unberührt)
export function grabTiefe(
  abgebaut: readonly string[],
  ix: number,
  iz: number,
): number {
  const schon = new Set(abgebaut)
  let tiefe = 0
  while (
    tiefe < MINE_MAX_TIEFE &&
    schon.has(mineSchluessel(ix, iz, tiefe + 1))
  ) {
    tiefe++
  }
  return tiefe
}

// Die nächste grabbare Schicht — null am Grundgestein.
export function naechsteSchicht(
  abgebaut: readonly string[],
  ix: number,
  iz: number,
  seed: string = MINE_SEED,
): { tiefe: number; art: string } | null {
  if (Math.abs(ix) > EBENE_RADIUS_ZELLEN || Math.abs(iz) > EBENE_RADIUS_ZELLEN) {
    return null
  }
  const tiefe = grabTiefe(abgebaut, ix, iz) + 1
  if (tiefe > MINE_MAX_TIEFE) return null
  return { tiefe, art: schichtBlock(seed, ix, iz, tiefe) }
}

// Baut die nächste Schicht ab; null, wenn nichts mehr geht.
export function baueAb(
  abgebaut: string[],
  ix: number,
  iz: number,
  seed: string = MINE_SEED,
): { abgebaut: string[]; tiefe: number; art: string } | null {
  const schicht = naechsteSchicht(abgebaut, ix, iz, seed)
  if (!schicht) return null
  return {
    abgebaut: [...abgebaut, mineSchluessel(ix, iz, schicht.tiefe)],
    tiefe: schicht.tiefe,
    art: schicht.art,
  }
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
