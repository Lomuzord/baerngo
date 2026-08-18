export type Lage = {
  lat: number
  lng: number
}

export type Quiz = {
  frage: string
  optionen: string[]
  richtigeAntwort: string
}

export type Sehenswuerdigkeit = {
  id: string
  name: string
  alias: string[]
  lage: Lage
  quiz: Quiz
}

export type SehenswuerdigkeitKarte = {
  id: string
  name: string
  alias: string[]
  lage: Lage
}

export type QuizOhneLoesung = {
  frage: string
  optionen: string[]
}

const KATALOG: readonly Sehenswuerdigkeit[] = [
  {
    id: "zytglogge",
    name: "Zytglogge",
    alias: ["Zytglogä", "Zeitglockenturm"],
    lage: { lat: 46.94798, lng: 7.44743 },
    quiz: {
      frage: "Wofür ist der Zytglogge (Zytglogä) berühmt?",
      optionen: [
        "Astronomische Uhr und Glockenspiel",
        "Der höchste Turm der Schweiz",
        "Sitz der Bundesversammlung",
      ],
      richtigeAntwort: "Astronomische Uhr und Glockenspiel",
    },
  },
  {
    id: "muenster",
    name: "Berner Münster",
    alias: ["Münster"],
    lage: { lat: 46.94722, lng: 7.45139 },
    quiz: {
      frage: "Was ist das Berner Münster?",
      optionen: [
        "Ein Rathaus",
        "Die grösste gotische Kirche der Schweiz",
        "Ein Bahnhof",
      ],
      richtigeAntwort: "Die grösste gotische Kirche der Schweiz",
    },
  },
  {
    id: "baerengraben",
    name: "Bärengraben",
    alias: ["Bärenpark"],
    lage: { lat: 46.94792, lng: 7.45973 },
    quiz: {
      frage: "Welches Tier wird am Bärengraben gehalten?",
      optionen: ["Wölfe", "Hirsche", "Bären"],
      richtigeAntwort: "Bären",
    },
  },
  {
    id: "bundeshaus",
    name: "Bundeshaus",
    alias: ["Parlamentsgebäude"],
    lage: { lat: 46.94654, lng: 7.44433 },
    quiz: {
      frage: "Was geschieht im Bundeshaus?",
      optionen: [
        "Bundesrat und Parlament tagen dort",
        "Dort wohnt der Stadtbär",
        "Es ist das mittelalterliche Stadttor",
      ],
      richtigeAntwort: "Bundesrat und Parlament tagen dort",
    },
  },
  {
    id: "gibb",
    name: "GIBB",
    alias: ["gibb Berufsfachschule Bern"],
    lage: { lat: 46.9546, lng: 7.44467 },
    quiz: {
      frage: "Was ist die GIBB?",
      optionen: [
        "Die gewerblich-industrielle Berufsfachschule Bern",
        "Das Berner Rathaus",
        "Ein Bärengehege",
      ],
      richtigeAntwort: "Die gewerblich-industrielle Berufsfachschule Bern",
    },
  },
]

export function listSehenswuerdigkeiten(): readonly Sehenswuerdigkeit[] {
  return KATALOG
}

export function sehenswuerdigkeitById(
  id: string,
): Sehenswuerdigkeit | undefined {
  return KATALOG.find((eintrag) => eintrag.id === id)
}

export function listSehenswuerdigkeitenFuerKarte(): SehenswuerdigkeitKarte[] {
  return KATALOG.map(({ id, name, alias, lage }) => ({
    id,
    name,
    alias,
    lage,
  }))
}

export function quizOhneLoesung(id: string): QuizOhneLoesung | undefined {
  const eintrag = sehenswuerdigkeitById(id)
  if (!eintrag) return undefined
  return {
    frage: eintrag.quiz.frage,
    optionen: [...eintrag.quiz.optionen],
  }
}
