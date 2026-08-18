import { gegenstandById, type Gegenstand } from "./gegenstaende"

export type Raster = (string | null)[]

export type Rezept = {
  id: string
  name: string
  zutat: Record<string, number>
  form?: Raster
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
  {
    id: "holz",
    name: "Holz",
    zutat: { buch: 1 },
    ergebnisId: "holz",
    ergebnisAnzahl: 2,
  },
  {
    id: "stein",
    name: "Stein",
    zutat: { sandstein: 2 },
    ergebnisId: "stein",
    ergebnisAnzahl: 1,
  },
  {
    id: "eisen",
    name: "Eisen",
    zutat: { gold: 1, sandstein: 1 },
    ergebnisId: "eisen",
    ergebnisAnzahl: 1,
  },
  {
    id: "erde",
    name: "Erde",
    zutat: { honig: 1, sandstein: 1 },
    ergebnisId: "erde",
    ergebnisAnzahl: 1,
  },
  {
    id: "ziegel",
    name: "Ziegel",
    zutat: { stein: 2 },
    ergebnisId: "ziegel",
    ergebnisAnzahl: 1,
  },
  {
    id: "pickel",
    name: "Spitzhacke",
    zutat: { stein: 3, holz: 2 },
    form: [
      "stein",
      "stein",
      "stein",
      null,
      "holz",
      null,
      null,
      "holz",
      null,
    ],
    ergebnisId: "pickel",
    ergebnisAnzahl: 1,
  },
  {
    id: "schwert",
    name: "Schwert",
    zutat: { gold: 2, holz: 1 },
    form: [
      null,
      "gold",
      null,
      null,
      "gold",
      null,
      null,
      "holz",
      null,
    ],
    ergebnisId: "schwert",
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

export function rezeptFuerRaster(raster: Raster): Rezept | null {
  for (const rezept of REZEPTE) {
    if (rezept.form && passtForm(raster, rezept.form)) return rezept
  }
  const haben = zaehleRaster(raster)
  for (const rezept of REZEPTE) {
    if (rezept.form) continue
    if (passtZutaten(haben, rezept.zutat)) return rezept
  }
  return null
}

export function ergebnisFuerRaster(raster: Raster): Gegenstand | null {
  const rezept = rezeptFuerRaster(raster)
  if (!rezept) return null
  return gegenstandById(rezept.ergebnisId) ?? null
}

export function nimmCraft(
  inventar: InventarStand,
  raster: Raster,
):
  | { ok: true; inventar: InventarStand; raster: Raster; ergebnis: Gegenstand }
  | { ok: false; grund: string } {
  const rezept = rezeptFuerRaster(raster)
  const ergebnis = rezept ? gegenstandById(rezept.ergebnisId) : null
  if (!rezept || !ergebnis) return { ok: false, grund: "Kein Rezept" }
  const danach = { ...inventar }
  danach[ergebnis.id] = (danach[ergebnis.id] ?? 0) + rezept.ergebnisAnzahl
  return { ok: true, inventar: danach, raster: leeresRaster(), ergebnis }
}

function passtForm(raster: Raster, form: Raster): boolean {
  if (raster.length !== 9 || form.length !== 9) return false
  if (raster.every((zelle, index) => zelle === form[index])) return true
  const spiegel = [2, 1, 0, 5, 4, 3, 8, 7, 6].map((index) => form[index] ?? null)
  return raster.every((zelle, index) => zelle === spiegel[index])
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
