// Sammelalbum: welche Gegenstände der Spieler schon einmal im
// Inventar hatte. Unentdecktes zeigt das Album nur als Silhouette.

import { gegenstandById, listGegenstaende, type Gegenstand } from "./gegenstaende"

// Diese Blöcke können nie im Inventar landen (Wasser verläuft,
// Ackerboden wird beim Abbauen zu Erde) — sie gehören nicht ins Album.
const NICHT_SAMMELBAR = new Set(["wasser", "ackerboden"])

export function albumGegenstaende(): Gegenstand[] {
  return listGegenstaende().filter(
    (gegenstand) => !NICHT_SAMMELBAR.has(gegenstand.id),
  )
}

export function parseAlbum(roh: unknown): string[] {
  if (!Array.isArray(roh)) return []
  const gueltig = new Set(albumGegenstaende().map((g) => g.id))
  return [
    ...new Set(
      roh.filter(
        (id): id is string => typeof id === "string" && gueltig.has(id),
      ),
    ),
  ]
}

// Merkt sich neu entdeckte Gegenstände; gibt bei nichts Neuem dieselbe
// Referenz zurück.
export function merkeEntdeckt(
  album: string[],
  ids: readonly string[],
): { album: string[]; neu: string[] } {
  const schon = new Set(album)
  const gueltig = new Set(albumGegenstaende().map((g) => g.id))
  const neu = [
    ...new Set(ids.filter((id) => gueltig.has(id) && !schon.has(id))),
  ]
  if (neu.length === 0) return { album, neu }
  return { album: [...album, ...neu], neu }
}

export function albumNamen(ids: readonly string[]): string {
  return ids.map((id) => gegenstandById(id)?.name ?? id).join(" · ")
}
