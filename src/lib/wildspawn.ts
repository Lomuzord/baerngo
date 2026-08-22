import { listOrte, type Lage } from "./orte"
import { distanzMeter, lageVersetzt } from "./reichweite"
import { spawnErlaubt, spawnFuerUmwelt, type Umwelt } from "./umwelt"

export const WILD_ANZAHL = 8
export const WILD_RADIUS_MIN = 32
export const WILD_RADIUS_MAX = 70
export const WILD_SAMMEL_METER = 22
export const WILD_LAUF_METER = 40
const GPS_ZU_SAMMEL_MAX = 10

export function sammelRadius(genauigkeit?: number): number {
  const gps =
    typeof genauigkeit === "number" && Number.isFinite(genauigkeit)
      ? Math.max(0, genauigkeit)
      : 0
  return WILD_SAMMEL_METER + Math.min(GPS_ZU_SAMMEL_MAX, Math.round(gps * 0.4))
}
export const WILD_DESPAWN_METER = 95
export const WILD_PAUSE_MS = 8 * 60 * 1000
const FALLBACK_BLOECKE = [
  "gras",
  "stamm",
  "stein",
  "kies",
  "laub",
  "sand",
  "kohleerz",
  "lehm",
  "sandstein",
] as const
const SICHT_ABSTAND_METER = 28
const MIN_ABSTAND_METER = 12

export type WildBlock = {
  id: string
  gegenstandId: string
  lage: Lage
  umwelt: Umwelt
  seit: number
}

export function aktualisiereWild(
  bisher: WildBlock[],
  spieler: Lage,
  umweltAn: (lage: Lage) => Umwelt,
  jetzt = Date.now(),
  blick?: number,
  letzteSpawn?: Lage,
  letzteSpawnZeit?: number,
): { bloecke: WildBlock[]; letzteSpawn: Lage; letzteSpawnZeit: number } {
  const bleiben = bisher.filter((block) => {
    if (jetzt - block.seit > WILD_PAUSE_MS) return false
    return distanzMeter(spieler, block.lage) <= WILD_DESPAWN_METER
  })
  const gelaufen = letzteSpawn
    ? distanzMeter(letzteSpawn, spieler)
    : Number.POSITIVE_INFINITY
  const pauseVorbei =
    typeof letzteSpawnZeit === "number"
      ? jetzt - letzteSpawnZeit >= WILD_PAUSE_MS
      : true
  if (bleiben.length === 0) {
    if (gelaufen >= WILD_LAUF_METER || pauseVorbei) {
      return {
        bloecke: erzeugeWildbloecke(spieler, umweltAn, jetzt, { blick }),
        letzteSpawn: { ...spieler },
        letzteSpawnZeit: jetzt,
      }
    }
    return {
      bloecke: [],
      letzteSpawn: letzteSpawn ?? { ...spieler },
      letzteSpawnZeit: letzteSpawnZeit ?? jetzt,
    }
  }
  // Nachschub gibt es beim Laufen ODER wenn die Pause sicher um ist —
  // sonst hungert eine langsame Session auf 1-2 Blöcke herunter.
  // (Eingesammelte Blöcke tauchen trotzdem nie sofort wieder auf.)
  const pauseSicherVorbei =
    typeof letzteSpawnZeit === "number" &&
    jetzt - letzteSpawnZeit >= WILD_PAUSE_MS
  if (gelaufen < WILD_LAUF_METER && !pauseSicherVorbei) {
    return {
      bloecke: bleiben,
      letzteSpawn: letzteSpawn ?? { ...spieler },
      letzteSpawnZeit: letzteSpawnZeit ?? jetzt,
    }
  }
  const fehlen = WILD_ANZAHL - bleiben.length
  const extra =
    fehlen > 0
      ? erzeugeWildbloecke(spieler, umweltAn, jetzt, {
          anzahl: fehlen,
          blick,
          meiden: bleiben,
        })
      : []
  return {
    bloecke: [...bleiben, ...extra],
    letzteSpawn: { ...spieler },
    letzteSpawnZeit: jetzt,
  }
}

export function erzeugeWildbloecke(
  spieler: Lage,
  umweltAn: (lage: Lage) => Umwelt,
  jetzt = Date.now(),
  optionen: {
    anzahl?: number
    blick?: number
    meiden?: WildBlock[]
  } = {},
): WildBlock[] {
  const anzahl = optionen.anzahl ?? WILD_ANZAHL
  const meiden = optionen.meiden ?? []
  const zufall = mulberry32(hash(`v11:${jetzt}:${spieler.lat}:${spieler.lng}:${anzahl}`))
  const bloecke: WildBlock[] = []
  for (let i = 0; i < anzahl * 14 && bloecke.length < anzahl; i++) {
    const lage = sucheLage(spieler, umweltAn, zufall, optionen.blick, [
      ...meiden,
      ...bloecke,
    ])
    if (!lage) continue
    const umwelt = spawnErlaubt(umweltAn(lage)) ? umweltAn(lage) : "feld"
    bloecke.push({
      id: `wild-${jetzt}-${bloecke.length}-${hash(`${lage.lat}:${lage.lng}`)}`,
      gegenstandId: spawnFuerUmwelt(umwelt, zufall),
      lage,
      umwelt,
      seit: jetzt,
    })
  }
  while (bloecke.length < anzahl) {
    const winkel = (bloecke.length / anzahl) * Math.PI * 2
    const radius = WILD_RADIUS_MIN + (bloecke.length % 4) * 8
    bloecke.push({
      id: `wild-${jetzt}-fb-${bloecke.length}`,
      gegenstandId:
        FALLBACK_BLOECKE[bloecke.length % FALLBACK_BLOECKE.length] ?? "gras",
      lage: lageVersetzt(
        spieler,
        Math.cos(winkel) * radius,
        Math.sin(winkel) * radius,
      ),
      umwelt: "feld",
      seit: jetzt,
    })
  }
  return bloecke
}

function sucheLage(
  spieler: Lage,
  umweltAn: (lage: Lage) => Umwelt,
  zufall: () => number,
  blick: number | undefined,
  meiden: WildBlock[],
): Lage | null {
  const vorne =
    typeof blick === "number" ? (blick * Math.PI) / 180 : zufall() * Math.PI * 2
  const spreizung = typeof blick === "number" ? Math.PI : Math.PI * 2
  const winkel = vorne + (zufall() - 0.5) * spreizung
  const radius =
    WILD_RADIUS_MIN + zufall() * (WILD_RADIUS_MAX - WILD_RADIUS_MIN)
  const roh = lageVersetzt(
    spieler,
    Math.cos(winkel) * radius,
    Math.sin(winkel) * radius,
  )
  const lage = landeAufBoden(roh, spieler, umweltAn)
  if (!lage || zuNahAnSicht(lage)) return null
  if (meiden.some((block) => distanzMeter(lage, block.lage) < MIN_ABSTAND_METER)) {
    return null
  }
  return lage
}

function landeAufBoden(
  lage: Lage,
  spieler: Lage,
  umweltAn: (lage: Lage) => Umwelt,
): Lage | null {
  if (spawnErlaubt(umweltAn(lage))) return lage
  for (const teil of [0.75, 0.55, 0.35]) {
    const probe: Lage = {
      lat: spieler.lat + (lage.lat - spieler.lat) * teil,
      lng: spieler.lng + (lage.lng - spieler.lng) * teil,
    }
    if (spawnErlaubt(umweltAn(probe))) return probe
  }
  return null
}

export type WildStand = {
  schluessel: string
  bloecke: WildBlock[]
  letzteSpawn?: Lage
  letzteSpawnZeit?: number
}

export function parseWildStand(roh: unknown): WildStand | null {
  if (!roh || typeof roh !== "object") return null
  if (!("schluessel" in roh) || typeof roh.schluessel !== "string") return null
  if (!("bloecke" in roh) || !Array.isArray(roh.bloecke)) return null
  const bloecke: WildBlock[] = []
  for (const eintrag of roh.bloecke) {
    const block = parseWildBlock(eintrag)
    if (block) bloecke.push(block)
  }
  const letzteSpawn =
    "letzteSpawn" in roh && istLage((roh as { letzteSpawn: unknown }).letzteSpawn)
      ? (roh as { letzteSpawn: Lage }).letzteSpawn
      : undefined
  const letzteSpawnZeit =
    "letzteSpawnZeit" in roh &&
    typeof (roh as { letzteSpawnZeit: unknown }).letzteSpawnZeit === "number"
      ? (roh as { letzteSpawnZeit: number }).letzteSpawnZeit
      : undefined
  return { schluessel: roh.schluessel, bloecke, letzteSpawn, letzteSpawnZeit }
}

export function parseWildbloecke(roh: unknown): WildBlock[] {
  return parseWildStand(roh)?.bloecke ?? []
}

export function entferneWildBlock(
  bloecke: WildBlock[],
  id: string,
): WildBlock[] {
  return bloecke.filter((block) => block.id !== id)
}

function zuNahAnSicht(lage: Lage): boolean {
  return listOrte().some(
    (eintrag) => distanzMeter(lage, eintrag.lage) < SICHT_ABSTAND_METER,
  )
}

function parseWildBlock(roh: unknown): WildBlock | undefined {
  if (!roh || typeof roh !== "object") return undefined
  if (!("id" in roh) || typeof roh.id !== "string") return undefined
  if (!("gegenstandId" in roh) || typeof roh.gegenstandId !== "string") {
    return undefined
  }
  if (!("lage" in roh) || !istLage(roh.lage)) return undefined
  if (!("umwelt" in roh) || !istUmwelt(roh.umwelt)) return undefined
  const seit =
    "seit" in roh && typeof roh.seit === "number" ? roh.seit : 0
  return {
    id: roh.id,
    gegenstandId: roh.gegenstandId,
    lage: roh.lage,
    umwelt: roh.umwelt,
    seit,
  }
}

function istLage(wert: unknown): wert is Lage {
  return Boolean(
    wert &&
      typeof wert === "object" &&
      "lat" in wert &&
      "lng" in wert &&
      typeof wert.lat === "number" &&
      typeof wert.lng === "number",
  )
}

function istUmwelt(wert: unknown): wert is Umwelt {
  return (
    wert === "park" ||
    wert === "wald" ||
    wert === "wasser" ||
    wert === "stadt" ||
    wert === "strasse" ||
    wert === "feld" ||
    wert === "unbekannt"
  )
}

function hash(text: string): number {
  let wert = 2166136261
  for (let i = 0; i < text.length; i++) {
    wert = Math.imul(wert ^ text.charCodeAt(i), 16777619)
  }
  return wert >>> 0
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), t | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
