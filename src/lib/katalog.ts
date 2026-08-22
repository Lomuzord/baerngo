// ACHTUNG: Diese Datei enthält die Quiz-LÖSUNGEN. Sie darf nur von
// Server-Code (Pages, Server Actions) und Tests importiert werden —
// Client-Bausteine holen Ortsdaten aus ./orte, damit die Antworten
// nie im Browser-Bundle landen.
import { listOrte, type Lage, type SehenswuerdigkeitKarte } from "./orte"

export type { Lage, SehenswuerdigkeitKarte }

export type Quiz = {
  frage: string
  optionen: string[]
  richtigeAntwort: string
}

export type Sehenswuerdigkeit = SehenswuerdigkeitKarte & {
  quizze: Quiz[]
}

export type QuizOhneLoesung = {
  frageId: number
  frage: string
  optionen: string[]
}

const ERSTFRAGEN: Record<string, Quiz> = {
  zytglogge: {
    frage: "Wer baute 1527–1530 die astronomische Uhr des Zytglogge?",
    optionen: [
      "Kaspar Brunner",
      "Erasmus Ritter",
      "Niklaus Manuel",
      "Joseph Simon Volmar",
    ],
    richtigeAntwort: "Kaspar Brunner",
  },
  muenster: {
    frage: "Wie hoch ist der Turm des Berner Münsters?",
    optionen: ["84 Meter", "100,6 Meter", "72 Meter", "116 Meter"],
    richtigeAntwort: "100,6 Meter",
  },
  baerengraben: {
    frage:
      "Aus welcher Schlacht brachten Berner 1513 den ersten bezeugten Bären als Beute heim?",
    optionen: [
      "Schlacht bei Novara",
      "Schlacht bei Murten",
      "Schlacht bei Sempach",
      "Schlacht bei Marignano",
    ],
    richtigeAntwort: "Schlacht bei Novara",
  },
  bundeshaus: {
    frage:
      "Wer plante das 1902 eingeweihte Parlamentsgebäude (Bundeshaus Mitte)?",
    optionen: [
      "Hans Wilhelm Auer",
      "Jakob Friedrich Studer",
      "Alfred Friedrich Bluntschli",
      "Karl Moser",
    ],
    richtigeAntwort: "Hans Wilhelm Auer",
  },
  rosengarten: {
    frage: "Wie viele Rosensorten wachsen im Berner Rosengarten?",
    optionen: ["Rund 80", "Rund 120", "Rund 220", "Rund 400"],
    richtigeAntwort: "Rund 220",
  },
  kaefigturm: {
    frage: "Wozu diente der Käfigturm bis ins 19. Jahrhundert?",
    optionen: [
      "Als Gefängnis",
      "Als Kornspeicher",
      "Als Münzprägerei",
      "Als Wohnturm des Schultheissen",
    ],
    richtigeAntwort: "Als Gefängnis",
  },
  einsteinhaus: {
    frage:
      "In welchem Jahr veröffentlichte Albert Einstein in Bern die Spezielle Relativitätstheorie?",
    optionen: ["1899", "1905", "1912", "1921"],
    richtigeAntwort: "1905",
  },
  "zentrum-paul-klee": {
    frage: "Welcher Architekt entwarf die drei Wellen des Zentrum Paul Klee?",
    optionen: [
      "Renzo Piano",
      "Mario Botta",
      "Santiago Calatrava",
      "Herzog & de Meuron",
    ],
    richtigeAntwort: "Renzo Piano",
  },
  gurten: {
    frage: "Womit fährt man seit 1899 klassisch auf den Gurten?",
    optionen: [
      "Mit der Gurtenbahn",
      "Mit einer Gondelbahn",
      "Mit dem Sessellift",
      "Mit dem Tram",
    ],
    richtigeAntwort: "Mit der Gurtenbahn",
  },
  kunstmuseum: {
    frage:
      "Das Kunstmuseum Bern ist das älteste Kunstmuseum der Schweiz mit ständiger Sammlung. Wann wurde es eröffnet?",
    optionen: ["1848", "1879", "1902", "1936"],
    richtigeAntwort: "1879",
  },
  nydeggkirche: {
    frage: "Was stand an der Stelle der Nydeggkirche, bevor sie gebaut wurde?",
    optionen: [
      "Eine Zähringerburg",
      "Ein Kloster",
      "Ein Kornhaus",
      "Ein Spital",
    ],
    richtigeAntwort: "Eine Zähringerburg",
  },
  "botanischer-garten": {
    frage:
      "Wie viele Pflanzenarten wachsen ungefähr im Botanischen Garten Bern?",
    optionen: ["Rund 1500", "Rund 3000", "Rund 5500", "Rund 9000"],
    richtigeAntwort: "Rund 5500",
  },
  heiliggeistkirche: {
    frage:
      "In welchem Baustil wurde die Heiliggeistkirche 1726–1729 errichtet?",
    optionen: ["Barock", "Gotik", "Romanik", "Klassizismus"],
    richtigeAntwort: "Barock",
  },
  "franzoesische-kirche": {
    frage:
      "Die Französische Kirche ist Berns älteste Kirche. Welchem Orden gehörte sie ursprünglich?",
    optionen: [
      "Den Dominikanern",
      "Den Franziskanern",
      "Den Benediktinern",
      "Den Jesuiten",
    ],
    richtigeAntwort: "Den Dominikanern",
  },
  tierpark: {
    frage:
      "Auf welche Tiere konzentriert sich der Tierpark Dählhölzli vor allem?",
    optionen: [
      "Europäische Tiere",
      "Afrikanische Savannentiere",
      "Tropische Reptilien",
      "Meerestiere",
    ],
    richtigeAntwort: "Europäische Tiere",
  },
  kornhaus: {
    frage:
      "Was befindet sich heute im barocken Gewölbekeller des Kornhauses?",
    optionen: [
      "Ein Restaurant",
      "Ein Weinlager",
      "Ein Konzertsaal",
      "Das Stadtarchiv",
    ],
    richtigeAntwort: "Ein Restaurant",
  },
  "naturhistorisches-museum": {
    frage:
      "Welcher berühmte Bernhardiner ist im Naturhistorischen Museum ausgestellt?",
    optionen: ["Barry", "Bello", "Rex", "Nero"],
    richtigeAntwort: "Barry",
  },
  universitaet: {
    frage: "In welchem Jahr wurde die Universität Bern gegründet?",
    optionen: ["1734", "1805", "1834", "1901"],
    richtigeAntwort: "1834",
  },
  gibb: {
    frage: "Was ist die GIBB Bern an der Lorrainestrasse?",
    optionen: [
      "Die gewerblich-industrielle Berufsfachschule Bern",
      "Das Gymnasium Kirchenfeld Bern",
      "Die Pädagogische Hochschule Bern",
      "Die Universität Bern, Wirtschafts- und Sozialwissenschaft",
    ],
    richtigeAntwort: "Die gewerblich-industrielle Berufsfachschule Bern",
  },
}

// Zweite und dritte Fragen für die beliebtesten Orte — beim Wieder-
// besuch (Truhen-Cooldown) kommt so nicht immer dieselbe Frage.
const ZUSATZFRAGEN: Record<string, Quiz[]> = {
  zytglogge: [
    {
      frage: "Was war der Zytglogge, bevor er Uhrturm wurde?",
      optionen: [
        "Das westliche Stadttor Berns",
        "Ein Kornspeicher",
        "Ein Wachturm der Aare-Brücke",
        "Eine Münzprägerei",
      ],
      richtigeAntwort: "Das westliche Stadttor Berns",
    },
  ],
  muenster: [
    {
      frage:
        "Welche berühmte Skulpturengruppe schmückt das Hauptportal des Berner Münsters?",
      optionen: [
        "Das Jüngste Gericht",
        "Die zwölf Apostel",
        "Der Bärentanz",
        "Die Gründung Berns",
      ],
      richtigeAntwort: "Das Jüngste Gericht",
    },
  ],
  baerengraben: [
    {
      frage: "Seit wann leben Berns Bären im heutigen BärenPark an der Aare?",
      optionen: ["1994", "2001", "2009", "2015"],
      richtigeAntwort: "2009",
    },
  ],
  bundeshaus: [
    {
      frage: "Wie viele Sitze hat der Nationalrat, der im Bundeshaus tagt?",
      optionen: ["100", "150", "200", "246"],
      richtigeAntwort: "200",
    },
  ],
}

const WEITERE_ZUSATZFRAGEN: Record<string, Quiz[]> = {
  rosengarten: [
    {
      frage: "Was war der Rosengarten, bevor er 1913 zum Park wurde?",
      optionen: [
        "Ein Friedhof",
        "Ein Weinberg",
        "Ein Exerzierplatz",
        "Ein Gemüsemarkt",
      ],
      richtigeAntwort: "Ein Friedhof",
    },
  ],
  kaefigturm: [
    {
      frage: "Was beherbergt der Käfigturm heute?",
      optionen: [
        "Das Polit-Forum des Bundes",
        "Ein Uhrenmuseum",
        "Die Stadtbibliothek",
        "Eine Jugendherberge",
      ],
      richtigeAntwort: "Das Polit-Forum des Bundes",
    },
  ],
  einsteinhaus: [
    {
      frage: "An welcher Altstadtgasse wohnte Einstein im heutigen Einsteinhaus?",
      optionen: [
        "Kramgasse",
        "Gerechtigkeitsgasse",
        "Marktgasse",
        "Junkerngasse",
      ],
      richtigeAntwort: "Kramgasse",
    },
  ],
  gurten: [
    {
      frage: "Welches grosse Musikfestival findet jeden Sommer auf dem Gurten statt?",
      optionen: [
        "Das Gurtenfestival",
        "Das Paléo Festival",
        "Das Openair St. Gallen",
        "Das Greenfield Festival",
      ],
      richtigeAntwort: "Das Gurtenfestival",
    },
  ],
  gibb: [
    {
      frage: "An welcher Strasse liegt der Glascampus der gibb?",
      optionen: [
        "Lorrainestrasse",
        "Länggassstrasse",
        "Papiermühlestrasse",
        "Monbijoustrasse",
      ],
      richtigeAntwort: "Lorrainestrasse",
    },
  ],
  kornhaus: [
    {
      frage: "Wann wurde das Berner Kornhaus erbaut?",
      optionen: [
        "Anfang des 18. Jahrhunderts",
        "Im Mittelalter um 1300",
        "Ende des 19. Jahrhunderts",
        "In den 1950er-Jahren",
      ],
      richtigeAntwort: "Anfang des 18. Jahrhunderts",
    },
  ],
}
for (const [id, fragen] of Object.entries(WEITERE_ZUSATZFRAGEN)) {
  ZUSATZFRAGEN[id] = [...(ZUSATZFRAGEN[id] ?? []), ...fragen]
}

const QUIZZE: Record<string, Quiz[]> = Object.fromEntries(
  Object.entries(ERSTFRAGEN).map(([id, quiz]) => [
    id,
    [quiz, ...(ZUSATZFRAGEN[id] ?? [])],
  ]),
)

const KATALOG: readonly Sehenswuerdigkeit[] = listOrte().map((ort) => {
  const quizze = QUIZZE[ort.id]
  if (!quizze || quizze.length === 0) {
    throw new Error(`Quiz fehlt für Sehenswürdigkeit ${ort.id}`)
  }
  return { ...ort, quizze }
})

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
  const frageId = Math.floor(Math.random() * eintrag.quizze.length)
  const quiz = eintrag.quizze[frageId]!
  return {
    frageId,
    frage: quiz.frage,
    optionen: [...quiz.optionen],
  }
}

export function quizFrage(id: string, frageId: number): Quiz | undefined {
  const eintrag = sehenswuerdigkeitById(id)
  if (!eintrag || !Number.isInteger(frageId)) return undefined
  return eintrag.quizze[frageId]
}
