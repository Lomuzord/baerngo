// Brunnen-Abzeichen: die berühmten Altstadt-Brunnen als
// Mini-Collectibles — vorbeilaufen genügt.

import type { Lage } from "./orte"
import { distanzMeter } from "./reichweite"
import type { Beute } from "./sammeln"

export type Brunnen = {
  id: string
  name: string
  lage: Lage
}

export const BRUNNEN_SAMMEL_METER = 25

export const BRUNNEN: readonly Brunnen[] = [
  {
    id: "kindlifresserbrunnen",
    name: "Kindlifresserbrunnen",
    lage: { lat: 46.94847, lng: 7.44786 },
  },
  {
    id: "zaehringerbrunnen",
    name: "Zähringerbrunnen",
    lage: { lat: 46.94815, lng: 7.44883 },
  },
  {
    id: "simsonbrunnen",
    name: "Simsonbrunnen",
    lage: { lat: 46.94794, lng: 7.45078 },
  },
  {
    id: "gerechtigkeitsbrunnen",
    name: "Gerechtigkeitsbrunnen",
    lage: { lat: 46.94834, lng: 7.45414 },
  },
  {
    id: "mosesbrunnen",
    name: "Mosesbrunnen",
    lage: { lat: 46.94733, lng: 7.45123 },
  },
  {
    id: "pfeiferbrunnen",
    name: "Pfeiferbrunnen",
    lage: { lat: 46.94809, lng: 7.44222 },
  },
  {
    id: "annaseilerbrunnen",
    name: "Anna-Seiler-Brunnen",
    lage: { lat: 46.94823, lng: 7.44096 },
  },
  {
    id: "laeuferbrunnen",
    name: "Läuferbrunnen",
    lage: { lat: 46.94877, lng: 7.45850 },
  },
]

export function brunnenById(id: string): Brunnen | undefined {
  return BRUNNEN.find((brunnen) => brunnen.id === id)
}

// Welche Brunnen jetzt neu eingesammelt werden (nah genug und noch
// nicht in der Sammlung).
export function neuGesammelt(
  gesammelt: readonly string[],
  lage: Lage,
): string[] {
  const schon = new Set(gesammelt)
  return BRUNNEN.filter(
    (brunnen) =>
      !schon.has(brunnen.id) &&
      distanzMeter(brunnen.lage, lage) <= BRUNNEN_SAMMEL_METER,
  ).map((brunnen) => brunnen.id)
}

export function sammlungKomplett(gesammelt: readonly string[]): boolean {
  const schon = new Set(gesammelt)
  return BRUNNEN.every((brunnen) => schon.has(brunnen.id))
}

// Einmalige Belohnung für die volle Sammlung
export const BRUNNEN_BELOHNUNG: readonly Beute[] = [
  { gegenstandId: "diamant", anzahl: 3 },
  { gegenstandId: "gold", anzahl: 5 },
  { gegenstandId: "smaragd", anzahl: 1 },
]

export type BrunnenStand = {
  gesammelt: string[]
  belohnt: boolean
}

export function parseBrunnenStand(roh: unknown): BrunnenStand {
  if (!roh || typeof roh !== "object" || Array.isArray(roh)) {
    return { gesammelt: [], belohnt: false }
  }
  const stand = roh as { gesammelt?: unknown; belohnt?: unknown }
  const gueltig = new Set(BRUNNEN.map((brunnen) => brunnen.id))
  const gesammelt = Array.isArray(stand.gesammelt)
    ? [...new Set(stand.gesammelt.filter(
        (id): id is string => typeof id === "string" && gueltig.has(id),
      ))]
    : []
  return { gesammelt, belohnt: stand.belohnt === true }
}
