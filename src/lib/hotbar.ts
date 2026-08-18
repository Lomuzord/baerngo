import { listGegenstaende } from "./gegenstaende"

export const HOTBAR_LAENGE = 9

export type HotbarSlot = {
  id: string | null
  anzahl: number
}

export function hotbarSlots(inventar: Record<string, number>): HotbarSlot[] {
  const besetzt = listGegenstaende()
    .filter((item) => (inventar[item.id] ?? 0) > 0)
    .slice(0, HOTBAR_LAENGE)
    .map((item) => ({ id: item.id, anzahl: inventar[item.id] }))
  const slots: HotbarSlot[] = [...besetzt]
  while (slots.length < HOTBAR_LAENGE) {
    slots.push({ id: null, anzahl: 0 })
  }
  return slots
}
