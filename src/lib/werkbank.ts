import { gegenstandById, type Gegenstand } from "./gegenstaende"

export type Rezept = {
  id: string
  name: string
  zutat: Record<string, number>
  ergebnisId: string
  ergebnisAnzahl: number
}

const REZEPTE: readonly Rezept[] = [
  {
    id: "goldblock",
    name: "Goldblock",
    zutat: { gold: 2 },
    ergebnisId: "goldblock",
    ergebnisAnzahl: 1,
  },
  {
    id: "honigbrot",
    name: "Honigbrot",
    zutat: { honig: 1, buch: 1 },
    ergebnisId: "honigbrot",
    ergebnisAnzahl: 1,
  },
  {
    id: "bernwappen",
    name: "Bernwappen",
    zutat: { smaragd: 1, sandstein: 1, gold: 1 },
    ergebnisId: "bernwappen",
    ergebnisAnzahl: 1,
  },
]

export type InventarStand = Record<string, number>

export type CraftErgebnis =
  | { ok: true; inventar: InventarStand; ergebnis: Gegenstand }
  | { ok: false; grund: string }

export function listRezepte(): readonly Rezept[] {
  return REZEPTE
}

export function rezeptById(id: string): Rezept | undefined {
  return REZEPTE.find((rezept) => rezept.id === id)
}

export type Raster = (string | null)[]

export function leeresRaster(): Raster {
  return [null, null, null, null, null, null, null, null, null]
}

export function zaehleRaster(raster: Raster): Record<string, number> {
  const stand: Record<string, number> = {}
  for (const id of raster) {
    if (!id) continue
    stand[id] = (stand[id] ?? 0) + 1
  }
  return stand
}

export function ergebnisFuerRaster(raster: Raster): Gegenstand | null {
  const haben = zaehleRaster(raster)
  for (const rezept of REZEPTE) {
    if (passtZutaten(haben, rezept.zutat)) {
      return gegenstandById(rezept.ergebnisId) ?? null
    }
  }
  return null
}

export function nimmCraft(
  inventar: InventarStand,
  raster: Raster,
):
  | { ok: true; inventar: InventarStand; raster: Raster; ergebnis: Gegenstand }
  | { ok: false; grund: string } {
  const ergebnis = ergebnisFuerRaster(raster)
  if (!ergebnis) return { ok: false, grund: "Kein Rezept" }
  const danach = { ...inventar }
  danach[ergebnis.id] = (danach[ergebnis.id] ?? 0) + 1
  return { ok: true, inventar: danach, raster: leeresRaster(), ergebnis }
}

function passtZutaten(
  haben: Record<string, number>,
  zutat: Record<string, number>,
): boolean {
  const schluessel = new Set([...Object.keys(haben), ...Object.keys(zutat)])
  if (Object.keys(zutat).length === 0) return false
  for (const id of schluessel) {
    if ((haben[id] ?? 0) !== (zutat[id] ?? 0)) return false
  }
  return true
}

export function craft(inventar: InventarStand, rezeptId: string): CraftErgebnis {
  const rezept = rezeptById(rezeptId)
  if (!rezept) return { ok: false, grund: "Unbekanntes Rezept" }

  for (const [id, anzahl] of Object.entries(rezept.zutat)) {
    if ((inventar[id] ?? 0) < anzahl) {
      return { ok: false, grund: "Zu wenig Material" }
    }
  }

  const danach = { ...inventar }
  for (const [id, anzahl] of Object.entries(rezept.zutat)) {
    danach[id] = (danach[id] ?? 0) - anzahl
    if (danach[id] <= 0) delete danach[id]
  }
  danach[rezept.ergebnisId] =
    (danach[rezept.ergebnisId] ?? 0) + rezept.ergebnisAnzahl

  const ergebnis = gegenstandById(rezept.ergebnisId)
  if (!ergebnis) return { ok: false, grund: "Unbekanntes Ergebnis" }
  return { ok: true, inventar: danach, ergebnis }
}
