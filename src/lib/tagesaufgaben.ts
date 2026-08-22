// Tagesaufgaben: drei Aufgaben pro Tag, deterministisch aus dem Datum
// gewürfelt — alle Spieler haben am selben Tag dieselben Aufgaben.

import { gegenstandById } from "./gegenstaende"
import type { Beute } from "./sammeln"

export type AufgabenArt = "sammeln" | "truhe" | "craft" | "tier" | "meter"

export type Aufgabe = {
  id: string
  text: string
  art: AufgabenArt
  ziel: number
  // Für sammeln/craft: nur dieser Gegenstand zählt
  zielId?: string
}

export type TagesStand = {
  datum: string
  zaehler: Record<string, number>
  belohnt: boolean
}

export const TAGES_BELOHNUNG: readonly Beute[] = [
  { gegenstandId: "diamant", anzahl: 2 },
  { gegenstandId: "gold", anzahl: 3 },
]

const SAMMEL_BLOECKE = ["stamm", "stein", "gras", "laub", "sand", "kies"]
const CRAFT_ZIELE = ["fackel", "holz", "stock", "brot"]

function aufgabenPool(wuerfel: () => number): Aufgabe[] {
  const block =
    SAMMEL_BLOECKE[Math.floor(wuerfel() * SAMMEL_BLOECKE.length)] ?? "stamm"
  const craft =
    CRAFT_ZIELE[Math.floor(wuerfel() * CRAFT_ZIELE.length)] ?? "fackel"
  return [
    {
      id: `sammeln-${block}`,
      text: `Sammle 10 ${gegenstandById(block)?.name ?? block}`,
      art: "sammeln",
      ziel: 10,
      zielId: block,
    },
    {
      id: "truhen",
      text: "Öffne 2 Truhen",
      art: "truhe",
      ziel: 2,
    },
    {
      id: `craft-${craft}`,
      text: `Craft 1× ${gegenstandById(craft)?.name ?? craft}`,
      art: "craft",
      ziel: 1,
      zielId: craft,
    },
    {
      id: "tiere",
      text: "Sammle 3 Tiere ein",
      art: "tier",
      ziel: 3,
    },
    {
      id: "wandern",
      text: "Laufe 1 km",
      art: "meter",
      ziel: 1000,
    },
  ]
}

// Drei Aufgaben für ein Datum (YYYY-MM-DD), deterministisch.
export function aufgabenFuer(datum: string): Aufgabe[] {
  const wuerfel = mulberry32(hash(`aufgaben:${datum}`))
  const pool = aufgabenPool(wuerfel)
  // Fisher-Yates mit dem geseedeten Würfel, dann die ersten drei
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(wuerfel() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  return pool.slice(0, 3)
}

export function heutigesDatum(jetzt: Date = new Date()): string {
  const jahr = jetzt.getFullYear()
  const monat = `${jetzt.getMonth() + 1}`.padStart(2, "0")
  const tag = `${jetzt.getDate()}`.padStart(2, "0")
  return `${jahr}-${monat}-${tag}`
}

export function parseTagesStand(roh: unknown, datum: string): TagesStand {
  const leer: TagesStand = { datum, zaehler: {}, belohnt: false }
  if (!roh || typeof roh !== "object" || Array.isArray(roh)) return leer
  const stand = roh as {
    datum?: unknown
    zaehler?: unknown
    belohnt?: unknown
  }
  // Neuer Tag = alles zurück auf Anfang
  if (stand.datum !== datum) return leer
  const zaehler: Record<string, number> = {}
  if (stand.zaehler && typeof stand.zaehler === "object") {
    for (const [id, wert] of Object.entries(
      stand.zaehler as Record<string, unknown>,
    )) {
      if (typeof wert === "number" && Number.isFinite(wert) && wert > 0) {
        zaehler[id] = wert
      }
    }
  }
  return { datum, zaehler, belohnt: stand.belohnt === true }
}

// Zählt ein Ereignis auf alle passenden Aufgaben des Tages.
export function meldeEreignis(
  stand: TagesStand,
  aufgaben: readonly Aufgabe[],
  art: AufgabenArt,
  anzahl: number,
  zielId?: string,
): TagesStand {
  if (anzahl <= 0) return stand
  let zaehler = stand.zaehler
  for (const aufgabe of aufgaben) {
    if (aufgabe.art !== art) continue
    if (aufgabe.zielId && aufgabe.zielId !== zielId) continue
    const bisher = zaehler[aufgabe.id] ?? 0
    if (bisher >= aufgabe.ziel) continue
    zaehler = {
      ...zaehler,
      [aufgabe.id]: Math.min(aufgabe.ziel, bisher + anzahl),
    }
  }
  if (zaehler === stand.zaehler) return stand
  return { ...stand, zaehler }
}

export function fertigAnzahl(
  aufgaben: readonly Aufgabe[],
  stand: TagesStand,
): number {
  return aufgaben.filter(
    (aufgabe) => (stand.zaehler[aufgabe.id] ?? 0) >= aufgabe.ziel,
  ).length
}

export function alleGeschafft(
  aufgaben: readonly Aufgabe[],
  stand: TagesStand,
): boolean {
  return aufgaben.length > 0 && fertigAnzahl(aufgaben, stand) === aufgaben.length
}

// Kleiner seeded RNG — gleiche Bauart wie im Wildspawn
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
