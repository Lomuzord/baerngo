// Farming wie im echten Minecraft: Setzlinge wachsen zu Bäumen,
// Samen zu Weizen — nach echter Wartezeit, auch wenn die App zu ist.

import { kannBlockSetzen, type GesetzterBlock } from "./bauen"
import { EBENE_RADIUS_ZELLEN, PLATTE_MAX_HOEHE, type Zelle } from "./spielflaeche"

export const WACHSZEIT_BAUM_MS = 5 * 60_000
export const WACHSZEIT_WEIZEN_MS = 3 * 60_000

// Pflanzen: brauchen Boden unter sich und poppen ab, wenn er verschwindet.
export function istPflanze(gegenstandId: string): boolean {
  return (
    gegenstandId === "setzling" ||
    gegenstandId === "samen" ||
    gegenstandId === "weizen"
  )
}

// Setzlinge und Samen brauchen Boden unter sich: die Rasenplatte
// selbst (iy 0) oder einen Erd-/Gras-Block direkt darunter.
export function kannPflanzen(
  bloecke: GesetzterBlock[],
  gegenstandId: string,
  zelle: Zelle,
): boolean {
  if (gegenstandId !== "setzling" && gegenstandId !== "samen") return true
  if (zelle.iy === 0) return true
  const darunter = bloecke.find(
    (block) =>
      block.zelle.ix === zelle.ix &&
      block.zelle.iy === zelle.iy - 1 &&
      block.zelle.iz === zelle.iz,
  )
  return (
    darunter?.gegenstandId === "erde" ||
    darunter?.gegenstandId === "gras" ||
    darunter?.gegenstandId === "ackerboden"
  )
}

// Lässt alles wachsen, was reif ist. Gibt bei Nichtstun dieselbe
// Referenz zurück, damit Aufrufer billig vergleichen können.
export function wendeWachstumAn(
  bloecke: GesetzterBlock[],
  jetzt: number,
): GesetzterBlock[] {
  let liste = bloecke
  let veraendert = false
  for (const block of bloecke) {
    if (block.gesetztUm == null) continue
    const alter = jetzt - block.gesetztUm
    // Auf Ackerboden reift Weizen doppelt so schnell
    const aufAcker = bloecke.some(
      (eintrag) =>
        eintrag.gegenstandId === "ackerboden" &&
        eintrag.zelle.ix === block.zelle.ix &&
        eintrag.zelle.iz === block.zelle.iz &&
        eintrag.zelle.iy === block.zelle.iy - 1,
    )
    const weizenZeit = aufAcker ? WACHSZEIT_WEIZEN_MS / 2 : WACHSZEIT_WEIZEN_MS
    if (block.gegenstandId === "samen" && alter >= weizenZeit) {
      liste = liste.map((eintrag) =>
        eintrag.id === block.id
          ? {
              id: `weizen-${block.zelle.ix}-${block.zelle.iy}-${block.zelle.iz}-w${jetzt}`,
              gegenstandId: "weizen",
              zelle: eintrag.zelle,
            }
          : eintrag,
      )
      veraendert = true
    }
    if (block.gegenstandId === "setzling" && alter >= WACHSZEIT_BAUM_MS) {
      liste = wachseBaum(
        liste.filter((eintrag) => eintrag.id !== block.id),
        block.zelle,
        jetzt,
      )
      veraendert = true
    }
  }
  return veraendert ? liste : bloecke
}

// Kleiner Minecraft-Baum: zwei Stamm-Blöcke, Laubkrone darüber.
function wachseBaum(
  bloecke: GesetzterBlock[],
  fuss: Zelle,
  jetzt: number,
): GesetzterBlock[] {
  const plan: { gegenstandId: string; zelle: Zelle }[] = [
    { gegenstandId: "holz", zelle: fuss },
    { gegenstandId: "holz", zelle: { ...fuss, iy: fuss.iy + 1 } },
    { gegenstandId: "laub", zelle: { ...fuss, iy: fuss.iy + 2 } },
    { gegenstandId: "laub", zelle: { ...fuss, ix: fuss.ix + 1, iy: fuss.iy + 2 } },
    { gegenstandId: "laub", zelle: { ...fuss, ix: fuss.ix - 1, iy: fuss.iy + 2 } },
    { gegenstandId: "laub", zelle: { ...fuss, iz: fuss.iz + 1, iy: fuss.iy + 2 } },
    { gegenstandId: "laub", zelle: { ...fuss, iz: fuss.iz - 1, iy: fuss.iy + 2 } },
    { gegenstandId: "laub", zelle: { ...fuss, iy: fuss.iy + 3 } },
  ]
  let liste = bloecke
  for (const teil of plan) {
    if (
      Math.abs(teil.zelle.ix) > EBENE_RADIUS_ZELLEN ||
      Math.abs(teil.zelle.iz) > EBENE_RADIUS_ZELLEN ||
      teil.zelle.iy < 0 ||
      teil.zelle.iy >= PLATTE_MAX_HOEHE ||
      !kannBlockSetzen(liste, teil.zelle)
    ) {
      continue
    }
    liste = [
      ...liste,
      {
        id: `${teil.gegenstandId}-${teil.zelle.ix}-${teil.zelle.iy}-${teil.zelle.iz}-w${jetzt}`,
        gegenstandId: teil.gegenstandId,
        zelle: teil.zelle,
      },
    ]
  }
  return liste
}

// Was ein abgebauter Block auf der Platte fallen lässt.
// Weizen gibt wie in Minecraft Weizen plus 1-2 Samen zurück,
// Wasser verläuft ohne Beute.
export function ernteDrops(
  gegenstandId: string,
  abbauDrop: (id: string) => string,
  zufall: () => number = Math.random,
): { gegenstandId: string; anzahl: number }[] {
  if (gegenstandId === "wasser") return []
  if (gegenstandId === "weizen") {
    return [
      { gegenstandId: "weizen", anzahl: 1 },
      { gegenstandId: "samen", anzahl: zufall() < 0.5 ? 2 : 1 },
    ]
  }
  return [{ gegenstandId: abbauDrop(gegenstandId), anzahl: 1 }]
}
