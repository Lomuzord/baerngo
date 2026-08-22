import { gegenstandById, type Gegenstand } from "./gegenstaende"
import { stapelMaximum, type Cursor } from "./inventar"

// Rasterzellen halten wie in Minecraft ganze Stapel; ein Craft
// verbraucht genau 1 Stück pro belegter Zelle.
export type RasterSlot = { id: string; anzahl: number } | null
export type Raster = RasterSlot[]
// Rezept-Formen bleiben reine Id-Layouts (eine Zutat pro Zelle).
export type RasterForm = (string | null)[]

export type Rezept = {
  id: string
  name: string
  zutat: Record<string, number>
  form?: RasterForm
  ergebnisId: string
  ergebnisAnzahl: number
  // Rezepte mit gleicher Gruppe erscheinen als EIN Listeneintrag
  // mit wählbaren Varianten (z. B. die vier Spitzhacken-Stufen)
  gruppe?: string
}

const REZEPTE: readonly Rezept[] = [
  {
    id: "stock",
    name: "Stock",
    zutat: { holz: 2 },
    form: [
      null,
      "holz",
      null,
      null,
      "holz",
      null,
      null,
      null,
      null,
    ],
    ergebnisId: "stock",
    ergebnisAnzahl: 4,
  },
  {
    id: "holzpickel",
    name: "Holzspitzhacke",
    zutat: { holz: 3, stock: 2 },
    form: [
      "holz",
      "holz",
      "holz",
      null,
      "stock",
      null,
      null,
      "stock",
      null,
    ],
    ergebnisId: "holzpickel",
    ergebnisAnzahl: 1,
    gruppe: "spitzhacke",
  },
  {
    id: "pickel",
    name: "Steinspitzhacke",
    zutat: { stein: 3, stock: 2 },
    form: [
      "stein",
      "stein",
      "stein",
      null,
      "stock",
      null,
      null,
      "stock",
      null,
    ],
    ergebnisId: "pickel",
    ergebnisAnzahl: 1,
    gruppe: "spitzhacke",
  },
  {
    id: "eisenpickel",
    name: "Eisenspitzhacke",
    zutat: { eisen: 3, stock: 2 },
    form: [
      "eisen",
      "eisen",
      "eisen",
      null,
      "stock",
      null,
      null,
      "stock",
      null,
    ],
    ergebnisId: "eisenpickel",
    ergebnisAnzahl: 1,
    gruppe: "spitzhacke",
  },
  {
    id: "diamantpickel",
    name: "Diamantspitzhacke",
    zutat: { diamant: 3, stock: 2 },
    form: [
      "diamant",
      "diamant",
      "diamant",
      null,
      "stock",
      null,
      null,
      "stock",
      null,
    ],
    ergebnisId: "diamantpickel",
    ergebnisAnzahl: 1,
    gruppe: "spitzhacke",
  },
  {
    id: "axt",
    name: "Axt",
    zutat: { stein: 3, stock: 2 },
    form: [
      "stein",
      "stein",
      null,
      "stein",
      "stock",
      null,
      null,
      "stock",
      null,
    ],
    ergebnisId: "axt",
    ergebnisAnzahl: 1,
  },
  {
    id: "schwert",
    name: "Schwert",
    zutat: { gold: 2, stock: 1 },
    form: [
      null,
      "gold",
      null,
      null,
      "gold",
      null,
      null,
      "stock",
      null,
    ],
    ergebnisId: "schwert",
    ergebnisAnzahl: 1,
  },
  {
    id: "holzschaufel",
    name: "Holzschaufel",
    zutat: { holz: 1, stock: 2 },
    form: [
      null,
      "holz",
      null,
      null,
      "stock",
      null,
      null,
      "stock",
      null,
    ],
    ergebnisId: "holzschaufel",
    ergebnisAnzahl: 1,
    gruppe: "schaufel",
  },
  {
    id: "schaufel",
    name: "Steinschaufel",
    zutat: { stein: 1, stock: 2 },
    form: [
      null,
      "stein",
      null,
      null,
      "stock",
      null,
      null,
      "stock",
      null,
    ],
    ergebnisId: "schaufel",
    ergebnisAnzahl: 1,
    gruppe: "schaufel",
  },
  {
    id: "eisenschaufel",
    name: "Eisenschaufel",
    zutat: { eisen: 1, stock: 2 },
    form: [
      null,
      "eisen",
      null,
      null,
      "stock",
      null,
      null,
      "stock",
      null,
    ],
    ergebnisId: "eisenschaufel",
    ergebnisAnzahl: 1,
    gruppe: "schaufel",
  },
  {
    id: "diamantschaufel",
    name: "Diamantschaufel",
    zutat: { diamant: 1, stock: 2 },
    form: [
      null,
      "diamant",
      null,
      null,
      "stock",
      null,
      null,
      "stock",
      null,
    ],
    ergebnisId: "diamantschaufel",
    ergebnisAnzahl: 1,
    gruppe: "schaufel",
  },
  {
    id: "hacke",
    name: "Hacke",
    zutat: { stein: 2, stock: 2 },
    form: [
      "stein",
      "stein",
      null,
      null,
      "stock",
      null,
      null,
      "stock",
      null,
    ],
    ergebnisId: "hacke",
    ergebnisAnzahl: 1,
    gruppe: "hacke",
  },
  {
    id: "eisenblock",
    name: "Eisenblock",
    zutat: { eisen: 9 },
    form: [
      "eisen", "eisen", "eisen",
      "eisen", "eisen", "eisen",
      "eisen", "eisen", "eisen",
    ],
    ergebnisId: "eisenblock",
    ergebnisAnzahl: 1,
  },
  {
    id: "eisen-aus-block",
    name: "Eisen",
    zutat: { eisenblock: 1 },
    ergebnisId: "eisen",
    ergebnisAnzahl: 9,
  },
  {
    id: "glasscheibe",
    name: "Glasscheibe",
    zutat: { glas: 6 },
    form: [
      "glas", "glas", "glas",
      "glas", "glas", "glas",
      null, null, null,
    ],
    ergebnisId: "glasscheibe",
    ergebnisAnzahl: 16,
  },
  {
    id: "holzstufe",
    name: "Holzstufe",
    zutat: { holz: 3 },
    form: [
      "holz", "holz", "holz",
      null, null, null,
      null, null, null,
    ],
    ergebnisId: "holzstufe",
    ergebnisAnzahl: 6,
  },
  {
    id: "steinstufe",
    name: "Steinstufe",
    zutat: { stein: 3 },
    form: [
      "stein", "stein", "stein",
      null, null, null,
      null, null, null,
    ],
    ergebnisId: "steinstufe",
    ergebnisAnzahl: 6,
  },
  {
    id: "holztreppe",
    name: "Holztreppe",
    zutat: { holz: 6 },
    form: [
      "holz", null, null,
      "holz", "holz", null,
      "holz", "holz", "holz",
    ],
    ergebnisId: "holztreppe",
    ergebnisAnzahl: 4,
  },
  {
    id: "steintreppe",
    name: "Steintreppe",
    zutat: { stein: 6 },
    form: [
      "stein", null, null,
      "stein", "stein", null,
      "stein", "stein", "stein",
    ],
    ergebnisId: "steintreppe",
    ergebnisAnzahl: 4,
  },
  {
    id: "tuer",
    name: "Tür",
    zutat: { holz: 6 },
    form: [
      "holz", "holz", null,
      "holz", "holz", null,
      "holz", "holz", null,
    ],
    ergebnisId: "tuer",
    ergebnisAnzahl: 3,
  },
  {
    id: "zaun",
    name: "Zaun",
    zutat: { holz: 4, stock: 2 },
    form: [
      null, null, null,
      "holz", "stock", "holz",
      "holz", "stock", "holz",
    ],
    ergebnisId: "zaun",
    ergebnisAnzahl: 3,
  },
  {
    id: "leiter",
    name: "Leiter",
    zutat: { stock: 7 },
    form: [
      "stock", null, "stock",
      "stock", "stock", "stock",
      "stock", null, "stock",
    ],
    ergebnisId: "leiter",
    ergebnisAnzahl: 3,
  },
  {
    id: "brot",
    name: "Brot",
    zutat: { weizen: 3 },
    form: [
      "weizen",
      "weizen",
      "weizen",
      null,
      null,
      null,
      null,
      null,
      null,
    ],
    ergebnisId: "brot",
    ergebnisAnzahl: 1,
  },
  {
    id: "werkbank",
    name: "Werkbank",
    zutat: { holz: 4 },
    form: [
      "holz",
      "holz",
      null,
      "holz",
      "holz",
      null,
      null,
      null,
      null,
    ],
    ergebnisId: "werkbank",
    ergebnisAnzahl: 1,
  },
  {
    id: "sandstein",
    name: "Sandstein",
    zutat: { sand: 4 },
    form: [
      "sand",
      "sand",
      null,
      "sand",
      "sand",
      null,
      null,
      null,
      null,
    ],
    ergebnisId: "sandstein",
    ergebnisAnzahl: 1,
  },
  {
    id: "goldblock",
    name: "Goldblock",
    zutat: { gold: 9 },
    ergebnisId: "goldblock",
    ergebnisAnzahl: 1,
  },
  {
    id: "gold-aus-block",
    name: "Gold",
    zutat: { goldblock: 1 },
    ergebnisId: "gold",
    ergebnisAnzahl: 9,
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
    name: "Holzbretter",
    zutat: { stamm: 1 },
    form: [
      null,
      null,
      null,
      null,
      "stamm",
      null,
      null,
      null,
      null,
    ],
    ergebnisId: "holz",
    ergebnisAnzahl: 4,
  },
  {
    id: "ofen",
    name: "Ofen",
    zutat: { stein: 8 },
    form: [
      "stein",
      "stein",
      "stein",
      "stein",
      null,
      "stein",
      "stein",
      "stein",
      "stein",
    ],
    ergebnisId: "ofen",
    ergebnisAnzahl: 1,
  },
  {
    id: "diamantblock",
    name: "Diamantblock",
    zutat: { diamant: 9 },
    ergebnisId: "diamantblock",
    ergebnisAnzahl: 1,
  },
  {
    id: "diamant-aus-block",
    name: "Diamant",
    zutat: { diamantblock: 1 },
    ergebnisId: "diamant",
    ergebnisAnzahl: 9,
  },
  {
    id: "fackel",
    name: "Fackel",
    zutat: { kohle: 1, stock: 1 },
    form: [
      null,
      "kohle",
      null,
      null,
      "stock",
      null,
      null,
      null,
      null,
    ],
    ergebnisId: "fackel",
    ergebnisAnzahl: 4,
  },
  {
    id: "kohleblock",
    name: "Kohleblock",
    zutat: { kohle: 9 },
    ergebnisId: "kohleblock",
    ergebnisAnzahl: 1,
  },
  {
    id: "kohle-aus-block",
    name: "Kohle",
    zutat: { kohleblock: 1 },
    ergebnisId: "kohle",
    ergebnisAnzahl: 9,
  },
  {
    id: "buecherregal",
    name: "Bücherregal",
    zutat: { holz: 6, buch: 3 },
    form: [
      "holz",
      "holz",
      "holz",
      "buch",
      "buch",
      "buch",
      "holz",
      "holz",
      "holz",
    ],
    ergebnisId: "buecherregal",
    ergebnisAnzahl: 1,
  },
  {
    id: "eimer",
    name: "Eimer",
    zutat: { eisen: 3 },
    form: [
      null,
      null,
      null,
      "eisen",
      null,
      "eisen",
      null,
      "eisen",
      null,
    ],
    ergebnisId: "eimer",
    ergebnisAnzahl: 1,
  },
  {
    id: "moosstein",
    name: "Moosstein",
    zutat: { stein: 1, laub: 1 },
    ergebnisId: "moosstein",
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

export function rasterAusIds(ids: readonly (string | null)[]): Raster {
  const raster = leeresRaster()
  for (let i = 0; i < 9; i++) {
    const id = ids[i]
    raster[i] = id ? { id, anzahl: 1 } : null
  }
  return raster
}

export function idsVomRaster(raster: Raster): RasterForm {
  const ids: RasterForm = []
  for (let i = 0; i < 9; i++) {
    ids.push(raster[i]?.id ?? null)
  }
  return ids
}

export function klickRaster(
  raster: Raster,
  index: number,
  cursor: Cursor | null,
  taste: "links" | "rechts" = "links",
): { raster: Raster; cursor: Cursor | null } {
  const danach = raster.slice(0, 9)
  while (danach.length < 9) danach.push(null)
  if (index < 0 || index >= 9) return { raster: danach, cursor }
  const zelle = danach[index]
  if (!cursor) {
    if (!zelle) return { raster: danach, cursor: null }
    if (taste === "rechts") {
      // Halben Stapel aufnehmen wie in Minecraft
      const nimm = Math.ceil(zelle.anzahl / 2)
      const rest = zelle.anzahl - nimm
      danach[index] = rest > 0 ? { id: zelle.id, anzahl: rest } : null
      return { raster: danach, cursor: { id: zelle.id, anzahl: nimm } }
    }
    danach[index] = null
    return { raster: danach, cursor: { id: zelle.id, anzahl: zelle.anzahl } }
  }
  const max = stapelMaximum(cursor.id)
  if (!zelle) {
    const lege = taste === "rechts" ? 1 : Math.min(cursor.anzahl, max)
    const rest = cursor.anzahl - lege
    danach[index] = { id: cursor.id, anzahl: lege }
    return {
      raster: danach,
      cursor: rest > 0 ? { id: cursor.id, anzahl: rest } : null,
    }
  }
  if (zelle.id === cursor.id) {
    const platz = max - zelle.anzahl
    if (platz <= 0) return { raster: danach, cursor }
    const lege = taste === "rechts" ? 1 : Math.min(cursor.anzahl, platz)
    const rest = cursor.anzahl - lege
    danach[index] = { id: zelle.id, anzahl: zelle.anzahl + lege }
    return {
      raster: danach,
      cursor: rest > 0 ? { id: cursor.id, anzahl: rest } : null,
    }
  }
  if (taste === "rechts") return { raster: danach, cursor }
  danach[index] = { id: cursor.id, anzahl: cursor.anzahl }
  return { raster: danach, cursor: { id: zelle.id, anzahl: zelle.anzahl } }
}

export function zaehleRaster(raster: Raster): Record<string, number> {
  const stand: Record<string, number> = {}
  for (const zelle of raster) {
    if (!zelle) continue
    stand[zelle.id] = (stand[zelle.id] ?? 0) + zelle.anzahl
  }
  return stand
}

export function rezeptFuerRaster(raster: Raster): Rezept | null {
  const ids = idsVomRaster(raster)
  for (const rezept of REZEPTE) {
    if (rezept.form && passtForm(ids, rezept.form)) return rezept
  }
  // Formlose Rezepte: eine Zutat pro Zelle, Stapelhöhe zählt nicht.
  const belegung: Record<string, number> = {}
  for (const id of ids) {
    if (!id) continue
    belegung[id] = (belegung[id] ?? 0) + 1
  }
  for (const rezept of REZEPTE) {
    if (rezept.form) continue
    if (passtZutaten(belegung, rezept.zutat)) return rezept
  }
  return null
}

export function ergebnisFuerRaster(raster: Raster): Gegenstand | null {
  const rezept = rezeptFuerRaster(raster)
  if (!rezept) return null
  return gegenstandById(rezept.ergebnisId) ?? null
}

export function formFuerRezept(rezept: Rezept): RasterForm {
  if (rezept.form) return [...rezept.form]
  const form: RasterForm = [
    null, null, null, null, null, null, null, null, null,
  ]
  let index = 0
  for (const [id, anzahl] of Object.entries(rezept.zutat)) {
    for (let n = 0; n < anzahl && index < 9; n++) {
      form[index] = id
      index += 1
    }
  }
  return form
}

export function kannRezept(
  inventar: InventarStand,
  raster: Raster,
  rezeptId: string,
): boolean {
  return fehlendeZutaten(inventar, raster, rezeptId).every(
    (zutat) => zutat.fehlt === 0,
  )
}

export function fehlendeZutaten(
  inventar: InventarStand,
  raster: Raster,
  rezeptId: string,
): { id: string; haben: number; braucht: number; fehlt: number }[] {
  const rezept = rezeptById(rezeptId)
  if (!rezept) return []
  const vorrat = vorratMitRaster(inventar, raster)
  return Object.entries(rezept.zutat).map(([id, braucht]) => {
    const haben = vorrat[id] ?? 0
    return {
      id,
      haben,
      braucht,
      fehlt: Math.max(0, braucht - haben),
    }
  })
}

export function legeRezept(
  inventar: InventarStand,
  raster: Raster,
  rezeptId: string,
):
  | { ok: true; inventar: InventarStand; raster: Raster }
  | { ok: false; grund: string } {
  const rezept = rezeptById(rezeptId)
  if (!rezept) return { ok: false, grund: "Unbekanntes Rezept" }
  const gesamt = Object.values(rezept.zutat).reduce((a, b) => a + b, 0)
  if (gesamt > 9) return { ok: false, grund: "Rezept passt nicht ins Raster" }
  const vorrat = vorratMitRaster(inventar, raster)
  for (const [id, anzahl] of Object.entries(rezept.zutat)) {
    if ((vorrat[id] ?? 0) < anzahl) {
      return { ok: false, grund: "Zu wenig Material" }
    }
  }
  for (const [id, anzahl] of Object.entries(rezept.zutat)) {
    vorrat[id] = (vorrat[id] ?? 0) - anzahl
    if (vorrat[id] <= 0) delete vorrat[id]
  }
  return {
    ok: true,
    inventar: vorrat,
    raster: rasterAusIds(formFuerRezept(rezept)),
  }
}

function vorratMitRaster(
  inventar: InventarStand,
  raster: Raster,
): InventarStand {
  const vorrat = { ...inventar }
  for (const zelle of raster) {
    if (!zelle) continue
    vorrat[zelle.id] = (vorrat[zelle.id] ?? 0) + zelle.anzahl
  }
  return vorrat
}

// Craftet einmal: verbraucht 1 Stück pro belegter Zelle, das Ergebnis
// gehört auf den Cursor (macht der Aufrufer).
export function nimmCraft(
  raster: Raster,
):
  | { ok: true; raster: Raster; ergebnis: Gegenstand; anzahl: number }
  | { ok: false; grund: string } {
  const rezept = rezeptFuerRaster(raster)
  const ergebnis = rezept ? gegenstandById(rezept.ergebnisId) : null
  if (!rezept || !ergebnis) return { ok: false, grund: "Kein Rezept" }
  const danach = raster.slice(0, 9)
  while (danach.length < 9) danach.push(null)
  for (let i = 0; i < 9; i++) {
    const zelle = danach[i]
    if (!zelle) continue
    const rest = zelle.anzahl - 1
    danach[i] = rest > 0 ? { id: zelle.id, anzahl: rest } : null
  }
  return {
    ok: true,
    raster: danach,
    ergebnis,
    anzahl: rezept.ergebnisAnzahl,
  }
}

function passtForm(ids: RasterForm, form: RasterForm): boolean {
  if (ids.length !== 9 || form.length !== 9) return false
  return passtFormVersetzt(ids, form) || passtFormVersetzt(ids, spiegeleForm(form))
}

function spiegeleForm(form: RasterForm): RasterForm {
  return [2, 1, 0, 5, 4, 3, 8, 7, 6].map((index) => form[index] ?? null)
}

function passtFormVersetzt(raster: RasterForm, form: RasterForm): boolean {
  const teile: { x: number; y: number; id: string }[] = []
  for (let i = 0; i < 9; i++) {
    const id = form[i]
    if (!id) continue
    teile.push({ x: i % 3, y: Math.floor(i / 3), id })
  }
  if (teile.length === 0) return false
  const minX = Math.min(...teile.map((teil) => teil.x))
  const minY = Math.min(...teile.map((teil) => teil.y))
  const maxX = Math.max(...teile.map((teil) => teil.x))
  const maxY = Math.max(...teile.map((teil) => teil.y))
  const w = maxX - minX + 1
  const h = maxY - minY + 1
  const relativ = teile.map((teil) => ({
    x: teil.x - minX,
    y: teil.y - minY,
    id: teil.id,
  }))
  for (let ox = 0; ox <= 3 - w; ox++) {
    for (let oy = 0; oy <= 3 - h; oy++) {
      if (formPasstBei(raster, relativ, ox, oy)) return true
    }
  }
  return false
}

function formPasstBei(
  raster: RasterForm,
  teile: { x: number; y: number; id: string }[],
  ox: number,
  oy: number,
): boolean {
  const erwartet: RasterForm = [
    null, null, null, null, null, null, null, null, null,
  ]
  for (const teil of teile) {
    erwartet[(teil.y + oy) * 3 + (teil.x + ox)] = teil.id
  }
  return raster.every((zelle, index) => (zelle ?? null) === (erwartet[index] ?? null))
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
