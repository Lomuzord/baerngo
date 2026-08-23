import { gegenstandById } from "./gegenstaende"
import { stapelMaximum, type Cursor, type InventarSlot } from "./inventar"

export type OfenFach = "eingabe" | "brennstoff" | "ausgabe"

export type OfenStand = {
  eingabe: InventarSlot
  brennstoff: InventarSlot
  ausgabe: InventarSlot
  // Feuer wie in Minecraft: Rest-Brennzeit des angezündeten Brennstoffs
  // und seine Gesamtdauer (für die Flammen-Anzeige)
  brandRestMs?: number
  brandGesamtMs?: number
  // Fortschritt am aktuellen Schmelzstück (Pfeil-Anzeige)
  schmelzMs?: number
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

// Brennwerte wie in Minecraft: Kohle schmilzt 8 Stücke, ein Stock
// nur ein halbes. 1 Stück schmelzen = 10 Sekunden.
export const SCHMELZ_DAUER_MS = 10_000

const BRENNWERT_MS: Record<string, number> = {
  kohle: 8 * SCHMELZ_DAUER_MS,
  kohleblock: 80 * SCHMELZ_DAUER_MS,
  stamm: 1.5 * SCHMELZ_DAUER_MS,
  holz: 1.5 * SCHMELZ_DAUER_MS,
  stock: 0.5 * SCHMELZ_DAUER_MS,
  werkbank: 1.5 * SCHMELZ_DAUER_MS,
  buecherregal: 1.5 * SCHMELZ_DAUER_MS,
}

export function brennwertMs(id: string): number {
  return BRENNWERT_MS[id] ?? 0
}

export function leererOfen(): OfenStand {
  return { eingabe: null, brennstoff: null, ausgabe: null }
}

export function istBrennstoff(id: string): boolean {
  return (BRENNWERT_MS[id] ?? 0) > 0
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
    if (cursor || !danach.ausgabe) return { stand: danach, cursor }
    const genommen = danach.ausgabe
    danach.ausgabe = null
    return {
      stand: danach,
      cursor: { id: genommen.id, anzahl: genommen.anzahl },
    }
  }
  const belegt = danach[fach]
  if (!cursor) {
    if (!belegt) return { stand: danach, cursor: null }
    danach[fach] = null
    return {
      stand: danach,
      cursor: { id: belegt.id, anzahl: belegt.anzahl },
    }
  }
  if (fach === "brennstoff" && !istBrennstoff(cursor.id)) {
    return { stand: danach, cursor }
  }
  if (!belegt) {
    danach[fach] = { id: cursor.id, anzahl: cursor.anzahl }
    return { stand: danach, cursor: null }
  }
  if (belegt.id === cursor.id) {
    const platz = stapelMaximum(belegt.id) - belegt.anzahl
    if (platz <= 0) return { stand: danach, cursor }
    const move = Math.min(platz, cursor.anzahl)
    danach[fach] = { id: belegt.id, anzahl: belegt.anzahl + move }
    const rest = cursor.anzahl - move
    return {
      stand: danach,
      cursor: rest > 0 ? { id: cursor.id, anzahl: rest } : null,
    }
  }
  danach[fach] = { id: cursor.id, anzahl: cursor.anzahl }
  return {
    stand: danach,
    cursor: { id: belegt.id, anzahl: belegt.anzahl },
  }
}

// Kann gerade geschmolzen werden? (Rezept vorhanden, Ausgabe hat Platz)
function kannSchmelzen(stand: OfenStand): Schmelzrezept | null {
  if (!stand.eingabe) return null
  const rezept = schmelzrezeptFuer(stand.eingabe.id)
  if (!rezept || !gegenstandById(rezept.ausgabe)) return null
  if (!stand.ausgabe) return rezept
  if (stand.ausgabe.id !== rezept.ausgabe) return null
  if (
    stand.ausgabe.anzahl + rezept.ausgabeAnzahl >
    stapelMaximum(rezept.ausgabe)
  ) {
    return null
  }
  return rezept
}

// Lässt die Zeit im Ofen vergehen — exakt wie in Minecraft:
// Brennstoff zündet nur, wenn etwas zu schmelzen ist; das Feuer
// brennt danach auch leer weiter ab; ohne Feuer schrumpft der
// Schmelz-Fortschritt wieder.
export function tickOfen(stand: OfenStand, dtMs: number): OfenStand {
  const s = { ...stand }
  let rest = Math.max(0, dtMs)
  let runden = 0
  while (rest > 0 && runden < 1000) {
    runden++
    const rezept = kannSchmelzen(s)
    const brand = s.brandRestMs ?? 0
    if (brand <= 0) {
      // Neuen Brennstoff nur anzünden, wenn es etwas zu schmelzen gibt
      if (rezept && s.brennstoff && istBrennstoff(s.brennstoff.id)) {
        const wert = brennwertMs(s.brennstoff.id)
        const uebrig = s.brennstoff.anzahl - 1
        s.brennstoff =
          uebrig > 0 ? { id: s.brennstoff.id, anzahl: uebrig } : null
        s.brandRestMs = wert
        s.brandGesamtMs = wert
        continue
      }
      // Kein Feuer: Fortschritt fällt doppelt so schnell zurück
      s.schmelzMs = Math.max(0, (s.schmelzMs ?? 0) - rest * 2)
      s.brandRestMs = 0
      break
    }
    // Höchstens bis zum Ende des laufenden Schmelzstücks springen —
    // sonst würde ein grosser Zeitschritt nur ein Stück fertigstellen.
    const bisFertig = rezept
      ? SCHMELZ_DAUER_MS - (s.schmelzMs ?? 0)
      : Number.POSITIVE_INFINITY
    const schritt = Math.min(rest, brand, bisFertig)
    if (rezept) {
      const fortschritt = (s.schmelzMs ?? 0) + schritt
      if (fortschritt >= SCHMELZ_DAUER_MS) {
        const eingabeRest = s.eingabe!.anzahl - 1
        s.eingabe =
          eingabeRest > 0 ? { id: s.eingabe!.id, anzahl: eingabeRest } : null
        s.ausgabe = s.ausgabe
          ? { id: s.ausgabe.id, anzahl: s.ausgabe.anzahl + rezept.ausgabeAnzahl }
          : { id: rezept.ausgabe, anzahl: rezept.ausgabeAnzahl }
        s.schmelzMs = fortschritt - SCHMELZ_DAUER_MS
      } else {
        s.schmelzMs = fortschritt
      }
    }
    s.brandRestMs = brand - schritt
    rest -= schritt
  }
  return s
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
