export const PICKEL_HALTBARKEIT = 32
const HAND_MS = 1450
const AXT_MS = 400

// Stufen wie in Minecraft: Holz 2x, Stein ~4x, Eisen 6x, Diamant 8x
// so schnell wie die Hand; Haltbarkeit wächst mit jeder Stufe.
const PICKEL_ARTEN: Record<string, { ms: number; haltbarkeit: number }> = {
  holzpickel: { ms: 725, haltbarkeit: 16 },
  pickel: { ms: 380, haltbarkeit: PICKEL_HALTBARKEIT },
  eisenpickel: { ms: 240, haltbarkeit: 64 },
  diamantpickel: { ms: 180, haltbarkeit: 160 },
}

// Schaufeln: gleiche Stufen-Geschwindigkeiten, wirken auf Erdiges
const SCHAUFEL_ARTEN: Record<string, { ms: number; haltbarkeit: number }> = {
  holzschaufel: { ms: 725, haltbarkeit: 16 },
  schaufel: { ms: 380, haltbarkeit: PICKEL_HALTBARKEIT },
  eisenschaufel: { ms: 240, haltbarkeit: 64 },
  diamantschaufel: { ms: 180, haltbarkeit: 160 },
}

export function istPickel(id: string | null | undefined): boolean {
  return Boolean(id && PICKEL_ARTEN[id])
}

export function istSchaufel(id: string | null | undefined): boolean {
  return Boolean(id && SCHAUFEL_ARTEN[id])
}

export function pickelHaltbarkeitFuer(id: string): number {
  return (
    PICKEL_ARTEN[id]?.haltbarkeit ??
    SCHAUFEL_ARTEN[id]?.haltbarkeit ??
    PICKEL_HALTBARKEIT
  )
}

export function listPickelArten(): string[] {
  return Object.keys(PICKEL_ARTEN)
}

const HOLZART = new Set([
  "stamm",
  "holz",
  "laub",
  "werkbank",
  "buecherregal",
  "holzstufe",
  "holztreppe",
  "tuer",
  "zaun",
  "leiter",
])

// Erdiges gräbt sich mit der Schaufel schneller
const ERDART = new Set([
  "erde",
  "gras",
  "kies",
  "sand",
  "lehm",
  "ackerboden",
])
const STEINART = new Set([
  "stein",
  "bruchstein",
  "kohleblock",
  "kies",
  "sandstein",
  "ziegel",
  "moosstein",
  "granit",
  "andesit",
  "ofen",
  "kohleerz",
  "eisenerz",
  "golderz",
  "diamanterz",
  "eisen",
  "gold",
  "goldblock",
  "smaragd",
  "diamantblock",
  "glas",
  "bernwappen",
  "eisenblock",
  "glasscheibe",
  "redstoneerz",
  "redstonelampe",
  "steinstufe",
  "steintreppe",
])

const HAERTE: Record<string, number> = {
  erde: 0.7,
  gras: 0.75,
  kies: 0.65,
  sandstein: 0.9,
  stamm: 1,
  holz: 1,
  honig: 0.85,
  stein: 1.55,
  ziegel: 1.5,
  eisen: 2,
  gold: 1.7,
  goldblock: 2.1,
  smaragd: 2.1,
  bernwappen: 2,
  buch: 0.9,
  laub: 0.3,
  moosstein: 1.6,
  lehm: 0.7,
  glas: 0.4,
  granit: 1.5,
  andesit: 1.5,
  sand: 0.55,
  kohleerz: 1.4,
  eisenerz: 1.7,
  golderz: 1.6,
  diamanterz: 2.4,
  diamantblock: 2.3,
  ofen: 1.6,
  werkbank: 1.1,
  bruchstein: 1.5,
  fackel: 0.2,
  kohleblock: 2.0,
  buecherregal: 1.2,
  setzling: 0.2,
  wasser: 0.2,
  samen: 0.2,
  weizen: 0.2,
  ackerboden: 0.7,
  eisenblock: 2.2,
  glasscheibe: 0.3,
  holzstufe: 0.9,
  steinstufe: 1.4,
  holztreppe: 1,
  steintreppe: 1.5,
  tuer: 1,
  zaun: 0.9,
  leiter: 0.5,
  wolle: 0.8,
  redstoneerz: 1.9,
  redstone: 0.2,
  hebel: 0.3,
  knopf: 0.3,
  redstonefackel: 0.2,
  redstonelampe: 0.6,
}


// Was ein abgebauter Block wirklich fallen lässt — Stein wird wie in
// Minecraft zu Bruchstein.
export function abbauDrop(gegenstandId: string): string {
  if (gegenstandId === "stein") return "bruchstein"
  // Ackerboden wird beim Abbauen wieder zu schlichter Erde
  if (gegenstandId === "ackerboden") return "erde"
  return gegenstandId
}

export type AbbauStand = Record<string, number>

export function abbaudauerMs(
  gegenstandId: string,
  werkzeugId: string | null,
): number {
  const hart = HAERTE[gegenstandId] ?? 1.2
  let basis = HAND_MS
  if (werkzeugId && istPickel(werkzeugId) && STEINART.has(gegenstandId)) {
    basis = PICKEL_ARTEN[werkzeugId]!.ms
  } else if (
    werkzeugId &&
    istSchaufel(werkzeugId) &&
    ERDART.has(gegenstandId)
  ) {
    basis = SCHAUFEL_ARTEN[werkzeugId]!.ms
  } else if (werkzeugId === "axt" && HOLZART.has(gegenstandId)) {
    basis = AXT_MS
  }
  return Math.max(200, Math.round(basis * hart))
}

export function rissStufeVonAnteil(anteil: number): 0 | 1 | 2 | 3 {
  if (anteil <= 0) return 0
  if (anteil < 1 / 3) return 1
  if (anteil < 2 / 3) return 2
  return 3
}

export function nutzePickel(
  inventar: Record<string, number>,
  haltbarkeit: number,
  werkzeugId = "pickel",
): { inventar: Record<string, number>; haltbarkeit: number; zerbrochen: boolean } {
  const maximum = pickelHaltbarkeitFuer(werkzeugId)
  if ((inventar[werkzeugId] ?? 0) < 1) {
    return { inventar, haltbarkeit, zerbrochen: false }
  }
  const rest = Math.max(0, haltbarkeit - 1)
  if (rest > 0) {
    return { inventar, haltbarkeit: rest, zerbrochen: false }
  }
  const danach: Record<string, number> = {
    ...inventar,
    [werkzeugId]: (inventar[werkzeugId] ?? 1) - 1,
  }
  if (danach[werkzeugId]! <= 0) delete danach[werkzeugId]
  const noch = (danach[werkzeugId] ?? 0) > 0
  return {
    inventar: danach,
    haltbarkeit: noch ? maximum : 0,
    zerbrochen: true,
  }
}

export function haltbarkeitNachZugang(
  bisher: number,
  pickelVorher: number,
  pickelNachher: number,
  maximum = PICKEL_HALTBARKEIT,
): number {
  if (pickelNachher <= 0) return 0
  if (pickelVorher <= 0) return maximum
  return bisher > 0 ? bisher : maximum
}

export function anzeigeHaltbarkeit(
  haltbarkeit: number,
  pickelAnzahl: number,
  maximum = PICKEL_HALTBARKEIT,
): number {
  if (pickelAnzahl <= 0) return 0
  return haltbarkeit > 0 ? haltbarkeit : maximum
}

export function rissStufe(treffer: number, braucht: number): 0 | 1 | 2 | 3 {
  if (treffer <= 0 || braucht <= 0) return 0
  return rissStufeVonAnteil(treffer / braucht)
}
