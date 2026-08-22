import { gegenstandById, istWerkzeug } from "./gegenstaende"
import { parseInventar, type Beute } from "./sammeln"

export const HOTBAR_LAENGE = 9
export const LAGER_LAENGE = 27
export const INVENTAR_LAENGE = HOTBAR_LAENGE + LAGER_LAENGE
export const STAPEL_MAX = 64

export type InventarSlot = { id: string; anzahl: number } | null

export type Cursor = { id: string; anzahl: number }

export function leereSlots(): InventarSlot[] {
  return Array.from({ length: INVENTAR_LAENGE }, () => null)
}

export function stapelMaximum(id: string): number {
  if (istWerkzeug(id)) return 1
  return STAPEL_MAX
}

export function zaehleSlots(slots: InventarSlot[]): Record<string, number> {
  const stand: Record<string, number> = {}
  for (const slot of slots) {
    if (!slot) continue
    stand[slot.id] = (stand[slot.id] ?? 0) + slot.anzahl
  }
  return stand
}

export function hotbarVon(slots: InventarSlot[]): InventarSlot[] {
  const liste = slots.slice(0, HOTBAR_LAENGE)
  while (liste.length < HOTBAR_LAENGE) liste.push(null)
  return liste
}

export function lagerVon(slots: InventarSlot[]): InventarSlot[] {
  const liste = slots.slice(HOTBAR_LAENGE, INVENTAR_LAENGE)
  while (liste.length < LAGER_LAENGE) liste.push(null)
  return liste
}

export function slotsAusBeutel(beutel: Record<string, number>): InventarSlot[] {
  let slots = leereSlots()
  for (const [id, anzahl] of Object.entries(beutel)) {
    if (anzahl > 0) slots = legeStapel(slots, id, anzahl)
  }
  return slots
}

export function legeBeuteInSlots(
  slots: InventarSlot[],
  beute: Beute[],
): InventarSlot[] {
  let danach = normalisiere(slots)
  for (const stuck of beute) {
    if (stuck.anzahl <= 0) continue
    danach = legeStapel(danach, stuck.gegenstandId, stuck.anzahl)
  }
  return danach
}

export function legeBeuteInSlotsMitRest(
  slots: InventarSlot[],
  beute: Beute[],
): { slots: InventarSlot[]; rest: Beute[] } {
  let danach = normalisiere(slots)
  const rest: Beute[] = []
  for (const stuck of beute) {
    if (stuck.anzahl <= 0) continue
    const gelegt = legeStapelMitRest(danach, stuck.gegenstandId, stuck.anzahl)
    danach = gelegt.slots
    if (gelegt.rest > 0) {
      rest.push({ gegenstandId: stuck.gegenstandId, anzahl: gelegt.rest })
    }
  }
  return { slots: danach, rest }
}

export function nimmVonIndex(
  slots: InventarSlot[],
  index: number,
  anzahl: number,
): { slots: InventarSlot[]; ok: boolean } {
  const slot = slots[index]
  if (!slot || slot.anzahl < anzahl || anzahl <= 0) {
    return { slots: normalisiere(slots), ok: false }
  }
  const rest = slot.anzahl - anzahl
  return {
    slots: setzeSlot(
      slots,
      index,
      rest > 0 ? { id: slot.id, anzahl: rest } : null,
    ),
    ok: true,
  }
}

export function nimmAnzahl(
  slots: InventarSlot[],
  id: string,
  anzahl: number,
): InventarSlot[] | null {
  if ((zaehleSlots(slots)[id] ?? 0) < anzahl) return null
  const next = normalisiere(slots)
  let rest = anzahl
  for (let i = next.length - 1; i >= 0 && rest > 0; i--) {
    const slot = next[i]
    if (!slot || slot.id !== id) continue
    const take = Math.min(slot.anzahl, rest)
    const left = slot.anzahl - take
    next[i] = left > 0 ? { id, anzahl: left } : null
    rest -= take
  }
  return next
}

export function klickSlot(
  slots: InventarSlot[],
  index: number,
  cursor: Cursor | null,
  taste: "links" | "rechts" = "links",
): { slots: InventarSlot[]; cursor: Cursor | null } {
  if (index < 0 || index >= INVENTAR_LAENGE) return { slots: normalisiere(slots), cursor }
  const slot = normalisiere(slots)[index] ?? null
  return taste === "rechts"
    ? klickRechts(slots, index, cursor, slot)
    : klickLinks(slots, index, cursor, slot)
}

export function legeCursorZurueck(
  slots: InventarSlot[],
  cursor: Cursor | null,
  bevorzugt?: number,
): InventarSlot[] {
  return legeCursorZurueckMitRest(slots, cursor, bevorzugt).slots
}

export function legeCursorZurueckMitRest(
  slots: InventarSlot[],
  cursor: Cursor | null,
  bevorzugt?: number,
): { slots: InventarSlot[]; cursor: Cursor | null } {
  if (!cursor) return { slots, cursor: null }
  if (typeof bevorzugt === "number") {
    const gelegt = klickSlot(slots, bevorzugt, cursor, "links")
    if (!gelegt.cursor) return { slots: gelegt.slots, cursor: null }
    slots = gelegt.slots
    cursor = gelegt.cursor
  }
  const gelegt = legeBeuteInSlotsMitRest(slots, [
    { gegenstandId: cursor.id, anzahl: cursor.anzahl },
  ])
  const rest = gelegt.rest[0]
  return {
    slots: gelegt.slots,
    cursor: rest ? { id: rest.gegenstandId, anzahl: rest.anzahl } : null,
  }
}

export function verschiebeSlot(
  slots: InventarSlot[],
  von: number,
  nach: number,
): InventarSlot[] {
  if (von === nach) return normalisiere(slots)
  const aufgenommen = klickSlot(slots, von, null, "links")
  const abgelegt = klickSlot(aufgenommen.slots, nach, aufgenommen.cursor, "links")
  if (!abgelegt.cursor) return abgelegt.slots
  return klickSlot(abgelegt.slots, von, abgelegt.cursor, "links").slots
}

export function parseSlots(roh: unknown): InventarSlot[] {
  if (Array.isArray(roh)) return parseSlotListe(roh)
  if (roh && typeof roh === "object" && "slots" in roh) {
    const liste = (roh as { slots: unknown }).slots
    if (Array.isArray(liste)) return parseSlotListe(liste)
  }
  return slotsAusBeutel(parseInventar(roh))
}

function klickLinks(
  slots: InventarSlot[],
  index: number,
  cursor: Cursor | null,
  slot: InventarSlot,
): { slots: InventarSlot[]; cursor: Cursor | null } {
  if (!cursor) {
    if (!slot) return { slots: normalisiere(slots), cursor }
    return {
      slots: setzeSlot(slots, index, null),
      cursor: { id: slot.id, anzahl: slot.anzahl },
    }
  }
  if (!slot) {
    return {
      slots: setzeSlot(slots, index, {
        id: cursor.id,
        anzahl: cursor.anzahl,
      }),
      cursor: null,
    }
  }
  if (slot.id === cursor.id) {
    const platz = stapelMaximum(slot.id) - slot.anzahl
    if (platz <= 0) return { slots: normalisiere(slots), cursor }
    const move = Math.min(platz, cursor.anzahl)
    const rest = cursor.anzahl - move
    return {
      slots: setzeSlot(slots, index, { id: slot.id, anzahl: slot.anzahl + move }),
      cursor: rest > 0 ? { id: cursor.id, anzahl: rest } : null,
    }
  }
  return {
    slots: setzeSlot(slots, index, { id: cursor.id, anzahl: cursor.anzahl }),
    cursor: { id: slot.id, anzahl: slot.anzahl },
  }
}

function klickRechts(
  slots: InventarSlot[],
  index: number,
  cursor: Cursor | null,
  slot: InventarSlot,
): { slots: InventarSlot[]; cursor: Cursor | null } {
  if (!cursor) {
    if (!slot) return { slots: normalisiere(slots), cursor }
    const nimm = 1
    const rest = slot.anzahl - nimm
    return {
      slots: setzeSlot(
        slots,
        index,
        rest > 0 ? { id: slot.id, anzahl: rest } : null,
      ),
      cursor: { id: slot.id, anzahl: nimm },
    }
  }
  if (!slot) {
    return {
      slots: setzeSlot(slots, index, { id: cursor.id, anzahl: 1 }),
      cursor: cursor.anzahl > 1 ? { id: cursor.id, anzahl: cursor.anzahl - 1 } : null,
    }
  }
  if (slot.id === cursor.id) {
    if (slot.anzahl >= stapelMaximum(slot.id)) {
      return { slots: normalisiere(slots), cursor }
    }
    return {
      slots: setzeSlot(slots, index, { id: slot.id, anzahl: slot.anzahl + 1 }),
      cursor: cursor.anzahl > 1 ? { id: cursor.id, anzahl: cursor.anzahl - 1 } : null,
    }
  }
  return {
    slots: setzeSlot(slots, index, { id: cursor.id, anzahl: cursor.anzahl }),
    cursor: { id: slot.id, anzahl: slot.anzahl },
  }
}

function legeStapel(
  slots: InventarSlot[],
  id: string,
  anzahl: number,
): InventarSlot[] {
  const gelegt = legeStapelMitRest(slots, id, anzahl)
  if (gelegt.rest <= 0) return gelegt.slots
  // Notausgang gegen Item-Verlust: lieber einen Stapel über dem Maximum
  // als Blöcke stillschweigend löschen.
  const next = gelegt.slots
  for (let i = 0; i < next.length; i++) {
    const slot = next[i]
    if (slot && slot.id === id) {
      next[i] = { id, anzahl: slot.anzahl + gelegt.rest }
      return next
    }
  }
  return next
}

function legeStapelMitRest(
  slots: InventarSlot[],
  id: string,
  anzahl: number,
): { slots: InventarSlot[]; rest: number } {
  if (!gegenstandById(id) || anzahl <= 0) {
    return { slots: normalisiere(slots), rest: 0 }
  }
  const max = stapelMaximum(id)
  const next = normalisiere(slots)
  let rest = anzahl
  for (let i = 0; i < next.length && rest > 0; i++) {
    const slot = next[i]
    if (!slot || slot.id !== id) continue
    const platz = max - slot.anzahl
    if (platz <= 0) continue
    const move = Math.min(platz, rest)
    next[i] = { id, anzahl: slot.anzahl + move }
    rest -= move
  }
  for (let i = 0; i < next.length && rest > 0; i++) {
    if (next[i]) continue
    const move = Math.min(max, rest)
    next[i] = { id, anzahl: move }
    rest -= move
  }
  return { slots: next, rest }
}

function setzeSlot(
  slots: InventarSlot[],
  index: number,
  wert: InventarSlot,
): InventarSlot[] {
  const next = normalisiere(slots)
  next[index] = wert && wert.anzahl > 0 ? wert : null
  return next
}

function normalisiere(slots: InventarSlot[]): InventarSlot[] {
  const next = leereSlots()
  for (let i = 0; i < INVENTAR_LAENGE; i++) {
    const slot = slots[i]
    if (!slot || !gegenstandById(slot.id) || slot.anzahl <= 0) continue
    next[i] = { id: slot.id, anzahl: Math.floor(slot.anzahl) }
  }
  return next
}

function parseSlotListe(liste: unknown[]): InventarSlot[] {
  const slots = leereSlots()
  for (let i = 0; i < INVENTAR_LAENGE; i++) {
    slots[i] = parseSlot(liste[i])
  }
  return slots
}

function parseSlot(roh: unknown): InventarSlot {
  if (!roh || typeof roh !== "object") return null
  if (!("id" in roh) || typeof roh.id !== "string") return null
  if (!gegenstandById(roh.id)) return null
  const anzahl =
    "anzahl" in roh && typeof roh.anzahl === "number"
      ? Math.floor(roh.anzahl)
      : 0
  if (anzahl <= 0) return null
  return { id: roh.id, anzahl }
}
