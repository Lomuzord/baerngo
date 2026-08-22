// Client-sichere Ortsdaten: Namen, Aliasse und Koordinaten der
// Sehenswürdigkeiten — OHNE Quizfragen und Antworten. Alles, was im
// Browser-Bundle landet, importiert von hier; die Quizlösungen leben
// ausschliesslich in katalog.ts (nur Server/Tests).
export type Lage = {
  lat: number
  lng: number
}

export type SehenswuerdigkeitKarte = {
  id: string
  name: string
  alias: string[]
  lage: Lage
}

const ORTE: readonly SehenswuerdigkeitKarte[] = [
  {
    id: "zytglogge",
    name: "Zytglogge",
    alias: ["Zytglogä", "Zeitglockenturm"],
    lage: { lat: 46.94798, lng: 7.44743 },
  },
  {
    id: "muenster",
    name: "Berner Münster",
    alias: ["Münster"],
    lage: { lat: 46.94722, lng: 7.45139 },
  },
  {
    id: "baerengraben",
    name: "Bärengraben",
    alias: ["Bärenpark"],
    lage: { lat: 46.94792, lng: 7.45973 },
  },
  {
    id: "bundeshaus",
    name: "Bundeshaus",
    alias: ["Parlamentsgebäude"],
    lage: { lat: 46.94654, lng: 7.44433 },
  },
  {
    id: "rosengarten",
    name: "Rosengarten",
    alias: ["Rosengarte"],
    lage: { lat: 46.951, lng: 7.46 },
  },
  {
    id: "kaefigturm",
    name: "Käfigturm",
    alias: ["Chäfigturm"],
    lage: { lat: 46.9481, lng: 7.4465 },
  },
  {
    id: "einsteinhaus",
    name: "Einsteinhaus",
    alias: ["Einstein-Haus", "Kramgasse 49"],
    lage: { lat: 46.9478, lng: 7.4482 },
  },
  {
    id: "zentrum-paul-klee",
    name: "Zentrum Paul Klee",
    alias: ["ZPK"],
    lage: { lat: 46.9489, lng: 7.4736 },
  },
  {
    id: "gurten",
    name: "Gurten",
    alias: ["Gurten Kulm", "Berner Hausberg"],
    lage: { lat: 46.9198, lng: 7.4394 },
  },
  {
    id: "kunstmuseum",
    name: "Kunstmuseum Bern",
    alias: ["Kunstmuseum"],
    lage: { lat: 46.9497, lng: 7.4442 },
  },
  {
    id: "nydeggkirche",
    name: "Nydeggkirche",
    alias: ["Nydegg"],
    lage: { lat: 46.9484, lng: 7.4587 },
  },
  {
    id: "botanischer-garten",
    name: "Botanischer Garten",
    alias: ["BOGA", "Altenbergrain"],
    lage: { lat: 46.9524, lng: 7.4443 },
  },
  {
    id: "heiliggeistkirche",
    name: "Heiliggeistkirche",
    alias: ["Heiliggeist"],
    lage: { lat: 46.948, lng: 7.4407 },
  },
  {
    id: "franzoesische-kirche",
    name: "Französische Kirche",
    alias: ["Eglise française"],
    lage: { lat: 46.9494, lng: 7.4459 },
  },
  {
    id: "tierpark",
    name: "Tierpark Dählhölzli",
    alias: ["Dählhölzli", "Tierpark Bern"],
    lage: { lat: 46.9346, lng: 7.4527 },
  },
  {
    id: "kornhaus",
    name: "Kornhaus",
    alias: ["Kornhauskeller"],
    lage: { lat: 46.9486, lng: 7.4479 },
  },
  {
    id: "naturhistorisches-museum",
    name: "Naturhistorisches Museum",
    alias: ["NMBE", "Barry"],
    lage: { lat: 46.9436, lng: 7.4493 },
  },
  {
    id: "universitaet",
    name: "Universität Bern",
    alias: ["Uni Bern", "Grosse Schanze"],
    lage: { lat: 46.9505, lng: 7.4384 },
  },
  {
    id: "gibb",
    name: "GIBB Bern",
    alias: ["gibb", "Berufsfachschule Bern", "Lorrainestrasse"],
    lage: { lat: 46.9546, lng: 7.44467 },
  },
]

export function listOrte(): readonly SehenswuerdigkeitKarte[] {
  return ORTE
}

export function ortById(id: string): SehenswuerdigkeitKarte | undefined {
  return ORTE.find((eintrag) => eintrag.id === id)
}
