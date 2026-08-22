export type Umwelt =
  | "park"
  | "wald"
  | "wasser"
  | "stadt"
  | "strasse"
  | "feld"
  | "unbekannt"

export type Merkmal = {
  layerId: string
  klasse?: string
  typ?: string
}

const POOLS: Record<Umwelt, readonly string[]> = {
  park: ["laub", "laub", "stamm", "gras", "moosstein"],
  // Diamanterz ist selten (1 von 10) und nur tief im Wald zu finden
  wald: [
    "stamm",
    "stamm",
    "stamm",
    "laub",
    "laub",
    "gras",
    "kohleerz",
    "kohleerz",
    "eisenerz",
    "diamanterz",
  ],
  wasser: ["kies", "sand", "lehm"],
  stadt: ["stein", "ziegel", "sandstein", "andesit", "eisenerz"],
  strasse: ["stein", "kies", "andesit", "golderz"],
  feld: ["gras", "gras", "sand", "erde", "lehm"],
  unbekannt: [
    "gras",
    "stamm",
    "stein",
    "kies",
    "laub",
    "sand",
    "kohleerz",
    "lehm",
    "sandstein",
    "eisenerz",
  ],
}

export function umweltAusMerkmalen(merkmale: readonly Merkmal[]): Umwelt {
  const sinnvoll = merkmale.filter((merkmal) => !istBeschriftung(merkmal))
  if (sinnvoll.some((merkmal) => istWasser(merkmal))) return "wasser"
  if (sinnvoll.some((merkmal) => istWald(merkmal))) return "wald"
  if (sinnvoll.some((merkmal) => istPark(merkmal))) return "park"
  if (sinnvoll.some((merkmal) => istGebaeude(merkmal))) return "stadt"
  if (sinnvoll.some((merkmal) => istFeld(merkmal))) return "feld"
  if (sinnvoll.some((merkmal) => istStrasse(merkmal))) return "strasse"
  if (sinnvoll.length === 0) return "unbekannt"
  return "feld"
}

export function spawnErlaubt(umwelt: Umwelt): boolean {
  return umwelt !== "wasser"
}

export function spawnFuerUmwelt(
  umwelt: Umwelt,
  zufall: () => number = Math.random,
): string {
  const pool = POOLS[umwelt]
  const index = Math.min(pool.length - 1, Math.floor(zufall() * pool.length))
  return pool[index] ?? "gras"
}

export function poolFuerUmwelt(umwelt: Umwelt): readonly string[] {
  return POOLS[umwelt]
}

function textVon(merkmal: Merkmal): string {
  return `${merkmal.layerId} ${merkmal.klasse ?? ""} ${merkmal.typ ?? ""}`.toLowerCase()
}

function istBeschriftung(merkmal: Merkmal): boolean {
  const text = textVon(merkmal)
  return (
    text.includes("label") ||
    text.includes("symbol") ||
    text.includes("place-") ||
    text.includes("poi") ||
    merkmal.typ === "symbol"
  )
}

function istWasser(merkmal: Merkmal): boolean {
  const id = merkmal.layerId.toLowerCase()
  const klasse = (merkmal.klasse ?? "").toLowerCase()
  if (merkmal.typ === "symbol" || id.includes("label") || id.includes("shadow")) {
    return false
  }
  return (
    id === "water" ||
    id.startsWith("water") ||
    klasse === "water" ||
    klasse === "river" ||
    klasse === "stream"
  )
}

function istWald(merkmal: Merkmal): boolean {
  const text = textVon(merkmal)
  return (
    text.includes("wood") ||
    text.includes("forest") ||
    (text.includes("landcover") && text.includes("tree"))
  )
}

function istPark(merkmal: Merkmal): boolean {
  const text = textVon(merkmal)
  return (
    text.includes("park") ||
    text.includes("grass") ||
    text.includes("cemetery") ||
    text.includes("garden") ||
    text.includes("pitch")
  )
}

function istStrasse(merkmal: Merkmal): boolean {
  const text = textVon(merkmal)
  return (
    text.includes("road") ||
    text.includes("street") ||
    text.includes("path") ||
    text.includes("bridge")
  )
}

function istGebaeude(merkmal: Merkmal): boolean {
  return textVon(merkmal).includes("building")
}

function istFeld(merkmal: Merkmal): boolean {
  const text = textVon(merkmal)
  return (
    text.includes("farm") ||
    text.includes("crop") ||
    text.includes("agriculture") ||
    text.includes("meadow") ||
    text.includes("scrub")
  )
}
