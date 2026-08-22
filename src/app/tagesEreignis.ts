"use client"

// Zentrale Meldestelle für Tagesaufgaben-Ereignisse: Spielpfade rufen
// meldeTagesEreignis, die Kartenanzeige lauscht auf das Ereignis.

import {
  alleGeschafft,
  aufgabenFuer,
  heutigesDatum,
  meldeEreignis,
  parseTagesStand,
  type AufgabenArt,
  type TagesStand,
} from "@/lib/tagesaufgaben"

const SPEICHER = "baerngo-tagesaufgaben"
export const AUFGABEN_EREIGNIS = "baerngo-aufgaben"

export function leseTagesStand(): TagesStand {
  const datum = heutigesDatum()
  if (typeof window === "undefined") {
    return { datum, zaehler: {}, belohnt: false }
  }
  try {
    const roh = window.localStorage.getItem(SPEICHER)
    return parseTagesStand(roh ? JSON.parse(roh) : null, datum)
  } catch {
    return { datum, zaehler: {}, belohnt: false }
  }
}

export function meldeTagesEreignis(
  art: AufgabenArt,
  anzahl: number,
  zielId?: string,
) {
  if (typeof window === "undefined") return
  const datum = heutigesDatum()
  const stand = leseTagesStand()
  const danach = meldeEreignis(stand, aufgabenFuer(datum), art, anzahl, zielId)
  if (danach === stand) return
  window.localStorage.setItem(SPEICHER, JSON.stringify(danach))
  window.dispatchEvent(new Event(AUFGABEN_EREIGNIS))
}

// Markiert die Tagesbelohnung als abgeholt; false, wenn (noch) nicht dran.
export function holeTagesBelohnung(): boolean {
  const stand = leseTagesStand()
  if (stand.belohnt) return false
  if (!alleGeschafft(aufgabenFuer(stand.datum), stand)) return false
  window.localStorage.setItem(
    SPEICHER,
    JSON.stringify({ ...stand, belohnt: true }),
  )
  window.dispatchEvent(new Event(AUFGABEN_EREIGNIS))
  return true
}
