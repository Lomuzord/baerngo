import { gegenstandById, type Gegenstand } from "./gegenstaende"

export type Beute = {
  gegenstandId: string
  anzahl: number
}

type TruhenLoot = {
  signatur: string
  extra: Beute[]
}

const TRUHEN: Record<string, TruhenLoot> = {
  zytglogge: {
    signatur: "gold",
    extra: [
      { gegenstandId: "diamant", anzahl: 2 },
      { gegenstandId: "stein", anzahl: 8 },
      { gegenstandId: "golderz", anzahl: 4 },
    ],
  },
  muenster: {
    signatur: "sandstein",
    extra: [
      { gegenstandId: "kohle", anzahl: 6 },
      { gegenstandId: "ziegel", anzahl: 6 },
      { gegenstandId: "diamant", anzahl: 1 },
    ],
  },
  baerengraben: {
    signatur: "honig",
    extra: [
      { gegenstandId: "stamm", anzahl: 8 },
      { gegenstandId: "sand", anzahl: 6 },
      { gegenstandId: "kohleerz", anzahl: 3 },
    ],
  },
  bundeshaus: {
    signatur: "smaragd",
    extra: [
      { gegenstandId: "diamant", anzahl: 2 },
      { gegenstandId: "eisenerz", anzahl: 4 },
      { gegenstandId: "stein", anzahl: 8 },
    ],
  },
  gibb: {
    signatur: "buch",
    extra: [
      { gegenstandId: "kohle", anzahl: 6 },
      { gegenstandId: "stamm", anzahl: 8 },
      { gegenstandId: "eisenerz", anzahl: 3 },
    ],
  },
  rosengarten: {
    signatur: "laub",
    extra: [
      { gegenstandId: "honig", anzahl: 4 },
      { gegenstandId: "gras", anzahl: 8 },
      { gegenstandId: "smaragd", anzahl: 1 },
    ],
  },
  kaefigturm: {
    signatur: "stein",
    extra: [
      { gegenstandId: "eisenerz", anzahl: 5 },
      { gegenstandId: "ziegel", anzahl: 6 },
      { gegenstandId: "gold", anzahl: 2 },
    ],
  },
  einsteinhaus: {
    signatur: "glas",
    extra: [
      { gegenstandId: "buch", anzahl: 2 },
      { gegenstandId: "golderz", anzahl: 4 },
      { gegenstandId: "diamant", anzahl: 1 },
    ],
  },
  "zentrum-paul-klee": {
    signatur: "sand",
    extra: [
      { gegenstandId: "glas", anzahl: 5 },
      { gegenstandId: "eisen", anzahl: 3 },
      { gegenstandId: "smaragd", anzahl: 1 },
    ],
  },
  gurten: {
    signatur: "gras",
    extra: [
      { gegenstandId: "stamm", anzahl: 10 },
      { gegenstandId: "laub", anzahl: 6 },
      { gegenstandId: "diamanterz", anzahl: 2 },
    ],
  },
  kunstmuseum: {
    signatur: "ziegel",
    extra: [
      { gegenstandId: "glas", anzahl: 4 },
      { gegenstandId: "gold", anzahl: 3 },
      { gegenstandId: "diamant", anzahl: 1 },
    ],
  },
  nydeggkirche: {
    signatur: "moosstein",
    extra: [
      { gegenstandId: "stein", anzahl: 8 },
      { gegenstandId: "glas", anzahl: 3 },
      { gegenstandId: "gold", anzahl: 2 },
    ],
  },
  "botanischer-garten": {
    signatur: "lehm",
    extra: [
      { gegenstandId: "laub", anzahl: 8 },
      { gegenstandId: "honig", anzahl: 3 },
      { gegenstandId: "smaragd", anzahl: 1 },
    ],
  },
  heiliggeistkirche: {
    signatur: "granit",
    extra: [
      { gegenstandId: "sandstein", anzahl: 6 },
      { gegenstandId: "glas", anzahl: 4 },
      { gegenstandId: "gold", anzahl: 2 },
    ],
  },
  "franzoesische-kirche": {
    signatur: "andesit",
    extra: [
      { gegenstandId: "stein", anzahl: 6 },
      { gegenstandId: "buch", anzahl: 2 },
      { gegenstandId: "smaragd", anzahl: 1 },
    ],
  },
  tierpark: {
    signatur: "stamm",
    extra: [
      { gegenstandId: "gras", anzahl: 8 },
      { gegenstandId: "laub", anzahl: 6 },
      { gegenstandId: "honig", anzahl: 3 },
    ],
  },
  kornhaus: {
    signatur: "holz",
    extra: [
      { gegenstandId: "sandstein", anzahl: 6 },
      { gegenstandId: "honig", anzahl: 3 },
      { gegenstandId: "gold", anzahl: 2 },
    ],
  },
  "naturhistorisches-museum": {
    signatur: "erde",
    extra: [
      { gegenstandId: "kies", anzahl: 6 },
      { gegenstandId: "buch", anzahl: 2 },
      { gegenstandId: "diamanterz", anzahl: 1 },
    ],
  },
  universitaet: {
    signatur: "kies",
    extra: [
      { gegenstandId: "buch", anzahl: 3 },
      { gegenstandId: "sandstein", anzahl: 6 },
      { gegenstandId: "smaragd", anzahl: 1 },
    ],
  },
}

export type Ressource = Gegenstand

export function ressourceFuerSehenswuerdigkeit(
  sehenswuerdigkeitId: string,
): Gegenstand | undefined {
  const signatur = TRUHEN[sehenswuerdigkeitId]?.signatur
  return signatur ? gegenstandById(signatur) : undefined
}

export function beuteFuerSehenswuerdigkeit(
  sehenswuerdigkeitId: string,
): Beute[] {
  const loot = TRUHEN[sehenswuerdigkeitId]
  if (!loot) return []
  return [{ gegenstandId: loot.signatur, anzahl: 5 }, ...loot.extra]
}

export function formatiereBeute(beute: Beute[]): string {
  return beute
    .map((stuck) => {
      const name = gegenstandById(stuck.gegenstandId)?.name ?? stuck.gegenstandId
      return `+${stuck.anzahl} ${name}`
    })
    .join(" · ")
}

export function legeBeuteInInventar(
  inventar: Record<string, number>,
  beute: Beute[],
): Record<string, number> {
  const danach = { ...inventar }
  for (const stuck of beute) {
    if (stuck.anzahl <= 0) continue
    danach[stuck.gegenstandId] = (danach[stuck.gegenstandId] ?? 0) + stuck.anzahl
  }
  return danach
}

export function parseInventar(roh: unknown): Record<string, number> {
  if (!roh || typeof roh !== "object" || Array.isArray(roh)) return {}
  const stand: Record<string, number> = {}
  for (const [id, wert] of Object.entries(roh as Record<string, unknown>)) {
    if (!gegenstandById(id)) continue
    const anzahl = typeof wert === "number" ? wert : Number(wert)
    if (!Number.isFinite(anzahl) || anzahl <= 0) continue
    stand[id] = Math.floor(anzahl)
  }
  return stand
}
