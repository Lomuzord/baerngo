export type Gegenstand = {
  id: string
  name: string
  textur: string
  faellt?: boolean
}

const GEGENSTAENDE: Record<string, Gegenstand> = {
  gold: { id: "gold", name: "Gold", textur: "/bloecke/gold.png" },
  sandstein: {
    id: "sandstein",
    name: "Sandstein",
    textur: "/bloecke/sandstein.png",
    faellt: true,
  },
  honig: { id: "honig", name: "Honig", textur: "/bloecke/honig.png" },
  smaragd: { id: "smaragd", name: "Smaragd", textur: "/bloecke/smaragd.png" },
  buch: { id: "buch", name: "Buch", textur: "/bloecke/buch.png" },
  erde: { id: "erde", name: "Erde", textur: "/bloecke/erde.png" },
  gras: { id: "gras", name: "Gras", textur: "/bloecke/gras.png" },
  holz: { id: "holz", name: "Holzbretter", textur: "/bloecke/holz.png" },
  stamm: { id: "stamm", name: "Holzstamm", textur: "/bloecke/stamm.png" },
  stein: { id: "stein", name: "Stein", textur: "/bloecke/stein.png" },
  bruchstein: {
    id: "bruchstein",
    name: "Bruchstein",
    textur: "/bloecke/bruchstein.png",
  },
  fackel: { id: "fackel", name: "Fackel", textur: "/bloecke/fackel.png" },
  eisen: { id: "eisen", name: "Eisen", textur: "/bloecke/eisen.png" },
  kies: { id: "kies", name: "Kies", textur: "/bloecke/kies.png", faellt: true },
  ziegel: { id: "ziegel", name: "Ziegel", textur: "/bloecke/ziegel.png" },
  laub: { id: "laub", name: "Laub", textur: "/bloecke/laub.png" },
  moosstein: {
    id: "moosstein",
    name: "Moosstein",
    textur: "/bloecke/moosstein.png",
  },
  lehm: { id: "lehm", name: "Lehm", textur: "/bloecke/lehm.png" },
  glas: { id: "glas", name: "Glas", textur: "/bloecke/glas.png" },
  granit: { id: "granit", name: "Granit", textur: "/bloecke/granit.png" },
  andesit: { id: "andesit", name: "Andesit", textur: "/bloecke/andesit.png" },
  sand: { id: "sand", name: "Sand", textur: "/bloecke/sand.png", faellt: true },
  kohle: { id: "kohle", name: "Kohle", textur: "/bloecke/kohle.png" },
  kohleerz: { id: "kohleerz", name: "Kohleerz", textur: "/bloecke/kohleerz.png" },
  eisenerz: { id: "eisenerz", name: "Eisenerz", textur: "/bloecke/eisenerz.png" },
  golderz: { id: "golderz", name: "Golderz", textur: "/bloecke/golderz.png" },
  diamanterz: {
    id: "diamanterz",
    name: "Diamanterz",
    textur: "/bloecke/diamanterz.png",
  },
  diamant: { id: "diamant", name: "Diamant", textur: "/bloecke/diamant.png" },
  diamantblock: {
    id: "diamantblock",
    name: "Diamantblock",
    textur: "/bloecke/diamantblock.png",
  },
  ofen: { id: "ofen", name: "Ofen", textur: "/bloecke/ofen.png" },
  werkbank: { id: "werkbank", name: "Werkbank", textur: "/bloecke/werkbank.png" },
  kohleblock: {
    id: "kohleblock",
    name: "Kohleblock",
    textur: "/bloecke/kohleblock.png",
  },
  buecherregal: {
    id: "buecherregal",
    name: "Bücherregal",
    textur: "/bloecke/buecherregal.png",
  },
  eimer: { id: "eimer", name: "Eimer", textur: "/bloecke/eimer.png" },
  wassereimer: {
    id: "wassereimer",
    name: "Wassereimer",
    textur: "/bloecke/wassereimer.png",
  },
  wasser: { id: "wasser", name: "Wasser", textur: "/bloecke/wasser.png" },
  setzling: {
    id: "setzling",
    name: "Setzling",
    textur: "/bloecke/setzling.png",
  },
  samen: { id: "samen", name: "Samen", textur: "/bloecke/samen.png" },
  weizen: { id: "weizen", name: "Weizen", textur: "/bloecke/weizen.png" },
  brot: { id: "brot", name: "Brot", textur: "/bloecke/brot.png" },
  holzschaufel: {
    id: "holzschaufel",
    name: "Holzschaufel",
    textur: "/bloecke/holzschaufel.png",
  },
  schaufel: {
    id: "schaufel",
    name: "Steinschaufel",
    textur: "/bloecke/schaufel.png",
  },
  eisenschaufel: {
    id: "eisenschaufel",
    name: "Eisenschaufel",
    textur: "/bloecke/eisenschaufel.png",
  },
  diamantschaufel: {
    id: "diamantschaufel",
    name: "Diamantschaufel",
    textur: "/bloecke/diamantschaufel.png",
  },
  hacke: { id: "hacke", name: "Hacke", textur: "/bloecke/hacke.png" },
  ackerboden: {
    id: "ackerboden",
    name: "Ackerboden",
    textur: "/bloecke/ackerboden.png",
  },
  eisenblock: {
    id: "eisenblock",
    name: "Eisenblock",
    textur: "/bloecke/eisenblock.png",
  },
  glasscheibe: {
    id: "glasscheibe",
    name: "Glasscheibe",
    textur: "/bloecke/glasscheibe.png",
  },
  holzstufe: {
    id: "holzstufe",
    name: "Holzstufe",
    textur: "/bloecke/holzstufe.png",
  },
  steinstufe: {
    id: "steinstufe",
    name: "Steinstufe",
    textur: "/bloecke/steinstufe.png",
  },
  holztreppe: {
    id: "holztreppe",
    name: "Holztreppe",
    textur: "/bloecke/holztreppe.png",
  },
  tuer: { id: "tuer", name: "Tür", textur: "/bloecke/tuer.png" },
  feder: { id: "feder", name: "Feder", textur: "/bloecke/feder.png" },
  ei: { id: "ei", name: "Ei", textur: "/bloecke/ei.png" },
  wolle: { id: "wolle", name: "Wolle", textur: "/bloecke/wolle.png" },
  leder: { id: "leder", name: "Leder", textur: "/bloecke/leder.png" },
  milcheimer: {
    id: "milcheimer",
    name: "Milcheimer",
    textur: "/bloecke/milcheimer.png",
  },
  schere: { id: "schere", name: "Schere", textur: "/bloecke/schere.png" },
  kuchen: { id: "kuchen", name: "Kuchen", textur: "/bloecke/kuchen.png" },
  bett: { id: "bett", name: "Bett", textur: "/bloecke/bett.png" },
  teppich: { id: "teppich", name: "Teppich", textur: "/bloecke/teppich.png" },
  bilderrahmen: {
    id: "bilderrahmen",
    name: "Bilderrahmen",
    textur: "/bloecke/bilderrahmen.png",
  },
  redstoneerz: {
    id: "redstoneerz",
    name: "Redstone-Erz",
    textur: "/bloecke/redstoneerz.png",
  },
  redstone: {
    id: "redstone",
    name: "Redstone-Staub",
    textur: "/bloecke/redstone.png",
  },
  hebel: { id: "hebel", name: "Hebel", textur: "/bloecke/hebel.png" },
  knopf: { id: "knopf", name: "Knopf", textur: "/bloecke/knopf.png" },
  redstonefackel: {
    id: "redstonefackel",
    name: "Redstone-Fackel",
    textur: "/bloecke/redstonefackel.png",
  },
  redstonelampe: {
    id: "redstonelampe",
    name: "Redstone-Lampe",
    textur: "/bloecke/redstonelampe.png",
  },
  zaun: { id: "zaun", name: "Zaun", textur: "/bloecke/zaun.png" },
  leiter: { id: "leiter", name: "Leiter", textur: "/bloecke/leiter.png" },
  steintreppe: {
    id: "steintreppe",
    name: "Steintreppe",
    textur: "/bloecke/steintreppe.png",
  },
  goldblock: { id: "goldblock", name: "Goldblock", textur: "/bloecke/goldblock.png" },
  honigbrot: { id: "honigbrot", name: "Honigbrot", textur: "/bloecke/honigbrot.png" },
  bernwappen: { id: "bernwappen", name: "Bernwappen", textur: "/bloecke/bernwappen.png" },
  holzpickel: {
    id: "holzpickel",
    name: "Holzspitzhacke",
    textur: "/bloecke/holzpickel.png",
  },
  pickel: { id: "pickel", name: "Steinspitzhacke", textur: "/bloecke/pickel.png" },
  eisenpickel: {
    id: "eisenpickel",
    name: "Eisenspitzhacke",
    textur: "/bloecke/eisenpickel.png",
  },
  diamantpickel: {
    id: "diamantpickel",
    name: "Diamantspitzhacke",
    textur: "/bloecke/diamantpickel.png",
  },
  axt: { id: "axt", name: "Axt", textur: "/bloecke/axt.png" },
  schwert: { id: "schwert", name: "Schwert", textur: "/bloecke/schwert.png" },
  stock: { id: "stock", name: "Stock", textur: "/bloecke/stock.png" },
}

export function gegenstandById(id: string): Gegenstand | undefined {
  return GEGENSTAENDE[id]
}

export function listGegenstaende(): Gegenstand[] {
  return Object.values(GEGENSTAENDE)
}

export function blockFaellt(id: string): boolean {
  return Boolean(gegenstandById(id)?.faellt)
}

const NICHT_SETZBAR = new Set([
  "holzpickel",
  "pickel",
  "eisenpickel",
  "diamantpickel",
  "axt",
  "schwert",
  "stock",
  "kohle",
  "diamant",
  "eimer",
  "weizen",
  "brot",
  "holzschaufel",
  "schaufel",
  "eisenschaufel",
  "diamantschaufel",
  "hacke",
  "feder",
  "ei",
  "leder",
  "milcheimer",
  "schere",
])

export function istWerkzeug(id: string): boolean {
  return (
    id === "holzpickel" ||
    id === "pickel" ||
    id === "eisenpickel" ||
    id === "diamantpickel" ||
    id === "axt" ||
    id === "schwert" ||
    id === "eimer" ||
    id === "wassereimer" ||
    id === "hacke" ||
    id === "schere" ||
    id === "milcheimer" ||
    id.endsWith("schaufel")
  )
}

export function istSetzbar(id: string): boolean {
  return !NICHT_SETZBAR.has(id)
}
