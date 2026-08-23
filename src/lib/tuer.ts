// Türen wie in Minecraft: Zwei nebeneinander bilden eine Doppeltür.
// Die Angeln sitzen dann aussen, die Flügel öffnen zur Mitte hin.

import type { GesetzterBlock } from "./bauen"

// Der rechte Flügel eines Paares wird gespiegelt aufgehängt.
export function tuerGespiegelt(
  bloecke: readonly GesetzterBlock[],
  block: GesetzterBlock,
): boolean {
  if (block.gegenstandId !== "tuer") return false
  return bloecke.some(
    (nachbar) =>
      nachbar.gegenstandId === "tuer" &&
      nachbar.id !== block.id &&
      nachbar.zelle.iz === block.zelle.iz &&
      nachbar.zelle.iy === block.zelle.iy &&
      nachbar.zelle.ix === block.zelle.ix - 1,
  )
}

// Wie weit und in welche Richtung der Flügel aufschwingt (Bogenmass).
export function tuerWinkel(offen: boolean, gespiegelt: boolean): number {
  if (!offen) return 0
  return gespiegelt ? -Math.PI / 2 : Math.PI / 2
}
