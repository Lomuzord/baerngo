import { istPickel, istSchaufel, listPickelArten } from "./abbauen"
import { blockFaellt, istSetzbar } from "./gegenstaende"
import {
  EBENE_RADIUS_ZELLEN,
  PLATTE_MAX_HOEHE,
  type Zelle,
} from "./spielflaeche"

export type BauAktion = "setzen" | "abbauen" | "keine"

export type GesetzterBlock = {
  id: string
  gegenstandId: string
  zelle: Zelle
  fallStart?: Zelle
  // Wann der Block gesetzt wurde — Setzlinge und Samen wachsen
  // daraus nach echter Zeit heran.
  gesetztUm?: number
}

export function neuerBlock(
  gegenstandId: string,
  zelle: Zelle,
): GesetzterBlock {
  const jetzt = Date.now()
  return {
    id: `${gegenstandId}-${zelle.ix}-${zelle.iy}-${zelle.iz}-${jetzt}`,
    gegenstandId,
    zelle,
    gesetztUm: jetzt,
  }
}

export function istAbbauWerkzeug(gegenstandId: string): boolean {
  return (
    istPickel(gegenstandId) ||
    istSchaufel(gegenstandId) ||
    gegenstandId === "axt" ||
    gegenstandId === "hacke"
  )
}

export function aktionFuerHand(gegenstandId: string | null): BauAktion {
  if (gegenstandId && istAbbauWerkzeug(gegenstandId)) return "abbauen"
  if (gegenstandId && istSetzbar(gegenstandId)) return "setzen"
  if (!gegenstandId) return "abbauen"
  return "keine"
}

export function blockObenInSpalte(
  bloecke: GesetzterBlock[],
  spalte: { ix: number; iz: number },
): GesetzterBlock | undefined {
  return bloecke
    .filter(
      (block) => block.zelle.ix === spalte.ix && block.zelle.iz === spalte.iz,
    )
    .sort((a, b) => b.zelle.iy - a.zelle.iy)[0]
}

export function hatAbbauWerkzeug(inventar: Record<string, number>): boolean {
  return (
    listPickelArten().some((id) => (inventar[id] ?? 0) > 0) ||
    (inventar.axt ?? 0) > 0
  )
}

export function entferneBlock(
  bloecke: GesetzterBlock[],
  blockId: string,
): GesetzterBlock[] {
  return bloecke.filter((block) => block.id !== blockId)
}

export function kannBlockSetzen(
  bloecke: GesetzterBlock[],
  zelle: Zelle,
): boolean {
  if (
    Math.abs(zelle.ix) > EBENE_RADIUS_ZELLEN ||
    Math.abs(zelle.iz) > EBENE_RADIUS_ZELLEN ||
    zelle.iy < 0 ||
    zelle.iy >= PLATTE_MAX_HOEHE
  ) {
    return false
  }
  return !bloecke.some(
    (block) =>
      block.zelle.ix === zelle.ix &&
      block.zelle.iy === zelle.iy &&
      block.zelle.iz === zelle.iz,
  )
}

export function setzeBlock(
  bloecke: GesetzterBlock[],
  gegenstandId: string,
  zelle: Zelle,
): GesetzterBlock[] {
  if (!kannBlockSetzen(bloecke, zelle)) return bloecke
  return falleBloecke([...bloecke, neuerBlock(gegenstandId, zelle)])
}

export function nimmBlock(
  bloecke: GesetzterBlock[],
  blockId: string,
): GesetzterBlock[] {
  return falleBloecke(entferneBlock(bloecke, blockId))
}

export function falleBloecke(bloecke: GesetzterBlock[]): GesetzterBlock[] {
  const vorher = new Map(
    bloecke.map((block) => [block.id, { ...block.zelle }]),
  )
  const liste = bloecke.map((block) => ({
    ...block,
    zelle: { ...block.zelle },
  }))
  for (let n = 0; n < PLATTE_MAX_HOEHE; n++) {
    let bewegt = false
    const belegt = new Set(liste.map((block) => zellenSchluessel(block.zelle)))
    const reihenfolge = [...liste].sort((a, b) => a.zelle.iy - b.zelle.iy)
    for (const block of reihenfolge) {
      if (!blockFaellt(block.gegenstandId) || block.zelle.iy <= 0) continue
      const unten = zellenSchluessel({
        ...block.zelle,
        iy: block.zelle.iy - 1,
      })
      if (belegt.has(unten)) continue
      belegt.delete(zellenSchluessel(block.zelle))
      block.zelle = { ...block.zelle, iy: block.zelle.iy - 1 }
      belegt.add(zellenSchluessel(block.zelle))
      bewegt = true
    }
    if (!bewegt) break
  }
  return liste.map((block) => {
    const von = vorher.get(block.id)
    if (von && von.iy > block.zelle.iy) {
      return { ...block, fallStart: von }
    }
    if (!block.fallStart) return block
    return {
      id: block.id,
      gegenstandId: block.gegenstandId,
      zelle: block.zelle,
    }
  })
}

function zellenSchluessel(zelle: Zelle): string {
  return `${zelle.ix},${zelle.iy},${zelle.iz}`
}

export function blockById(
  bloecke: GesetzterBlock[],
  blockId: string,
): GesetzterBlock | undefined {
  return bloecke.find((block) => block.id === blockId)
}

export function parseBloecke(roh: unknown): GesetzterBlock[] {
  if (!Array.isArray(roh)) return []
  const liste: GesetzterBlock[] = []
  for (const eintrag of roh) {
    const block = parseBlock(eintrag)
    if (block) liste.push(block)
  }
  return liste
}

function parseBlock(roh: unknown): GesetzterBlock | undefined {
  if (!roh || typeof roh !== "object") return undefined
  if (!("gegenstandId" in roh) || typeof roh.gegenstandId !== "string") {
    return undefined
  }
  if (!("zelle" in roh) || !istZelle(roh.zelle)) return undefined
  const id =
    "id" in roh && typeof roh.id === "string"
      ? roh.id
      : `${roh.gegenstandId}-${roh.zelle.ix}-${roh.zelle.iy}-${roh.zelle.iz}`
  const gesetztUm =
    "gesetztUm" in roh && typeof roh.gesetztUm === "number"
      ? roh.gesetztUm
      : undefined
  return { id, gegenstandId: roh.gegenstandId, zelle: roh.zelle, gesetztUm }
}

function istZelle(wert: unknown): wert is Zelle {
  if (!wert || typeof wert !== "object") return false
  return (
    "ix" in wert &&
    "iy" in wert &&
    "iz" in wert &&
    typeof wert.ix === "number" &&
    typeof wert.iy === "number" &&
    typeof wert.iz === "number"
  )
}
