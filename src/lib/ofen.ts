import { gegenstandById } from "./gegenstaende"
import { stapelMaximum, type Cursor, type InventarSlot } from "./inventar"

export type OfenFach = "eingabe" | "brennstoff" | "ausgabe"

export type OfenStand = {
  eingabe: InventarSlot
  brennstoff: InventarSlot
  ausgabe: InventarSlot
}

export type Schmelzrezept = {
  eingabe: string
  ausgabe: string
  ausgabeAnzahl: number
}

const SCHMELZE: readonly Schmelzrezept[] = [
  { eingabe: "sand", ausgabe: "glas", ausgabeAnzahl: 1 },
  { eingabe: "eisenerz", ausgabe: "eisen", ausgabeAnzahl: 1 },
  { eingabe: "golderz", ausgabe: "gold", ausgabeAnzahl: 1 },
  { eingabe: "kohleerz", ausgabe: "kohle", ausgabeAnzahl: 1 },
  { eingabe: "diamanterz", ausgabe: "diamant", ausgabeAnzahl: 1 },
  { eingabe: "redstoneerz", ausgabe: "redstone", ausgabeAnzahl: 3 },
  { eingabe: "bruchstein", ausgabe: "stein", ausgabeAnzahl: 1 },
  { eingabe: "lehm", ausgabe: "ziegel", ausgabeAnzahl: 1 },
  { eingabe: "stamm", ausgabe: "kohle", ausgabeAnzahl: 1 },
]

const BRENNSTOFF = new Set([
  "kohle",
  "kohleblock",
  "stamm",
  "holz",
  "stock",
  "werkbank",
  "buecherregal",
])

export function leererOfen(): OfenStand {
  return { eingabe: null, brennstoff: null, ausgabe: null }
}

export function istBrennstoff(id: string): boolean {
  return BRENNSTOFF.has(id)
}

export function schmelzrezeptFuer(id: string): Schmelzrezept | undefined {
  return SCHMELZE.find((rezept) => rezept.eingabe === id)
}

export function listSchmelze(): readonly Schmelzrezept[] {
  return SCHMELZE
}

export function klickOfen(
  stand: OfenStand,
  fach: OfenFach,
  cursor: Cursor | null,
): { stand: OfenStand; cursor: Cursor | null } {
  const danach = { ...stand }
  if (fach === "ausgabe") {
    if (cursor || !danach.ausgabe) return { stand: treibeOfen(danach), cursor }
    const genommen = danach.ausgabe
    danach.ausgabe = null
    return {
      stand: treibeOfen(danach),
      cursor: { id: genommen.id, anzahl: genommen.anzahl },
    }
  }
  const belegt = danach[fach]
  if (!cursor) {
    if (!belegt) return { stand: treibeOfen(danach), cursor: null }
    danach[fach] = null
    return {
      stand: treibeOfen(danach),
      cursor: { id: belegt.id, anzahl: belegt.anzahl },
    }
  }
  if (fach === "brennstoff" && !istBrennstoff(cursor.id)) {
    return { stand: treibeOfen(danach), cursor }
  }
  if (!belegt) {
    danach[fach] = { id: cursor.id, anzahl: cursor.anzahl }
    return { stand: treibeOfen(danach), cursor: null }
  }
  if (belegt.id === cursor.id) {
    const platz = stapelMaximum(belegt.id) - belegt.anzahl
    if (platz <= 0) return { stand: treibeOfen(danach), cursor }
    const move = Math.min(platz, cursor.anzahl)
    danach[fach] = { id: belegt.id, anzahl: belegt.anzahl + move }
    const rest = cursor.anzahl - move
    return {
      stand: treibeOfen(danach),
      cursor: rest > 0 ? { id: cursor.id, anzahl: rest } : null,
    }
  }
  danach[fach] = { id: cursor.id, anzahl: cursor.anzahl }
  return {
    stand: treibeOfen(danach),
    cursor: { id: belegt.id, anzahl: belegt.anzahl },
  }
}

export function treibeOfen(stand: OfenStand): OfenStand {
  if (stand.ausgabe || !stand.eingabe || !stand.brennstoff) return stand
  if (!istBrennstoff(stand.brennstoff.id)) return stand
  const rezept = schmelzrezeptFuer(stand.eingabe.id)
  if (!rezept) return stand
  const ergebnis = gegenstandById(rezept.ausgabe)
  if (!ergebnis) return stand
  const eingabeRest = stand.eingabe.anzahl - 1
  const brennRest = stand.brennstoff.anzahl - 1
  return {
    eingabe: eingabeRest > 0 ? { id: stand.eingabe.id, anzahl: eingabeRest } : null,
    brennstoff:
      brennRest > 0 ? { id: stand.brennstoff.id, anzahl: brennRest } : null,
    ausgabe: { id: rezept.ausgabe, anzahl: rezept.ausgabeAnzahl },
  }
}

export function ofenInBeute(stand: OfenStand): { gegenstandId: string; anzahl: number }[] {
  return [stand.eingabe, stand.brennstoff, stand.ausgabe].flatMap((slot) =>
    slot ? [{ gegenstandId: slot.id, anzahl: slot.anzahl }] : [],
  )
}

export function fachBeiIndex(index: number): OfenFach | null {
  if (index === 0) return "eingabe"
  if (index === 1) return "brennstoff"
  if (index === 2) return "ausgabe"
  return null
}
