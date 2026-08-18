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
