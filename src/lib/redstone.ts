// Redstone wie im echten Minecraft (Kernstück): Quellen speisen
// Staub-Leitungen mit Stärke 15, jede Zelle Staub verliert 1,
// Verbraucher (Lampe, Tür) schalten bei anliegendem Signal.

import type { GesetzterBlock } from "./bauen"
import type { Zelle } from "./spielflaeche"

export const SIGNAL_MAX = 15

// Quellen geben Strom ab, wenn sie "an" sind (Fackel: immer)
export function istQuelle(gegenstandId: string): boolean {
  return (
    gegenstandId === "hebel" ||
    gegenstandId === "knopf" ||
    gegenstandId === "redstonefackel"
  )
}

export function istLeitung(gegenstandId: string): boolean {
  return gegenstandId === "redstone"
}

export function istVerbraucher(gegenstandId: string): boolean {
  return gegenstandId === "redstonelampe" || gegenstandId === "tuer"
}

// Zum Antippen: Hebel rastet, Knopf pulst
export function istSchaltbar(gegenstandId: string): boolean {
  return (
    gegenstandId === "hebel" ||
    gegenstandId === "knopf" ||
    // Türen öffnet man auch von Hand — antippen genügt
    gegenstandId === "tuer"
  )
}

function schluessel(zelle: Zelle): string {
  return `${zelle.ix},${zelle.iy},${zelle.iz}`
}

const NACHBARN: readonly [number, number, number][] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
]

// Berechnet, welche Blöcke unter Strom stehen. Rückgabe: Block-Ids —
// aktive Quellen, stromführender Staub, geschaltete Verbraucher.
export function berechneStrom(bloecke: GesetzterBlock[]): Set<string> {
  const anZellen = new Map<string, GesetzterBlock>()
  for (const block of bloecke) anZellen.set(schluessel(block.zelle), block)

  // Signalstärke pro Staub-Zelle (BFS von den Quellen aus)
  const staerke = new Map<string, number>()
  const warteschlange: { zelle: Zelle; wert: number }[] = []

  const aktiveQuellen: GesetzterBlock[] = []
  for (const block of bloecke) {
    if (!istQuelle(block.gegenstandId)) continue
    const an = block.gegenstandId === "redstonefackel" || block.an === true
    if (!an) continue
    aktiveQuellen.push(block)
    for (const [dx, dy, dz] of NACHBARN) {
      const nachbar = {
        ix: block.zelle.ix + dx,
        iy: block.zelle.iy + dy,
        iz: block.zelle.iz + dz,
      }
      const dort = anZellen.get(schluessel(nachbar))
      if (dort && istLeitung(dort.gegenstandId)) {
        warteschlange.push({ zelle: nachbar, wert: SIGNAL_MAX })
      }
    }
  }

  while (warteschlange.length > 0) {
    const { zelle, wert } = warteschlange.shift()!
    const key = schluessel(zelle)
    if ((staerke.get(key) ?? 0) >= wert) continue
    staerke.set(key, wert)
    if (wert <= 1) continue
    for (const [dx, dy, dz] of NACHBARN) {
      const nachbar = {
        ix: zelle.ix + dx,
        iy: zelle.iy + dy,
        iz: zelle.iz + dz,
      }
      const dort = anZellen.get(schluessel(nachbar))
      if (dort && istLeitung(dort.gegenstandId)) {
        warteschlange.push({ zelle: nachbar, wert: wert - 1 })
      }
    }
  }

  const unterStrom = new Set<string>()
  for (const quelle of aktiveQuellen) unterStrom.add(quelle.id)
  // Von Hand geöffnete Türen bleiben offen, auch ohne Strom
  for (const block of bloecke) {
    if (block.gegenstandId === "tuer" && block.an === true) {
      unterStrom.add(block.id)
    }
  }
  for (const block of bloecke) {
    if (istLeitung(block.gegenstandId)) {
      if ((staerke.get(schluessel(block.zelle)) ?? 0) > 0) {
        unterStrom.add(block.id)
      }
      continue
    }
    if (!istVerbraucher(block.gegenstandId)) continue
    // Verbraucher schalten, wenn eine aktive Quelle oder stromführender
    // Staub direkt anliegt
    for (const [dx, dy, dz] of NACHBARN) {
      const nachbar = anZellen.get(
        schluessel({
          ix: block.zelle.ix + dx,
          iy: block.zelle.iy + dy,
          iz: block.zelle.iz + dz,
        }),
      )
      if (!nachbar) continue
      const quelleAn =
        istQuelle(nachbar.gegenstandId) &&
        (nachbar.gegenstandId === "redstonefackel" || nachbar.an === true)
      const staubAn =
        istLeitung(nachbar.gegenstandId) &&
        (staerke.get(schluessel(nachbar.zelle)) ?? 0) > 0
      if (quelleAn || staubAn) {
        unterStrom.add(block.id)
        break
      }
    }
  }
  return unterStrom
}
